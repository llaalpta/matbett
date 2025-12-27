/**
 * Deposit Service
 * Business logic for deposits, including complex transactional effects.
 */
import { DepositSchema, DepositQualifyConditionSchema, type Deposit, type DepositEntity, type DepositListInput, type PaginatedResponse } from '@matbett/shared';
import type { IDepositService } from '@matbett/api';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { DepositRepository } from '@/repositories/deposit.repository';
import { BookmakerAccountRepository } from '@/repositories/bookmaker-account.repository';
import { toDepositCreateInput, toDepositUpdateInput, toDepositEntity } from '@/lib/transformers/deposit.transformer';
import { AppError, BadRequestError } from '@/utils/errors';

export class DepositService implements IDepositService {
  private repository: DepositRepository;
  private bookmakerAccountRepository: BookmakerAccountRepository;

  constructor() {
    this.repository = new DepositRepository();
    this.bookmakerAccountRepository = new BookmakerAccountRepository();
  }

  /**
   * Lists all deposits for a user with pagination and filters
   */
  async list(userId: string, input: DepositListInput): Promise<PaginatedResponse<DepositEntity>> {
    const { pageIndex, pageSize, bookmaker, sorting } = input;

    const where: Prisma.DepositWhereInput = {
      userId, // Always filter by user
    };

    if (bookmaker) {
      where.bookmaker = bookmaker;
    }

    // Default sorting by createdAt desc
    let orderBy: Prisma.DepositOrderByWithRelationInput = { createdAt: 'desc' };
    if (sorting && sorting.length > 0 && sorting[0]) {
      const { id, desc } = sorting[0];
      const direction = desc ? 'desc' : 'asc';
      // Allow sorting by common fields
      if (['amount', 'date', 'bookmaker', 'createdAt'].includes(id)) {
        orderBy = { [id]: direction };
      }
    }

    // Execute transaction to get data and count
    const [deposits, total] = await prisma.$transaction(async (tx) => {
      const dataPromise = this.repository.findMany(
        userId, 
        {
          where,
          orderBy,
          skip: pageIndex * pageSize,
          take: pageSize
        },
        tx
      );
      
      // Count query
      const countPromise = tx.deposit.count({ where });
      
      return Promise.all([dataPromise, countPromise]);
    });

    const depositEntities = deposits.map(toDepositEntity);
    const pageCount = Math.ceil(total / pageSize);

    return {
      data: depositEntities,
      meta: { pageCount, rowCount: total, pageIndex, pageSize },
    };
  }

  /**
   * Gets a single deposit by its ID
   */
  async getById(id: string): Promise<DepositEntity> {
    const deposit = await this.repository.findById(id);
    if (!deposit) {
      throw new AppError('Deposit not found', 404);
    }
    return toDepositEntity(deposit);
  }

  /**
   * Creates a new deposit and handles all related side effects.
   */
  async create(data: Deposit, userId: string): Promise<DepositEntity> {
    const validatedData = DepositSchema.parse(data);
    const { qualifyConditionId } = validatedData;

    if (qualifyConditionId) {
      return this.createContextualDeposit(validatedData, userId, qualifyConditionId);
    } else {
      return this.createIndependentDeposit(validatedData, userId);
    }
  }
  
  private async createIndependentDeposit(data: Deposit, userId: string): Promise<DepositEntity> {
    return prisma.$transaction(async (tx) => {
      const prismaData = toDepositCreateInput(data, userId);

      // Create deposit record
      const newDeposit = await tx.deposit.create({ data: prismaData });

      // Update bookmaker account balance
      const bookmakerAccount = await this.bookmakerAccountRepository.findByUserAndBookmaker(
        userId,
        newDeposit.bookmaker
      );

      if (!bookmakerAccount) {
        throw new BadRequestError(`Bookmaker account for ${newDeposit.bookmaker} not found for this user.`);
      }

      await tx.bookmakerAccount.update({
        where: { id: bookmakerAccount.id },
        data: { realBalance: { increment: newDeposit.amount } },
      });

      return toDepositEntity(newDeposit);
    });
  }

  private async createContextualDeposit(data: Deposit, userId: string, qualifyConditionId: string): Promise<DepositEntity> {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch condition with its parent hierarchy for cascading updates
      const condition = await tx.rewardQualifyCondition.findUnique({
        where: { id: qualifyConditionId },
        include: {
          rewards: { select: { id: true, valueType: true } },
          phase: { select: { id: true, promotionId: true } },
        },
      });

      if (!condition) throw new AppError('Qualify condition not found', 404);
      if (condition.type !== 'DEPOSIT') throw new BadRequestError('This is not a DEPOSIT condition.');

      // --- Validation Logic ---
      const conditionData = DepositQualifyConditionSchema.parse(condition.conditions);
      let isFulfilled = true;

      // Check amount based on type
      if (conditionData.conditions.contributesToRewardValue) {
        // CALCULATED VALUE: check minAmount
        if (data.amount < conditionData.conditions.minAmount) isFulfilled = false;
      } else {
        // FIXED VALUE: check targetAmount
        if (data.amount !== conditionData.conditions.targetAmount) isFulfilled = false;
      }

      // Check deposit code (common to both types)
      if (conditionData.conditions.depositCode && data.code !== conditionData.conditions.depositCode) {
        isFulfilled = false;
      }
      // TODO: Validate timeframe

      // 2. Create the Deposit
      const newDeposit = await tx.deposit.create({
        data: {
          bookmaker: data.bookmaker,
          amount: data.amount,
          date: data.date,
          code: data.code,
          user: { connect: { id: userId } },
          qualifyCondition: { connect: { id: qualifyConditionId } },
        },
      });

      // 3. Update BookmakerAccount realBalance
      const bookmakerAccount = await tx.bookmakerAccount.findFirst({
        where: { userId, bookmaker: newDeposit.bookmaker },
      });
      if (!bookmakerAccount) throw new BadRequestError(`Bookmaker account for ${newDeposit.bookmaker} not found.`);
      await tx.bookmakerAccount.update({
        where: { id: bookmakerAccount.id },
        data: { realBalance: { increment: newDeposit.amount } },
      });

      // 4. Update balances in a cascading manner
      const amount = newDeposit.amount;
      // 4a. Update RewardQualifyCondition balance and tracking
      await tx.rewardQualifyCondition.update({
        where: { id: qualifyConditionId },
        data: {
          status: isFulfilled ? 'FULFILLED' : condition.status,
          balance: { increment: amount },
          trackingData: {
            type: 'DEPOSIT',
            status: isFulfilled ? 'COMPLETED' : 'IN_PROGRESS',
            qualifyingDepositId: newDeposit.id,
            depositAmount: newDeposit.amount,
            depositCode: newDeposit.code || undefined,
            depositedAt: newDeposit.date,
          },
        },
      });

      // 4b. Update parent Rewards, Phase, and Promotion balances
      const phaseId = condition.phase.id;
      const promotionId = condition.phase.promotionId;
      
      for (const reward of condition.rewards) {
        await tx.reward.update({
          where: { id: reward.id },
          data: { totalBalance: { increment: amount } },
        });
      }
      await tx.phase.update({
        where: { id: phaseId },
        data: { totalBalance: { increment: amount } },
      });
      await tx.promotion.update({
        where: { id: promotionId },
        data: { totalBalance: { increment: amount } },
      });
      
      // 5. If fulfilled, calculate and update the Reward's value itself
      // contributesToRewardValue now only exists inside conditions as discriminator
      if (isFulfilled && conditionData.conditions.contributesToRewardValue) {
        const rewardToUpdate = condition.rewards.find(r => r.valueType === 'CALCULATED_FROM_CONDITIONS');
        if (rewardToUpdate) {
          // Type narrowing confirmed - now we can access CALCULATED VALUE fields
          const effectiveAmount = Math.min(
            data.amount,
            conditionData.conditions.maxAmount || Infinity
          );
          let calculatedValue = (effectiveAmount * conditionData.conditions.bonusPercentage) / 100;
          calculatedValue = Math.min(calculatedValue, conditionData.conditions.maxBonusAmount);

          await tx.reward.update({
            where: { id: rewardToUpdate.id },
            data: { value: calculatedValue },
          });
        }
      }

      return toDepositEntity(newDeposit);
    });
  }

  /**
   * Updates an existing deposit
   */
  async update(id: string, data: Partial<Deposit>): Promise<DepositEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new AppError('Deposit not found', 404);

    const validatedData = DepositSchema.partial().parse(data);
    const prismaData = toDepositUpdateInput(validatedData);
    
    // Note: Complex side-effects on update (e.g., balance changes) are not yet implemented.
    const updatedDeposit = await this.repository.update(id, prismaData);
    return toDepositEntity(updatedDeposit);
  }

  /**
   * Deletes a deposit
   */
  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new AppError('Deposit not found', 404);
    
    // Note: Complex side-effects on delete (e.g., reverting balances) are not yet implemented.
    await this.repository.delete(id);
  }
}
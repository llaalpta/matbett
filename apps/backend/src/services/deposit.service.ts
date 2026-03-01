/**
 * Deposit Service
 * Business logic for deposits, including complex transactional effects.
 */
import {
  DepositSchema,
  DeleteDepositResultSchema,
  DepositQualifyConditionSchema,
  PromotionContextSchema,
  QualifyTrackingStatusSchema,
  type Deposit,
  type DeleteDepositResult,
  type DepositEntity,
  type DepositListInput,
  type PaginatedResponse,
} from '@matbett/shared';
import type { IDepositService } from '@matbett/api';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { DepositRepository } from '@/repositories/deposit.repository';
import { BookmakerAccountRepository } from '@/repositories/bookmaker-account.repository';
import { toDepositCreateInput, toDepositEntity } from '@/lib/transformers/deposit.transformer';
import { AppError, BadRequestError } from '@/utils/errors';

export class DepositService implements IDepositService {
  private repository: DepositRepository;
  private bookmakerAccountRepository: BookmakerAccountRepository;

  constructor() {
    this.repository = new DepositRepository();
    this.bookmakerAccountRepository = new BookmakerAccountRepository();
  }

  private getTrackingStatus(trackingData: unknown) {
    if (!trackingData || typeof trackingData !== 'object') {
      return 'IN_PROGRESS' as const;
    }
    if (!('status' in trackingData)) {
      return 'IN_PROGRESS' as const;
    }
    const parsed = QualifyTrackingStatusSchema.safeParse(trackingData.status);
    if (!parsed.success) {
      return 'IN_PROGRESS' as const;
    }
    return parsed.data;
  }

  private async updateBookmakerBalance(
    tx: Prisma.TransactionClient,
    userId: string,
    bookmaker: string,
    amountDelta: number
  ) {
    if (amountDelta === 0) {
      return;
    }
    const bookmakerAccount = await tx.bookmakerAccount.findFirst({
      where: { userId, bookmaker },
    });
    if (!bookmakerAccount) {
      throw new BadRequestError(`Bookmaker account for ${bookmaker} not found.`);
    }
    await tx.bookmakerAccount.update({
      where: { id: bookmakerAccount.id },
      data: { realBalance: { increment: amountDelta } },
    });
  }

  private async applyContextBalanceDelta(
    tx: Prisma.TransactionClient,
    qualifyConditionId: string,
    amountDelta: number
  ) {
    if (amountDelta === 0) {
      return;
    }

    const condition = await tx.rewardQualifyCondition.findUnique({
      where: { id: qualifyConditionId },
      include: {
        rewards: { select: { id: true, phaseId: true, promotionId: true } },
      },
    });

    if (!condition) {
      throw new AppError('Qualify condition not found', 404);
    }

    const phaseIds = new Set(condition.rewards.map((reward) => reward.phaseId));
    const promotionIds = new Set(condition.rewards.map((reward) => reward.promotionId));

    await tx.rewardQualifyCondition.update({
      where: { id: qualifyConditionId },
      data: { balance: { increment: amountDelta } },
    });

    for (const reward of condition.rewards) {
      await tx.reward.update({
        where: { id: reward.id },
        data: { totalBalance: { increment: amountDelta } },
      });
    }
    for (const phaseId of phaseIds) {
      await tx.phase.update({
        where: { id: phaseId },
        data: { totalBalance: { increment: amountDelta } },
      });
    }
    for (const promotionId of promotionIds) {
      await tx.promotion.update({
        where: { id: promotionId },
        data: { totalBalance: { increment: amountDelta } },
      });
    }
  }

  private async updateConditionTrackingAndRewardValue(
    tx: Prisma.TransactionClient,
    qualifyConditionId: string,
    depositData: {
      amount: number;
      date: Date;
      code?: string;
      depositId: string;
    } | null
  ) {
    const condition = await tx.rewardQualifyCondition.findUnique({
      where: { id: qualifyConditionId },
      include: {
        rewards: { select: { id: true, valueType: true } },
      },
    });

    if (!condition) {
      throw new AppError('Qualify condition not found', 404);
    }
    if (condition.type !== 'DEPOSIT') {
      throw new BadRequestError('This is not a DEPOSIT condition.');
    }

    const conditionData = DepositQualifyConditionSchema.parse(condition.conditions);

    await tx.rewardQualifyCondition.update({
      where: { id: qualifyConditionId },
      data: {
        balance: depositData?.amount ?? 0,
        trackingData: depositData
          ? {
              type: 'DEPOSIT',
              status: this.getTrackingStatus(condition.trackingData),
              qualifyingDepositId: depositData.depositId,
              depositAmount: depositData.amount,
              depositCode: depositData.code,
              depositedAt: depositData.date,
            }
          : Prisma.DbNull,
      },
    });

    if (!conditionData.conditions.contributesToRewardValue) {
      return;
    }

    const rewardToUpdate = condition.rewards.find(
      (reward) => reward.valueType === 'CALCULATED_FROM_CONDITIONS'
    );
    if (!rewardToUpdate) {
      return;
    }

    const minAmount = conditionData.conditions.minAmount;
    const bonusPercentage = conditionData.conditions.bonusPercentage;
    const maxBonusAmount = conditionData.conditions.maxBonusAmount;

    if (
      minAmount === undefined ||
      bonusPercentage === undefined ||
      maxBonusAmount === undefined
    ) {
      throw new BadRequestError('Deposit condition bonus fields are required.');
    }

    let calculatedValue = 0;
    if (depositData && depositData.amount >= minAmount) {
      const effectiveAmount = Math.min(
        depositData.amount,
        conditionData.conditions.maxAmount || Infinity
      );
      calculatedValue = Math.min(
        (effectiveAmount * bonusPercentage) / 100,
        maxBonusAmount
      );
    }

    await tx.reward.update({
      where: { id: rewardToUpdate.id },
      data: { value: calculatedValue },
    });
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
      const existingContextual = await tx.deposit.findFirst({
        where: { qualifyConditionId },
        select: { id: true },
      });
      if (existingContextual) {
        throw new BadRequestError(
          'This qualify condition already has a qualifying deposit. Edit the existing deposit instead.'
        );
      }

      // 1. Fetch condition with its parent hierarchy for cascading updates
      const condition = await tx.rewardQualifyCondition.findUnique({
        where: { id: qualifyConditionId },
        include: {
          rewards: { select: { id: true, valueType: true, phaseId: true, promotionId: true } },
        },
      });

      if (!condition) {throw new AppError('Qualify condition not found', 404);}
      if (condition.type !== 'DEPOSIT') {throw new BadRequestError('This is not a DEPOSIT condition.');}

      // --- Business logic (manual status management) ---
      const conditionData = DepositQualifyConditionSchema.parse(condition.conditions);
      let canRecalculateRewardValue = false;

      if (conditionData.conditions.contributesToRewardValue) {
        const minAmount = conditionData.conditions.minAmount;
        if (minAmount === undefined) {
          throw new BadRequestError('Deposit condition minAmount is required.');
        }
        canRecalculateRewardValue = data.amount >= minAmount;
      }

      // timeframe, firstDepositOnly and depositCode are user-managed signals.
      // We store facts and leave status decisions to the user.

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
      if (!bookmakerAccount) {throw new BadRequestError(`Bookmaker account for ${newDeposit.bookmaker} not found.`);}
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
          balance: { increment: amount },
          trackingData: {
            type: 'DEPOSIT',
            status: this.getTrackingStatus(condition.trackingData),
            qualifyingDepositId: newDeposit.id,
            depositAmount: newDeposit.amount,
            depositCode: newDeposit.code || undefined,
            depositedAt: newDeposit.date,
          },
        },
      });

      // 4b. Update parent Rewards, Phase, and Promotion balances
      const phaseIds = new Set(condition.rewards.map(reward => reward.phaseId));
      const promotionIds = new Set(condition.rewards.map(reward => reward.promotionId));

      for (const reward of condition.rewards) {
        await tx.reward.update({
          where: { id: reward.id },
          data: { totalBalance: { increment: amount } },
        });
      }
      for (const phaseId of phaseIds) {
        await tx.phase.update({
          where: { id: phaseId },
          data: { totalBalance: { increment: amount } },
        });
      }
      for (const promotionId of promotionIds) {
        await tx.promotion.update({
          where: { id: promotionId },
          data: { totalBalance: { increment: amount } },
        });
      }
      
      // 5. Recalculate reward value automatically when configured by condition,
      // while keeping statuses fully manual.
      if (canRecalculateRewardValue && conditionData.conditions.contributesToRewardValue) {
        const rewardToUpdate = condition.rewards.find(r => r.valueType === 'CALCULATED_FROM_CONDITIONS');
        if (rewardToUpdate) {
          const effectiveAmount = Math.min(
            data.amount,
            conditionData.conditions.maxAmount || Infinity
          );
          const bonusPercentage = conditionData.conditions.bonusPercentage;
          const maxBonusAmount = conditionData.conditions.maxBonusAmount;
          if (bonusPercentage === undefined || maxBonusAmount === undefined) {
            throw new BadRequestError('Deposit condition bonus fields are required.');
          }
          let calculatedValue = (effectiveAmount * bonusPercentage) / 100;
          calculatedValue = Math.min(calculatedValue, maxBonusAmount);

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
    const validatedData = DepositSchema.partial().parse(data);

    if (validatedData.qualifyConditionId !== undefined) {
      throw new BadRequestError('Changing qualifyConditionId on update is not supported.');
    }

    return prisma.$transaction(async (tx) => {
      const existing = await this.repository.findById(id, tx);
      if (!existing) {
        throw new AppError('Deposit not found', 404);
      }

      const nextBookmaker = validatedData.bookmaker ?? existing.bookmaker;
      const nextAmount = validatedData.amount ?? existing.amount;
      const nextDate = validatedData.date ?? existing.date;
      const nextCode =
        validatedData.code !== undefined ? validatedData.code : existing.code ?? undefined;

      if (existing.bookmaker === nextBookmaker) {
        const amountDelta = nextAmount - existing.amount;
        await this.updateBookmakerBalance(tx, existing.userId, existing.bookmaker, amountDelta);
      } else {
        await this.updateBookmakerBalance(tx, existing.userId, existing.bookmaker, -existing.amount);
        await this.updateBookmakerBalance(tx, existing.userId, nextBookmaker, nextAmount);
      }

      const updatedDeposit = await this.repository.update(
        id,
        {
          bookmaker: nextBookmaker,
          amount: nextAmount,
          date: nextDate,
          code: nextCode,
        },
        tx
      );

      if (existing.qualifyConditionId) {
        const amountDelta = nextAmount - existing.amount;
        await this.applyContextBalanceDelta(tx, existing.qualifyConditionId, amountDelta);
        await this.updateConditionTrackingAndRewardValue(tx, existing.qualifyConditionId, {
          depositId: updatedDeposit.id,
          amount: updatedDeposit.amount,
          date: updatedDeposit.date,
          code: updatedDeposit.code ?? undefined,
        });
      }

      return toDepositEntity(updatedDeposit);
    });
  }

  /**
   * Deletes a deposit
   */
  async delete(id: string): Promise<DeleteDepositResult> {
    return prisma.$transaction(async (tx) => {
      const existing = await this.repository.findById(id, tx);
      if (!existing) {
        throw new AppError('Deposit not found', 404);
      }

      const promotionContext = existing.promotionContext
        ? PromotionContextSchema.safeParse(existing.promotionContext)
        : null;
      const promotionId = promotionContext?.success
        ? promotionContext.data.promotionId
        : undefined;

      await this.updateBookmakerBalance(tx, existing.userId, existing.bookmaker, -existing.amount);

      if (existing.qualifyConditionId) {
        await this.applyContextBalanceDelta(tx, existing.qualifyConditionId, -existing.amount);
        await this.updateConditionTrackingAndRewardValue(tx, existing.qualifyConditionId, null);
      }

      await this.repository.delete(id, tx);

      return DeleteDepositResultSchema.parse({
        success: true,
        promotionId,
      });
    });
  }
}

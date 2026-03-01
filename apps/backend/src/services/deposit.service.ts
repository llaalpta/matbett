/**
 * Deposit Service
 * Business logic for deposits, including complex transactional effects.
 */
import {
  DepositQualifyConditionSchema,
  DepositSchema,
  DeleteDepositResultSchema,
  type DeleteDepositResult,
  type Deposit,
  type DepositEntity,
  type DepositListInput,
  type DepositParticipation,
  type PaginatedResponse,
} from '@matbett/shared';
import type { IDepositService } from '@matbett/api';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import {
  DepositRepository,
  type DepositQualifyConditionForSync,
} from '@/repositories/deposit.repository';
import {
  toDepositCreateInput,
  toDepositEntity,
  toDepositUpdateInput,
} from '@/lib/transformers/deposit.transformer';
import { AppError, BadRequestError } from '@/utils/errors';

type QualifyTrackingDepositParticipation = Extract<
  DepositParticipation,
  { role: 'QUALIFY_TRACKING' }
>;

type DepositTrackingSnapshot = {
  amount: number;
  date: Date;
  code?: string;
  depositId: string;
};

export class DepositService implements IDepositService {
  private readonly repository: DepositRepository;

  constructor() {
    this.repository = new DepositRepository();
  }

  async list(
    userId: string,
    input: DepositListInput,
  ): Promise<PaginatedResponse<DepositEntity>> {
    const { pageIndex, pageSize, bookmakerAccountId, qualifyConditionId, sorting } = input;
    const where: Prisma.DepositWhereInput = { userId };

    if (bookmakerAccountId) {
      where.bookmakerAccountId = bookmakerAccountId;
    }
    if (qualifyConditionId) {
      where.participations = {
        some: {
          qualifyConditionId,
        },
      };
    }

    let orderBy: Prisma.DepositOrderByWithRelationInput = { createdAt: 'desc' };
    if (sorting && sorting.length > 0 && sorting[0]) {
      const { id, desc } = sorting[0];
      const direction = desc ? 'desc' : 'asc';
      if (['amount', 'date', 'bookmaker', 'createdAt'].includes(id)) {
        orderBy = { [id]: direction };
      }
    }

    const [deposits, total] = await prisma.$transaction(async (tx) => {
      const dataPromise = this.repository.findMany(
        userId,
        {
          where,
          orderBy,
          skip: pageIndex * pageSize,
          take: pageSize,
        },
        tx,
      );
      const countPromise = this.repository.count(userId, where, tx);

      return Promise.all([dataPromise, countPromise]);
    });

    return {
      data: deposits.map(toDepositEntity),
      meta: {
        pageCount: Math.ceil(total / pageSize),
        rowCount: total,
        pageIndex,
        pageSize,
      },
    };
  }

  async getById(id: string): Promise<DepositEntity> {
    const deposit = await this.repository.findById(id);
    if (!deposit) {
      throw new AppError('Deposit not found', 404);
    }

    return toDepositEntity(deposit);
  }

  async create(data: Deposit, userId: string): Promise<DepositEntity> {
    const validatedData = DepositSchema.parse(data);
    const contextParticipation = extractContextParticipation(validatedData.participations);

    if (contextParticipation) {
      return this.createContextualDeposit(validatedData, userId, contextParticipation);
    }

    return this.createIndependentDeposit(validatedData, userId);
  }

  async update(id: string, data: Partial<Deposit>): Promise<DepositEntity> {
    const validatedData = DepositSchema.partial().parse(data);

    if (validatedData.participations !== undefined) {
      throw new BadRequestError('Changing participations on update is not supported.');
    }

    return prisma.$transaction(async (tx) => {
      const existing = await this.repository.findById(id, tx);
      if (!existing) {
        throw new AppError('Deposit not found', 404);
      }

      const existingEntity = toDepositEntity(existing);
      const contextual = extractContextParticipation(existingEntity.participations);
      const nextBookmakerAccountId =
        validatedData.bookmakerAccountId ?? existing.bookmakerAccountId;

      if (!nextBookmakerAccountId) {
        throw new BadRequestError('bookmakerAccountId is required.');
      }

      const nextBookmakerAccount = await this.resolveBookmakerAccountSnapshot(
        tx,
        existing.userId,
        nextBookmakerAccountId,
      );
      const nextAmount = validatedData.amount ?? existing.amount;
      const nextDate = validatedData.date ?? existing.date;
      const nextCode =
        validatedData.code !== undefined ? validatedData.code : existing.code ?? undefined;

      let contextualCondition: DepositQualifyConditionForSync | null = null;
      if (contextual) {
        contextualCondition = await this.requireDepositQualifyCondition(
          tx,
          contextual.qualifyConditionId,
        );
        this.assertDepositConditionAccount(
          contextualCondition,
          nextBookmakerAccount.id,
          'The deposit account does not match the promotion account for this qualify condition.',
        );
      }

      await this.applyBookmakerBalanceTransition(
        tx,
        existing.bookmakerAccountId,
        existing.amount,
        nextBookmakerAccount.id,
        nextAmount,
      );

      const updatePayload = toDepositUpdateInput({
        amount: nextAmount,
        date: nextDate,
        code: nextCode,
      });
      updatePayload.bookmaker = nextBookmakerAccount.bookmaker;
      updatePayload.bookmakerAccount = {
        connect: { id: nextBookmakerAccount.id },
      };

      const updatedDeposit = await this.repository.update(id, updatePayload, tx);

      if (contextual && contextualCondition) {
        await this.syncDepositQualifyConditionState(
          tx,
          contextualCondition,
          {
            depositId: updatedDeposit.id,
            amount: updatedDeposit.amount,
            date: updatedDeposit.date,
            code: updatedDeposit.code ?? undefined,
          },
        );
      }

      return toDepositEntity(updatedDeposit);
    });
  }

  async delete(id: string): Promise<DeleteDepositResult> {
    return prisma.$transaction(async (tx) => {
      const existing = await this.repository.findById(id, tx);
      if (!existing) {
        throw new AppError('Deposit not found', 404);
      }

      const existingEntity = toDepositEntity(existing);
      const contextual = extractContextParticipation(existingEntity.participations);
      const promotionId = contextual?.promotionId;

      await this.updateBookmakerBalance(tx, existing.bookmakerAccountId, -existing.amount);

      if (contextual) {
        const contextualCondition = await this.requireDepositQualifyCondition(
          tx,
          contextual.qualifyConditionId,
        );
        await this.syncDepositQualifyConditionState(tx, contextualCondition, null);
      }

      await this.repository.delete(id, tx);

      return DeleteDepositResultSchema.parse({
        success: true,
        promotionId,
      });
    });
  }

  private async createIndependentDeposit(
    data: Deposit,
    userId: string,
  ): Promise<DepositEntity> {
    return prisma.$transaction(async (tx) => {
      const bookmakerAccount = await this.resolveBookmakerAccountSnapshot(
        tx,
        userId,
        data.bookmakerAccountId,
      );
      const prismaData = toDepositCreateInput(data, userId, bookmakerAccount);
      const newDeposit = await this.repository.create(prismaData, tx);

      await this.updateBookmakerBalance(tx, newDeposit.bookmakerAccountId, newDeposit.amount);

      return toDepositEntity(newDeposit);
    });
  }

  private async createContextualDeposit(
    data: Deposit,
    userId: string,
    context: QualifyTrackingDepositParticipation,
  ): Promise<DepositEntity> {
    return prisma.$transaction(async (tx) => {
      const bookmakerAccount = await this.resolveBookmakerAccountSnapshot(
        tx,
        userId,
        data.bookmakerAccountId,
      );
      const existingContextual = await this.repository.findContextualParticipationByQualifyCondition(
        context.qualifyConditionId,
        tx,
      );

      if (existingContextual) {
        throw new BadRequestError(
          'This qualify condition already has a qualifying deposit. Edit the existing deposit instead.',
        );
      }

      const condition = await this.requireDepositQualifyCondition(
        tx,
        context.qualifyConditionId,
      );
      this.assertDepositConditionAccount(
        condition,
        bookmakerAccount.id,
        'The deposit account must match the promotion account linked to this qualify condition.',
      );

      const { rewardRef, resolvedPhaseId } = resolveContextRewardReference(
        condition,
        context,
      );

      const newDeposit = await this.repository.create(
        {
          bookmaker: bookmakerAccount.bookmaker,
          bookmakerAccount: { connect: { id: bookmakerAccount.id } },
          amount: data.amount,
          date: data.date,
          code: data.code,
          user: { connect: { id: userId } },
          participations: {
            create: {
              role: 'QUALIFY_TRACKING',
              promotion: { connect: { id: context.promotionId } },
              phase: { connect: { id: resolvedPhaseId } },
              reward: { connect: { id: rewardRef.id } },
              qualifyCondition: { connect: { id: context.qualifyConditionId } },
              countsAsQualification: context.countsAsQualification,
            },
          },
        },
        tx,
      );

      await this.updateBookmakerBalance(tx, newDeposit.bookmakerAccountId, newDeposit.amount);
      await this.syncDepositQualifyConditionState(
        tx,
        condition,
        {
          depositId: newDeposit.id,
          amount: newDeposit.amount,
          date: newDeposit.date,
          code: newDeposit.code ?? undefined,
        },
      );

      return toDepositEntity(newDeposit);
    });
  }

  private async resolveBookmakerAccountSnapshot(
    tx: Prisma.TransactionClient,
    userId: string,
    bookmakerAccountId: string,
  ) {
    const bookmakerAccount = await this.repository.findBookmakerAccountSnapshotForUser(
      userId,
      bookmakerAccountId,
      tx,
    );

    if (!bookmakerAccount) {
      throw new BadRequestError(
        `Bookmaker account ${bookmakerAccountId} not found for this user.`,
      );
    }

    return bookmakerAccount;
  }

  private async updateBookmakerBalance(
    tx: Prisma.TransactionClient,
    bookmakerAccountId: string,
    amountDelta: number,
  ) {
    const updatedCount = await this.repository.incrementBookmakerRealBalance(
      bookmakerAccountId,
      amountDelta,
      tx,
    );

    if (amountDelta !== 0 && updatedCount === 0) {
      throw new BadRequestError(`Bookmaker account ${bookmakerAccountId} not found.`);
    }
  }

  private async applyBookmakerBalanceTransition(
    tx: Prisma.TransactionClient,
    currentBookmakerAccountId: string,
    currentAmount: number,
    nextBookmakerAccountId: string,
    nextAmount: number,
  ) {
    if (currentBookmakerAccountId === nextBookmakerAccountId) {
      await this.updateBookmakerBalance(
        tx,
        currentBookmakerAccountId,
        nextAmount - currentAmount,
      );
      return;
    }

    await this.updateBookmakerBalance(tx, currentBookmakerAccountId, -currentAmount);
    await this.updateBookmakerBalance(tx, nextBookmakerAccountId, nextAmount);
  }

  private async requireDepositQualifyCondition(
    tx: Prisma.TransactionClient,
    qualifyConditionId: string,
  ): Promise<DepositQualifyConditionForSync> {
    const condition = await this.repository.findDepositQualifyConditionForSync(
      qualifyConditionId,
      tx,
    );

    if (!condition) {
      throw new AppError('Qualify condition not found', 404);
    }
    if (condition.type !== 'DEPOSIT') {
      throw new BadRequestError('This is not a DEPOSIT condition.');
    }

    return condition;
  }

  private assertDepositConditionAccount(
    condition: DepositQualifyConditionForSync,
    bookmakerAccountId: string,
    mismatchMessage: string,
  ) {
    if (condition.promotion.bookmakerAccountId !== bookmakerAccountId) {
      throw new BadRequestError(mismatchMessage);
    }
  }

  private async syncDepositQualifyConditionState(
    tx: Prisma.TransactionClient,
    condition: DepositQualifyConditionForSync,
    depositData: DepositTrackingSnapshot | null,
  ) {
    const conditionData = DepositQualifyConditionSchema.parse(condition.conditions);
    const nextBalance = depositData?.amount ?? 0;
    const balanceDelta = nextBalance - condition.balance;

    await this.repository.updateQualifyCondition(
      condition.id,
      {
        balance: nextBalance,
        trackingData: depositData
          ? buildDepositTrackingData(depositData)
          : Prisma.DbNull,
      },
      tx,
    );

    await this.repository.incrementRewardsTotalBalance(
      condition.rewards.map((reward) => reward.id),
      balanceDelta,
      tx,
    );
    await this.repository.incrementPhasesTotalBalance(
      unique(condition.rewards.map((reward) => reward.phaseId)),
      balanceDelta,
      tx,
    );
    await this.repository.incrementPromotionsTotalBalance(
      unique(condition.rewards.map((reward) => reward.promotionId)),
      balanceDelta,
      tx,
    );

    const calculatedRewardValue = calculateDepositConditionRewardValue(
      conditionData,
      condition,
      depositData?.amount ?? null,
    );

    if (!calculatedRewardValue) {
      return;
    }

    await this.repository.updateRewardValue(
      calculatedRewardValue.rewardId,
      calculatedRewardValue.value,
      tx,
    );
  }
}

function isQualifyTrackingParticipation(
  participation: DepositParticipation,
): participation is QualifyTrackingDepositParticipation {
  return participation.role === 'QUALIFY_TRACKING';
}

function extractContextParticipation(
  participations: Deposit['participations'] | undefined,
): QualifyTrackingDepositParticipation | null {
  if (!participations || participations.length === 0) {
    return null;
  }

  const contextual = participations.filter((participation) =>
    isQualifyTrackingParticipation(participation),
  );

  if (contextual.length === 0) {
    return null;
  }

  if (contextual.length > 1) {
    throw new BadRequestError(
      'Only one QUALIFY_TRACKING participation is supported per deposit.',
    );
  }

  return contextual[0] ?? null;
}

function resolveContextRewardReference(
  condition: DepositQualifyConditionForSync,
  context: QualifyTrackingDepositParticipation,
) {
  const rewardRef = context.rewardId
    ? condition.rewards.find((reward) => reward.id === context.rewardId)
    : condition.rewards[0];

  if (!rewardRef) {
    throw new BadRequestError(
      'The participation rewardId is not linked to this qualify condition.',
    );
  }
  if (context.promotionId !== rewardRef.promotionId) {
    throw new BadRequestError(
      'Participation promotionId does not match qualify condition hierarchy.',
    );
  }
  if (context.phaseId && context.phaseId !== rewardRef.phaseId) {
    throw new BadRequestError('Participation phaseId does not match reward hierarchy.');
  }

  return {
    rewardRef,
    resolvedPhaseId: context.phaseId ?? rewardRef.phaseId,
  };
}

function buildDepositTrackingData(
  depositData: DepositTrackingSnapshot,
) {
  return {
    type: 'DEPOSIT',
    qualifyingDepositId: depositData.depositId,
    participatingDeposits: [
      {
        depositId: depositData.depositId,
        amount: depositData.amount,
        code: depositData.code,
        depositedAt: depositData.date,
      },
    ],
    totalDepositedAmount: depositData.amount,
  };
}

function calculateDepositConditionRewardValue(
  conditionData: ReturnType<typeof DepositQualifyConditionSchema.parse>,
  condition: DepositQualifyConditionForSync,
  depositAmount: number | null,
) {
  if (!conditionData.conditions.contributesToRewardValue) {
    return null;
  }

  const rewardToUpdate = condition.rewards.find(
    (reward) => reward.valueType === 'CALCULATED_FROM_CONDITIONS',
  );
  if (!rewardToUpdate) {
    return null;
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
  if (depositAmount !== null && depositAmount >= minAmount) {
    const effectiveAmount = Math.min(
      depositAmount,
      conditionData.conditions.maxAmount || Infinity,
    );
    calculatedValue = Math.min((effectiveAmount * bonusPercentage) / 100, maxBonusAmount);
  }

  return {
    rewardId: rewardToUpdate.id,
    value: calculatedValue,
  };
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

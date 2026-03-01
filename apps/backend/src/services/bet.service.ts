import type { IBetService } from '@matbett/api';
import type {
  AvailablePromotionContexts,
  BetBatchListInput,
  BetBatchSummary,
  BetDashboardTotals,
  BetLegInput,
  BetListInput,
  BetListItem,
  BetRegistrationBatch,
  DeleteBetBatchResult,
  PaginatedResponse,
  PromotionParticipationInput,
  RegisterBetsBatch,
  UpdateBetLegInput,
  UpdateBetsBatch,
} from '@matbett/shared';
import {
  BonusRolloverUsageTrackingSchema,
  CasinoSpinsUsageTrackingSchema,
  FreeBetUsageConditionsSchema,
  FreeBetUsageTrackingSchema,
  BetBatchSummarySchema,
  BetDashboardTotalsSchema,
  BetListItemSchema,
  BetRegistrationBatchSchema,
  DeleteBetBatchResultSchema,
  QualifyConditionTypeSchema,
  RegisterBetsBatchSchema,
  RewardTypeSchema,
  UpdateBetsBatchSchema,
} from '@matbett/shared';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import {
  type BetLegUpdateDiff,
  toBetBatchCreateInput,
  toBetBatchEntity,
  toBetBatchSummary,
  toBetBatchUpdateDiff,
  toBetBatchUpdateInput,
  toBetCreateInput,
  toBetListItem,
  toBetParticipationCreateInput,
  toBetParticipationUpdateInput,
  toBetUpdateInput,
} from '@/lib/transformers/bet.transformer';
import {
  BetRepository,
  type BetAvailableRewardUsageTracking,
  type BetBatchWithRelations,
} from '@/repositories/bet.repository';
import { AppError, BadRequestError } from '@/utils/errors';
import { TrackingService } from './tracking.service';

type ResolvedBookmakerAccount = {
  id: string;
};

type ResolvedQualifyCondition = {
  id: string;
  type: string;
  status: string;
  promotionId: string;
  promotion: {
    id: string;
    name: string;
    bookmakerAccountId: string;
    status: string;
  };
  rewards: Array<{
    id: string;
    type: string;
    status: string;
    phaseId: string;
    phase: {
      id: string;
      name: string;
      status: string;
    };
  }>;
};

type ResolvedUsageTracking = {
  id: string;
  type: string;
  rewardId: string;
  reward: {
    id: string;
    type: string;
    value: number;
    status: string;
    phaseId: string;
    phase: {
      id: string;
      name: string;
      status: string;
    };
    promotion: {
      id: string;
      name: string;
      bookmakerAccountId: string;
      status: string;
    };
  };
};

type ResolvedReferences = {
  bookmakerAccounts: Map<string, ResolvedBookmakerAccount>;
  qualifyConditions: Map<string, ResolvedQualifyCondition>;
  usageTrackings: Map<string, ResolvedUsageTracking>;
};

type ResolvedParticipationContext = {
  promotionId: string;
  phaseId?: string;
};

type CreatedParticipationIdsByKey = Map<string, string>;
const persistedParticipationPrefix = 'persisted:';

const isActivePromotionStatus = (status: string) => status === 'ACTIVE';
const isActivePhaseStatus = (status: string) => status === 'ACTIVE';
const isQualifyConditionStatusOpen = (status: string) =>
  status === 'PENDING' || status === 'QUALIFYING';
const isRewardStatusUsableInBet = (status: string) =>
  status === 'RECEIVED' || status === 'IN_USE';

export class BetService implements IBetService {
  private readonly repository: BetRepository;
  private readonly trackingService: TrackingService;

  constructor() {
    this.repository = new BetRepository();
    this.trackingService = new TrackingService();
  }

  async registerBetsBatch(
    userId: string,
    input: RegisterBetsBatch,
  ): Promise<BetRegistrationBatch> {
    const validated = RegisterBetsBatchSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const references = await this.resolveReferences(tx, userId, validated.legs);

      const batch = await this.repository.createBatch(
        toBetBatchCreateInput(validated, userId),
        tx,
      );

      const createdParticipationIdsByKey = new Map<string, string>();

      for (const leg of validated.legs) {
        await this.createBetWithParticipations(
          tx,
          userId,
          batch.id,
          leg,
          references,
          createdParticipationIdsByKey,
        );
      }

      const calculationParticipationId = this.resolveCreateTargetParticipationId(
        validated,
        createdParticipationIdsByKey,
      );

      const updatedBatch = await this.repository.updateBatch(
        batch.id,
        {
          calculationParticipationId,
        },
        tx,
      );

      await this.trackingService.recalculate(tx, {
        qualifyConditionIds: collectQualifyConditionIds(validated.legs),
        usageTrackingIds: collectUsageTrackingIds(validated.legs),
      });

      return BetRegistrationBatchSchema.parse(toBetBatchEntity(updatedBatch));
    });
  }

  async updateBatch(
    userId: string,
    batchId: string,
    input: UpdateBetsBatch,
  ): Promise<BetRegistrationBatch> {
    const validated = UpdateBetsBatchSchema.parse(input);

    return prisma.$transaction(async (tx) => {
      const existing = await this.repository.findBatchByIdForUser(batchId, userId, tx);
      if (!existing) {
        throw new AppError('Bet batch not found', 404);
      }

      this.validateUpdateIdentifiers(existing, validated);

      const references = await this.resolveReferences(tx, userId, validated.legs);
      const previousTargets = extractTrackingTargets(existing);
      const diff = toBetBatchUpdateDiff(existing, validated);
      const createdParticipationIdsByKey = new Map<string, string>();

      await this.repository.deleteBets(diff.deletes, tx);

      for (const update of diff.updates) {
        await this.updateBetWithParticipations(
          tx,
          batchId,
          update,
          references,
          createdParticipationIdsByKey,
        );
      }

      for (const create of diff.creates) {
        await this.createBetWithParticipations(
          tx,
          userId,
          batchId,
          create.input,
          references,
          createdParticipationIdsByKey,
        );
      }

      const refreshed = await this.repository.findBatchByIdForUser(batchId, userId, tx);
      if (!refreshed) {
        throw new AppError('Bet batch not found after update', 404);
      }

      const calculationParticipationId = this.resolveUpdateTargetParticipationId(
        refreshed,
        validated,
        createdParticipationIdsByKey,
      );

      await this.repository.updateBatch(
        batchId,
        toBetBatchUpdateInput(validated, calculationParticipationId),
        tx,
      );

      const finalBatch = await this.repository.findBatchByIdForUser(batchId, userId, tx);
      if (!finalBatch) {
        throw new AppError('Bet batch not found after update', 404);
      }

      const nextTargets = extractTrackingTargets(finalBatch);

      await this.trackingService.recalculate(tx, {
        qualifyConditionIds: unique([
          ...previousTargets.qualifyConditionIds,
          ...nextTargets.qualifyConditionIds,
        ]),
        usageTrackingIds: unique([
          ...previousTargets.usageTrackingIds,
          ...nextTargets.usageTrackingIds,
        ]),
      });

      return BetRegistrationBatchSchema.parse(toBetBatchEntity(finalBatch));
    });
  }

  async deleteBatch(
    userId: string,
    batchId: string,
  ): Promise<DeleteBetBatchResult> {
    return prisma.$transaction(async (tx) => {
      const existing = await this.repository.findBatchByIdForUser(batchId, userId, tx);
      if (!existing) {
        throw new AppError('Bet batch not found', 404);
      }

      const previousTargets = extractTrackingTargets(existing);
      await this.repository.deleteBatch(batchId, tx);

      await this.trackingService.recalculate(tx, previousTargets);

      return DeleteBetBatchResultSchema.parse({
        success: true,
      });
    });
  }

  async getBatch(
    userId: string,
    batchId: string,
  ): Promise<BetRegistrationBatch | null> {
    const batch = await this.repository.findBatchByIdForUser(batchId, userId);
    return batch ? BetRegistrationBatchSchema.parse(toBetBatchEntity(batch)) : null;
  }

  async listBatches(
    userId: string,
    input: BetBatchListInput,
  ): Promise<PaginatedResponse<BetBatchSummary>> {
    const where = buildBatchWhereInput(input);
    const orderBy = buildBatchOrderBy(input);

    const [rows, total] = await prisma.$transaction(async (tx) => {
      const dataPromise = this.repository.findManyBatchesForUser(
        userId,
        {
          where,
          orderBy,
          skip: input.pageIndex * input.pageSize,
          take: input.pageSize,
        },
        tx,
      );
      const totalPromise = this.repository.countBatchesForUser(userId, where, tx);

      return Promise.all([dataPromise, totalPromise]);
    });

    return {
      data: rows.map((row) => BetBatchSummarySchema.parse(toBetBatchSummary(row))),
      meta: {
        pageCount: Math.ceil(total / input.pageSize),
        rowCount: total,
        pageIndex: input.pageIndex,
        pageSize: input.pageSize,
      },
    };
  }

  async listBets(
    userId: string,
    input: BetListInput,
  ): Promise<PaginatedResponse<BetListItem>> {
    const where = buildBetWhereInput(input);
    const orderBy = buildBetOrderBy(input);

    const [rows, total] = await prisma.$transaction(async (tx) => {
      const dataPromise = this.repository.findManyBetsForUser(
        userId,
        {
          where,
          orderBy,
          skip: input.pageIndex * input.pageSize,
          take: input.pageSize,
        },
        tx,
      );
      const totalPromise = this.repository.countBetsForUser(userId, where, tx);

      return Promise.all([dataPromise, totalPromise]);
    });

    return {
      data: rows.map((row) => BetListItemSchema.parse(toBetListItem(row))),
      meta: {
        pageCount: Math.ceil(total / input.pageSize),
        rowCount: total,
        pageIndex: input.pageIndex,
        pageSize: input.pageSize,
      },
    };
  }

  async listBetsByPromotion(
    userId: string,
    promotionId: string,
    input: BetListInput,
  ): Promise<PaginatedResponse<BetListItem>> {
    return this.listBets(userId, {
      ...input,
      promotionId,
    });
  }

  async listBetsByQualifyCondition(
    userId: string,
    qualifyConditionId: string,
    input: BetListInput,
  ): Promise<PaginatedResponse<BetListItem>> {
    return this.listBets(userId, {
      ...input,
      qualifyConditionId,
    });
  }

  async listBetsByUsageTracking(
    userId: string,
    usageTrackingId: string,
    input: BetListInput,
  ): Promise<PaginatedResponse<BetListItem>> {
    return this.listBets(userId, {
      ...input,
      usageTrackingId,
    });
  }

  async getAvailablePromotionContexts(
    userId: string,
    bookmakerAccountId: string,
  ): Promise<AvailablePromotionContexts> {
    const bookmakerAccount = await this.repository.findBookmakerAccountForUser(
      userId,
      bookmakerAccountId,
    );

    if (!bookmakerAccount) {
      throw new AppError('Bookmaker account not found', 404);
    }

    const [rewardUsageContexts, qualifyTrackingContexts] = await Promise.all([
      this.repository.findAvailableRewardUsageTrackingsForBookmakerAccount(
        userId,
        bookmakerAccountId,
      ),
      this.repository.findAvailableQualifyTrackingConditionsForBookmakerAccount(
        userId,
        bookmakerAccountId,
      ),
    ]);

    return {
      bookmakerAccountId: bookmakerAccount.id,
      rewardUsageContexts: rewardUsageContexts
        .filter(isRewardUsageTrackingAvailable)
        .map((context) => ({
          rewardId: context.rewardId,
          rewardType: RewardTypeSchema.parse(context.reward.type),
          rewardValue: context.reward.value,
          usageTrackingId: context.id,
          promotionId: context.reward.promotionId,
          promotionName: context.reward.promotion.name,
          phaseId: context.reward.phaseId,
          phaseName: context.reward.phase.name,
        })),
      qualifyTrackingContexts: qualifyTrackingContexts
        .filter((context) => context.rewards.length > 0)
        .map((context) => ({
          qualifyConditionId: context.id,
          qualifyConditionType: QualifyConditionTypeSchema.parse(context.type),
          description: context.description ?? undefined,
          promotionId: context.promotionId,
          promotionName: context.promotion.name,
          rewards: context.rewards.map((reward) => ({
            rewardId: reward.id,
            rewardType: RewardTypeSchema.parse(reward.type),
            phaseId: reward.phaseId,
            phaseName: reward.phase.name,
          })),
        })),
    };
  }

  async getDashboardTotals(userId: string): Promise<BetDashboardTotals> {
    const { totalBatches, betAggregate, byStatus, byBookmaker } =
      await this.repository.getDashboardAggregatesForUser(userId);

    return BetDashboardTotalsSchema.parse({
      totalBatches,
      totalBets: betAggregate._count.id,
      totalProfit: betAggregate._sum.profit ?? 0,
      totalRisk: betAggregate._sum.risk ?? 0,
      averageYield: betAggregate._avg.yield ?? 0,
      byStatus: Object.fromEntries(
        byStatus.map((entry) => [
          entry.status,
          typeof entry._count === 'object' && entry._count ? (entry._count._all ?? 0) : 0,
        ]),
      ),
      byBookmaker: Object.fromEntries(
        byBookmaker.map((entry) => [
          entry.bookmakerAccountId,
          typeof entry._count === 'object' && entry._count ? (entry._count._all ?? 0) : 0,
        ]),
      ),
    });
  }

  private async resolveReferences(
    tx: Prisma.TransactionClient,
    userId: string,
    legs: Array<{ bookmakerAccountId: string; participations: PromotionParticipationInput[] }>,
  ): Promise<ResolvedReferences> {
    const bookmakerAccountIds = unique(legs.map((leg) => leg.bookmakerAccountId));
    const qualifyConditionIds = unique(
      legs.flatMap((leg) =>
        leg.participations
          .filter((participation) => participation.kind === 'QUALIFY_TRACKING')
          .map((participation) => participation.qualifyConditionId),
      ),
    );
    const usageTrackingIds = unique(
      legs.flatMap((leg) =>
        leg.participations
          .filter((participation) => participation.kind === 'REWARD_USAGE')
          .map((participation) => participation.usageTrackingId),
      ),
    );

    const [bookmakerAccounts, qualifyConditions, usageTrackings] = await Promise.all([
      this.repository.findReferenceBookmakerAccountsForUser(
        userId,
        bookmakerAccountIds,
        tx,
      ),
      this.repository.findReferenceQualifyConditionsForUser(
        userId,
        qualifyConditionIds,
        tx,
      ),
      this.repository.findReferenceUsageTrackingsForUser(
        userId,
        usageTrackingIds,
        tx,
      ),
    ]);

    if (bookmakerAccounts.length !== bookmakerAccountIds.length) {
      throw new BadRequestError('One or more bookmakerAccountId values are invalid.');
    }
    if (qualifyConditions.length !== qualifyConditionIds.length) {
      throw new BadRequestError('One or more qualifyConditionId values are invalid.');
    }
    if (usageTrackings.length !== usageTrackingIds.length) {
      throw new BadRequestError('One or more usageTrackingId values are invalid.');
    }

    return {
      bookmakerAccounts: new Map(
        bookmakerAccounts.map((account) => [account.id, account]),
      ),
      qualifyConditions: new Map(
        qualifyConditions.map((condition) => [
          condition.id,
          {
            id: condition.id,
            type: condition.type,
            status: condition.status,
            promotionId: condition.promotionId,
            promotion: {
              id: condition.promotion.id,
              name: condition.promotion.name,
              bookmakerAccountId: condition.promotion.bookmakerAccountId,
              status: condition.promotion.status,
            },
            rewards: condition.rewards.map((reward) => ({
              id: reward.id,
              type: reward.type,
              status: reward.status,
              phaseId: reward.phaseId,
              phase: {
                id: reward.phase.id,
                name: reward.phase.name,
                status: reward.phase.status,
              },
            })),
          },
        ]),
      ),
      usageTrackings: new Map(
        usageTrackings.map((tracking) => [
          tracking.id,
          {
            id: tracking.id,
            type: tracking.type,
            rewardId: tracking.rewardId,
            reward: {
              id: tracking.reward.id,
              type: tracking.reward.type,
              value: tracking.reward.value,
              status: tracking.reward.status,
              phaseId: tracking.reward.phaseId,
              phase: {
                id: tracking.reward.phase.id,
                name: tracking.reward.phase.name,
                status: tracking.reward.phase.status,
              },
              promotion: {
                id: tracking.reward.promotion.id,
                name: tracking.reward.promotion.name,
                bookmakerAccountId: tracking.reward.promotion.bookmakerAccountId,
                status: tracking.reward.promotion.status,
              },
            },
          },
        ]),
      ),
    };
  }

  private requireBookmakerAccount(
    references: ResolvedReferences,
    bookmakerAccountId: string,
  ): ResolvedBookmakerAccount {
    const bookmakerAccount = references.bookmakerAccounts.get(bookmakerAccountId);
    if (!bookmakerAccount) {
      throw new BadRequestError(`Unknown bookmaker account ${bookmakerAccountId}.`);
    }

    return bookmakerAccount;
  }

  private resolveParticipationContext(
    references: ResolvedReferences,
    participation: PromotionParticipationInput,
    bookmakerAccountId: string,
  ): ResolvedParticipationContext {
    if (participation.kind === 'QUALIFY_TRACKING') {
      const qualifyCondition = references.qualifyConditions.get(participation.qualifyConditionId);
      if (!qualifyCondition) {
        throw new BadRequestError(
          `Qualify condition ${participation.qualifyConditionId} does not exist.`,
        );
      }

      if (qualifyCondition.type === 'DEPOSIT') {
        throw new BadRequestError('DEPOSIT qualify conditions are not valid for bet participations.');
      }

      if (qualifyCondition.promotion.bookmakerAccountId !== bookmakerAccountId) {
        throw new BadRequestError(
          'The qualify condition promotion account does not match the bet account.',
        );
      }

      if (!isActivePromotionStatus(qualifyCondition.promotion.status)) {
        throw new BadRequestError(
          'Cannot register bet tracking for a qualify condition whose promotion is not ACTIVE.',
        );
      }

      if (!isQualifyConditionStatusOpen(qualifyCondition.status)) {
        throw new BadRequestError(
          'Cannot register bet tracking for a qualify condition outside PENDING or QUALIFYING status.',
        );
      }

      const rewardsById = new Map(
        qualifyCondition.rewards.map((reward) => [reward.id, reward]),
      );

      for (const rewardId of participation.rewardIds) {
        if (!rewardsById.has(rewardId)) {
          throw new BadRequestError(
            `Reward ${rewardId} is not linked to qualify condition ${participation.qualifyConditionId}.`,
          );
        }
      }

      const calculationReward = rewardsById.get(participation.calculationRewardId);
      if (!calculationReward) {
        throw new BadRequestError(
          `calculationRewardId ${participation.calculationRewardId} is not linked to qualify condition ${participation.qualifyConditionId}.`,
        );
      }

      if (calculationReward.type !== participation.rewardType) {
        throw new BadRequestError(
          `rewardType mismatch for qualify condition ${participation.qualifyConditionId}.`,
        );
      }

      if (calculationReward.status !== 'QUALIFYING') {
        throw new BadRequestError(
          'Cannot register bet tracking because the linked reward is no longer QUALIFYING.',
        );
      }

      if (!isActivePhaseStatus(calculationReward.phase.status)) {
        throw new BadRequestError(
          'Cannot register bet tracking because the linked phase is not ACTIVE.',
        );
      }

      return {
        promotionId: qualifyCondition.promotionId,
        phaseId: calculationReward.phaseId,
      };
    }

    const usageTracking = references.usageTrackings.get(participation.usageTrackingId);
    if (!usageTracking) {
      throw new BadRequestError(
        `Usage tracking ${participation.usageTrackingId} does not exist.`,
      );
    }

    if (usageTracking.reward.id !== participation.rewardId) {
      throw new BadRequestError(
        `rewardId ${participation.rewardId} does not match usageTracking ${participation.usageTrackingId}.`,
      );
    }

    if (usageTracking.reward.type !== participation.rewardType) {
      throw new BadRequestError(
        `rewardType mismatch for usageTracking ${participation.usageTrackingId}.`,
      );
    }

    if (usageTracking.reward.promotion.bookmakerAccountId !== bookmakerAccountId) {
      throw new BadRequestError(
        'The reward promotion account does not match the bet account.',
      );
    }

    if (!isRewardStatusUsableInBet(usageTracking.reward.status)) {
      throw new BadRequestError(
        'Cannot register bet usage because the reward is not in RECEIVED or IN_USE status.',
      );
    }

    if (!isActivePromotionStatus(usageTracking.reward.promotion.status)) {
      throw new BadRequestError(
        'Cannot register bet usage because the reward promotion is not ACTIVE.',
      );
    }

    if (!isActivePhaseStatus(usageTracking.reward.phase.status)) {
      throw new BadRequestError(
        'Cannot register bet usage because the reward phase is not ACTIVE.',
      );
    }

    return {
      promotionId: usageTracking.reward.promotion.id,
      phaseId: usageTracking.reward.phase.id,
    };
  }

  private resolveCreateTargetParticipationId(
    input: RegisterBetsBatch,
    createdParticipationIdsByKey: Map<string, string>,
  ): string | null {
    const target = input.calculation.target;
    if (!target) {
      return null;
    }

    const calculationParticipationId = createdParticipationIdsByKey.get(target.participationKey);
    if (!calculationParticipationId) {
      throw new BadRequestError(
        `Target participationKey ${target.participationKey} was not created.`,
      );
    }

    return calculationParticipationId;
  }

  private resolveUpdateTargetParticipationId(
    finalBatch: BetBatchWithRelations,
    input: UpdateBetsBatch,
    createdParticipationIdsByKey: Map<string, string>,
  ): string | null {
    const target = input.calculation.target;
    if (!target) {
      return null;
    }

    if (target.participationId) {
      const exists = finalBatch.bets.some((bet) =>
        bet.participations.some((participation) => participation.id === target.participationId),
      );

      if (!exists) {
        throw new BadRequestError(
          `Target participationId ${target.participationId} does not exist in the final batch.`,
        );
      }

      return target.participationId;
    }

    const createdParticipationId = createdParticipationIdsByKey.get(target.participationKey!);
    if (!createdParticipationId) {
      throw new BadRequestError(
        `Target participationKey ${target.participationKey} does not resolve to a new participation.`,
      );
    }

    return createdParticipationId;
  }

  private async createBetWithParticipations(
    tx: Prisma.TransactionClient,
    userId: string,
    batchId: string,
    leg: BetLegInput | UpdateBetLegInput,
    references: ResolvedReferences,
    createdParticipationIdsByKey: CreatedParticipationIdsByKey,
  ) {
    const bet = await this.repository.createBet(
      toBetCreateInput(leg, userId, batchId),
      tx,
    );

    await this.createParticipationsForBet(
      tx,
      batchId,
      bet.id,
      leg.bookmakerAccountId,
      leg.participations,
      references,
      createdParticipationIdsByKey,
    );
  }

  private async updateBetWithParticipations(
    tx: Prisma.TransactionClient,
    batchId: string,
    update: BetLegUpdateDiff,
    references: ResolvedReferences,
    createdParticipationIdsByKey: CreatedParticipationIdsByKey,
  ) {
    await this.repository.updateBet(update.betId, toBetUpdateInput(update.input), tx);
    await this.repository.deleteParticipations(update.participationUpdates.deletes, tx);

    const bookmakerAccount = this.requireBookmakerAccount(
      references,
      update.input.bookmakerAccountId,
    );

    for (const participationUpdate of update.participationUpdates.updates) {
      const resolvedContext = this.resolveParticipationContext(
        references,
        participationUpdate.input,
        bookmakerAccount.id,
      );

      await this.repository.updateParticipation(
        participationUpdate.id,
        toBetParticipationUpdateInput(participationUpdate.input, resolvedContext),
        tx,
      );
    }

    await this.createParticipationsForBet(
      tx,
      batchId,
      update.betId,
      update.input.bookmakerAccountId,
      update.participationUpdates.creates,
      references,
      createdParticipationIdsByKey,
    );
  }

  private async createParticipationsForBet(
    tx: Prisma.TransactionClient,
    batchId: string,
    betId: string,
    bookmakerAccountId: string,
    participations: PromotionParticipationInput[],
    references: ResolvedReferences,
    createdParticipationIdsByKey: CreatedParticipationIdsByKey,
  ) {
    const bookmakerAccount = this.requireBookmakerAccount(
      references,
      bookmakerAccountId,
    );

    for (const participation of participations) {
      const resolvedContext = this.resolveParticipationContext(
        references,
        participation,
        bookmakerAccount.id,
      );
      const createdParticipation = await this.repository.createParticipation(
        toBetParticipationCreateInput(participation, {
          betId,
          batchId,
          promotionId: resolvedContext.promotionId,
          phaseId: resolvedContext.phaseId,
        }),
        tx,
      );

      createdParticipationIdsByKey.set(
        participation.participationKey,
        createdParticipation.id,
      );
    }
  }

  private validateUpdateIdentifiers(
    existing: BetBatchWithRelations,
    input: UpdateBetsBatch,
  ) {
    const existingBetsById = new Map(existing.bets.map((bet) => [bet.id, bet]));

    for (const leg of input.legs) {
      if (!leg.betId) {
        continue;
      }

      const existingBet = existingBetsById.get(leg.betId);
      if (!existingBet) {
        throw new BadRequestError(
          `betId ${leg.betId} does not belong to batch ${existing.id}.`,
        );
      }

      const existingParticipationIds = new Set(
        existingBet.participations.map((participation) => participation.id),
      );

      for (const participation of leg.participations) {
        if (!isPersistedParticipationKey(participation.participationKey)) {
          continue;
        }

        const participationId = extractPersistedParticipationId(
          participation.participationKey,
        );

        if (!existingParticipationIds.has(participationId)) {
          throw new BadRequestError(
            `participationKey ${participation.participationKey} does not belong to bet ${leg.betId}.`,
          );
        }
      }
    }
  }
}

function isPersistedParticipationKey(participationKey: string) {
  return participationKey.startsWith(persistedParticipationPrefix);
}

function extractPersistedParticipationId(participationKey: string) {
  return participationKey.slice(persistedParticipationPrefix.length);
}

function buildBatchWhereInput(input: BetBatchListInput): Prisma.BetRegistrationBatchWhereInput {
  const where: Prisma.BetRegistrationBatchWhereInput = {};

  if (input.strategyKind) {
    where.strategyKind = input.strategyKind;
  }
  if (input.status) {
    where.bets = {
      some: {
        status: input.status,
      },
    };
  }
  if (input.bookmakerAccountId) {
    where.bets = {
      some: {
        ...(where.bets?.some ?? {}),
        bookmakerAccountId: input.bookmakerAccountId,
      },
    };
  }

  return where;
}

function isRewardUsageTrackingUsable(context: BetAvailableRewardUsageTracking) {
  switch (context.type) {
    case 'FREEBET': {
      const usageTracking = FreeBetUsageTrackingSchema.safeParse(context.usageData);
      const usageConditions = FreeBetUsageConditionsSchema.safeParse(
        context.reward.usageConditions,
      );

      if (!usageTracking.success || !usageConditions.success) {
        return true;
      }

      if (
        usageConditions.data.mustUseComplete ||
        usageConditions.data.allowMultipleBets === false
      ) {
        return (
          usageTracking.data.totalUsed === 0 &&
          usageTracking.data.remainingBalance > 0
        );
      }

      return usageTracking.data.remainingBalance > 0;
    }
    case 'BET_BONUS_ROLLOVER': {
      const usageTracking = BonusRolloverUsageTrackingSchema.safeParse(
        context.usageData,
      );
      return !usageTracking.success || usageTracking.data.remainingRollover > 0;
    }
    case 'CASINO_SPINS': {
      const usageTracking = CasinoSpinsUsageTrackingSchema.safeParse(
        context.usageData,
      );
      return !usageTracking.success || usageTracking.data.remainingSpins > 0;
    }
    default:
      return true;
  }
}

function isRewardUsageTrackingAvailable(context: BetAvailableRewardUsageTracking) {
  return (
    isRewardUsageTrackingUsable(context) &&
    isRewardStatusUsableInBet(context.reward.status) &&
    isActivePromotionStatus(context.reward.promotion.status) &&
    isActivePhaseStatus(context.reward.phase.status)
  );
}

function buildBatchOrderBy(
  input: BetBatchListInput,
): Prisma.BetRegistrationBatchOrderByWithRelationInput {
  const sort = input.sorting?.[0];
  if (!sort) {
    return { createdAt: 'desc' };
  }

  const direction = sort.desc ? 'desc' : 'asc';
  if (sort.id === 'profit' || sort.id === 'risk' || sort.id === 'yield' || sort.id === 'createdAt' || sort.id === 'updatedAt') {
    return { [sort.id]: direction };
  }

  return { createdAt: 'desc' };
}

function buildBetWhereInput(input: BetListInput): Prisma.BetWhereInput {
  const where: Prisma.BetWhereInput = {};

  if (input.status) {
    where.status = input.status;
  }
  if (input.bookmakerAccountId) {
    where.bookmakerAccountId = input.bookmakerAccountId;
  }
  if (input.batchId) {
    where.batchId = input.batchId;
  }
  if (input.promotionId) {
    where.participations = {
      some: {
        promotionId: input.promotionId,
      },
    };
  }
  if (input.qualifyConditionId) {
    where.participations = {
      some: {
        ...(where.participations?.some ?? {}),
        qualifyConditionId: input.qualifyConditionId,
      },
    };
  }
  if (input.usageTrackingId) {
    where.participations = {
      some: {
        ...(where.participations?.some ?? {}),
        usageTrackingId: input.usageTrackingId,
      },
    };
  }
  if (input.placedFrom || input.placedTo) {
    where.placedAt = {
      ...(input.placedFrom ? { gte: input.placedFrom } : {}),
      ...(input.placedTo ? { lte: input.placedTo } : {}),
    };
  }

  return where;
}

function buildBetOrderBy(
  input: BetListInput,
): Prisma.BetOrderByWithRelationInput {
  const sort = input.sorting?.[0];
  if (!sort) {
    return { placedAt: 'desc' };
  }

  const direction = sort.desc ? 'desc' : 'asc';
  if (
    sort.id === 'placedAt' ||
    sort.id === 'createdAt' ||
    sort.id === 'updatedAt' ||
    sort.id === 'status' ||
    sort.id === 'stake' ||
    sort.id === 'odds' ||
    sort.id === 'profit' ||
    sort.id === 'risk' ||
    sort.id === 'yield'
  ) {
    return { [sort.id]: direction };
  }

  return { placedAt: 'desc' };
}

function collectQualifyConditionIds(
  legs: Array<{ participations: PromotionParticipationInput[] }>,
): string[] {
  return unique(
    legs.flatMap((leg) =>
      leg.participations
        .filter((participation) => participation.kind === 'QUALIFY_TRACKING')
        .map((participation) => participation.qualifyConditionId),
    ),
  );
}

function collectUsageTrackingIds(
  legs: Array<{ participations: PromotionParticipationInput[] }>,
): string[] {
  return unique(
    legs.flatMap((leg) =>
      leg.participations
        .filter((participation) => participation.kind === 'REWARD_USAGE')
        .map((participation) => participation.usageTrackingId),
    ),
  );
}

function extractTrackingTargets(batch: BetBatchWithRelations) {
  return {
    qualifyConditionIds: unique(
      batch.bets.flatMap((bet) =>
        bet.participations
          .map((participation) => participation.qualifyConditionId)
          .filter((value): value is string => value !== null),
      ),
    ),
    usageTrackingIds: unique(
      batch.bets.flatMap((bet) =>
        bet.participations
          .map((participation) => participation.usageTrackingId)
          .filter((value): value is string => value !== null),
      ),
    ),
  };
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

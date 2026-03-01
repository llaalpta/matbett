import {
  PromotionSchema,
  getPhaseLifecyclePolicy,
  getPromotionLifecyclePolicy,
  resolveTimeframeWindow,
  type Promotion,
  type PromotionEntity,
  type PromotionListInput,
  type PaginatedResponse,
  type AnchorCatalog,
  type AnchorOccurrences,
  type QualifyConditionEntity,
  PromotionStatusSchema,
} from '@matbett/shared';
import type { Prisma } from '@prisma/client';
import type { IPromotionService } from '@matbett/api';

import {
  toPromotionCreateInput,
  toPromotionUpdateInput,
  toPromotionEntity,
  generateAnchorCatalog,
  generateAnchorOccurrences,
  toPromotionQualifyConditionEntity,
} from '@/lib/transformers/promotion.transformer';
import { AppError, BadRequestError } from '@/utils/errors';
import { prisma } from '@/lib/prisma';
import type { PromotionWithRelations } from '@/repositories/promotion.repository';
import { PromotionRepository } from '@/repositories/promotion.repository';

const formatLifecycleReasons = (reasons: Array<{ message: string }>) =>
  reasons.map((reason) => reason.message).join(' ');

const getDisabledStatusReasons = <TStatus extends string>(
  options: Array<{ value: TStatus; enabled: boolean; reasons: Array<{ message: string }> }>,
  status: TStatus | undefined,
) => {
  if (!status) {
    return [];
  }

  const option = options.find((candidate) => candidate.value === status);
  return option && !option.enabled ? option.reasons : [];
};

function compareNullableDates(
  left: Date | null | undefined,
  right: Date | null | undefined,
  direction: 'asc' | 'desc',
) {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  return direction === 'asc'
    ? left.getTime() - right.getTime()
    : right.getTime() - left.getTime();
}

/**
 * PromotionService
 *
 * Manages the business logic for matched betting promotions.
 * Implements the "Application-Side IDs" strategy for atomic and robust CRUD operations.
 */
export class PromotionService implements IPromotionService {
  private readonly repository: PromotionRepository;

  constructor() {
    this.repository = new PromotionRepository();
  }

  private async resolveBookmakerAccountSnapshot(
    tx: Prisma.TransactionClient,
    userId: string,
    bookmakerAccountId: string
  ) {
    const bookmakerAccount = await this.repository.findBookmakerAccountSnapshotForUser(
      userId,
      bookmakerAccountId,
      tx
    );

    if (!bookmakerAccount) {
      throw new BadRequestError('Bookmaker account not found for this user.');
    }

    return bookmakerAccount;
  }

  private validatePromotionLifecycle(input: Promotion): void {
    for (const phase of input.phases) {
      const phaseLifecycle = getPhaseLifecyclePolicy({
        isPersisted: Boolean(phase.id),
        promotionStatus: input.status,
        phaseStatus: phase.status,
        rewards: phase.rewards.map((reward) => ({
          rewardStatus: reward.status,
          qualifyConditionStatuses: reward.qualifyConditions.map(
            (condition) => condition.status,
          ),
        })),
      });
      const phaseStatusDisabledReasons = getDisabledStatusReasons(
        phaseLifecycle.statusOptions,
        phase.status,
      );

      if (phaseStatusDisabledReasons.length > 0) {
        throw new BadRequestError(formatLifecycleReasons(phaseStatusDisabledReasons));
      }
    }

    const promotionLifecycle = getPromotionLifecyclePolicy({
      isPersisted: Boolean(input.id),
      promotionStatus: input.status,
      phases: input.phases.map((phase) => ({
        phaseStatus: phase.status,
        rewards: phase.rewards.map((reward) => ({
          rewardStatus: reward.status,
          qualifyConditionStatuses: reward.qualifyConditions.map(
            (condition) => condition.status,
          ),
        })),
      })),
    });
    const promotionStatusDisabledReasons = getDisabledStatusReasons(
      promotionLifecycle.statusOptions,
      input.status,
    );

    if (promotionStatusDisabledReasons.length > 0) {
      throw new BadRequestError(formatLifecycleReasons(promotionStatusDisabledReasons));
    }
  }

  /**
   * Creates a new promotion using an atomic nested write operation.
   *
   * @param data - The promotion data adhering to the shared Promotion schema.
   * @returns The created promotion entity.
   */
  async create(data: Promotion, userId: string): Promise<PromotionEntity> {
    const validated = PromotionSchema.parse(data);
    this.validatePromotionLifecycle(validated);

    return prisma.$transaction(async (tx) => {
      const bookmakerAccount = await this.resolveBookmakerAccountSnapshot(
        tx,
        userId,
        validated.bookmakerAccountId
      );

      const prismaInput = toPromotionCreateInput(validated, userId, bookmakerAccount);
      const created = await this.repository.create(prismaInput, tx);

      return toPromotionEntity(created);
    });
  }

  /**
   * Updates an existing promotion using an atomic nested write operation.
   *
   * @param id - The ID of the promotion to update.
   * @param data - The partial data to update.
   * @returns The updated promotion entity.
   */
  async update(id: string, data: Promotion): Promise<PromotionEntity> {
    const validated = PromotionSchema.parse(data);
    this.validatePromotionLifecycle(validated);

    return prisma.$transaction(async (tx) => {
      const existing = await this.repository.findById(id, tx);
      if (!existing) {
        throw new AppError('Promotion not found', 404);
      }

      this.assertNoBlockedHierarchyRemovals(existing, validated);
      const bookmakerAccount = await this.resolveBookmakerAccountSnapshot(
        tx,
        existing.userId,
        validated.bookmakerAccountId
      );
      const updateInput = toPromotionUpdateInput(
        validated,
        existing.id,
        bookmakerAccount
      );
      const updated = await this.repository.update(id, updateInput, tx);

      return toPromotionEntity(updated);
    });
  }

  private assertNoBlockedHierarchyRemovals(
    existing: PromotionWithRelations,
    incoming: Promotion
  ): void {
    const incomingPhaseIds = new Set(
      incoming.phases.map((phase) => phase.id).filter(Boolean)
    );

    const removedPhases = existing.phases.filter(
      (phase) => !incomingPhaseIds.has(phase.id)
    );

    for (const phase of removedPhases) {
      if (phase.rewards.length > 0) {
        throw new BadRequestError(
          `Cannot remove phase "${phase.name}" because it still has rewards. Remove child rewards first.`
        );
      }
    }

    for (const existingPhase of existing.phases) {
      const incomingPhase = incoming.phases.find(
        (phase) => phase.id === existingPhase.id
      );
      if (!incomingPhase) {
        continue;
      }

      const incomingRewardIds = new Set(
        incomingPhase.rewards.map((reward) => reward.id).filter(Boolean)
      );
      const removedRewards = existingPhase.rewards.filter(
        (reward) => !incomingRewardIds.has(reward.id)
      );

      for (const reward of removedRewards) {
        if (reward.qualifyConditions.length > 0) {
          throw new BadRequestError(
            `Cannot remove reward "${reward.id}" because it still has qualify conditions. Remove child qualify conditions first.`
          );
        }
      }
    }

    const incomingConditionIds = new Set<string>();
    for (const condition of incoming.availableQualifyConditions) {
      if (condition.id) {
        incomingConditionIds.add(condition.id);
      }
    }
    for (const phase of incoming.phases) {
      for (const reward of phase.rewards) {
        for (const condition of reward.qualifyConditions) {
          if (condition.id) {
            incomingConditionIds.add(condition.id);
          }
        }
      }
    }

    const removedConditions = existing.availableQualifyConditions.filter(
      (condition) => !incomingConditionIds.has(condition.id)
    );

    for (const condition of removedConditions) {
      const hasUsage = (condition._count.rewards ?? 0) > 0;
      const hasTracking = (condition._count.depositParticipations ?? 0) > 0 || (condition._count.betParticipations ?? 0) > 0;

      if (hasUsage || hasTracking) {
        throw new BadRequestError(
          `Cannot remove qualify condition "${condition.id}" because it still has dependencies.`
        );
      }
    }
  }

  /**
   * Lists promotions with pagination, filtering, and sorting.
   *
   * @param input - Parameters for pagination, filters, and sorting.
   * @returns A paginated response of promotion entities.
   */
  async list(userId: string, input: PromotionListInput): Promise<PaginatedResponse<PromotionEntity>> {
    const { pageIndex, pageSize, status, bookmakerAccountId, sorting, globalFilter } = input;

    const where: Prisma.PromotionWhereInput = { userId };
    if (status) {
      const parsedStatus = PromotionStatusSchema.safeParse(status);
      if (parsedStatus.success) {where.status = parsedStatus.data;}
    }
    if (bookmakerAccountId) {
      where.bookmakerAccountId = bookmakerAccountId;
    }
    if (globalFilter && globalFilter.trim().length > 0) {
      const search = globalFilter.trim();
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const sortId = sorting?.[0]?.id;
    const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';
    const requiresCustomTemporalSort =
      sortId === 'timeframeStart' || sortId === 'timeframeEnd';

    let orderBy: Prisma.PromotionOrderByWithRelationInput = { createdAt: 'desc' };
    if (sorting && sorting.length > 0 && sorting[0]) {
      const { id, desc } = sorting[0];
      const direction = desc ? 'desc' : 'asc';
      if (['name', 'createdAt', 'updatedAt', 'status'].includes(id)) {
        orderBy = { [id]: direction };
      }
    }

    const [promotions, total, betSummaries, depositSummaries, rewardSummaries] = await prisma.$transaction(async (tx) => {
      const promoPromise = this.repository.findMany(
        requiresCustomTemporalSort
          ? { where }
          : { where, orderBy, skip: pageIndex * pageSize, take: pageSize },
        tx,
      );
      const totalPromise = this.repository.count({ where }, tx);
      const promotionsResult = await promoPromise;
      const promotionIds = promotionsResult.map((promotion) => promotion.id);
      const betSummariesPromise = this.repository.getBetOperationalSummaries(
        promotionIds,
        tx,
      );
      const depositSummariesPromise = this.repository.getDepositCountsByPromotionIds(
        promotionIds,
        tx,
      );
      const rewardSummariesPromise = this.repository.getRewardOperationalSummariesByPromotionIds(
        promotionIds,
        tx,
      );

      const [totalResult, betSummariesResult, depositSummariesResult, rewardSummariesResult] = await Promise.all([
        totalPromise,
        betSummariesPromise,
        depositSummariesPromise,
        rewardSummariesPromise,
      ]);

      return [
        promotionsResult,
        totalResult,
        betSummariesResult,
        depositSummariesResult,
        rewardSummariesResult,
      ];
    });

    const betSummaryByPromotionId = new Map(
      betSummaries.map((summary) => [summary.promotionId, summary]),
    );
    const depositSummaryByPromotionId = new Map(
      depositSummaries.map((summary) => [summary.promotionId, summary]),
    );
    const rewardSummaryByPromotionAndRewardId = new Map(
      rewardSummaries.map((summary) => [
        `${summary.promotionId}:${summary.rewardId}`,
        summary,
      ]),
    );
    let promotionEntities = promotions.map((promotion: PromotionWithRelations) => {
      const entity = toPromotionEntity(promotion);
      const timeframeWindow = resolveTimeframeWindow(entity.timeframe, entity);
      const betSummary = betSummaryByPromotionId.get(promotion.id);
      const depositSummary = depositSummaryByPromotionId.get(promotion.id);
      const phases = entity.phases.map((phase) => ({
        ...phase,
        rewards: phase.rewards.map((reward) => {
          const rewardSummary = rewardSummaryByPromotionAndRewardId.get(
            `${promotion.id}:${reward.id}`,
          );
          const totalStake = rewardSummary?.totalStake ?? 0;

          return {
            ...reward,
            totalStake,
            aggregateYield:
              totalStake > 0 ? (reward.totalBalance / totalStake) * 100 : 0,
          };
        }),
      }));
      const totalStake = betSummary?.totalStake ?? 0;

      return {
        ...entity,
        timeframeStart: timeframeWindow.start,
        timeframeEnd: timeframeWindow.end,
        phases,
        totalLegs: betSummary?.totalLegs ?? 0,
        totalDeposits: depositSummary?.totalDeposits ?? 0,
        totalStake,
        aggregateYield: totalStake > 0 ? (entity.totalBalance / totalStake) * 100 : 0,
      };
    });

    if (requiresCustomTemporalSort) {
      promotionEntities = [...promotionEntities].sort((left, right) =>
        compareNullableDates(
          sortId === 'timeframeStart' ? left.timeframeStart : left.timeframeEnd,
          sortId === 'timeframeStart' ? right.timeframeStart : right.timeframeEnd,
          sortDirection,
        ),
      );
    }

    const pagedPromotionEntities = requiresCustomTemporalSort
      ? promotionEntities.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize)
      : promotionEntities;
    const pageCount = Math.ceil(total / pageSize);

    return {
      data: pagedPromotionEntities,
      meta: { pageCount, rowCount: total, pageIndex, pageSize },
    };
  }

  /**
   * Gets a single promotion by ID.
   *
   * @param id - The ID of the promotion.
   * @returns The found promotion entity or null.
   */
  async getById(id: string): Promise<PromotionEntity | null> {
    const promotion = await this.repository.findById(id);
    if (!promotion) {return null;}
    return toPromotionEntity(promotion);
  }

  /**
   * Deletes a promotion.
   *
   * @param id - The ID of the promotion to delete.
   */
  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new AppError('Promotion not found', 404);
    }
    await this.repository.delete(id);
  }

  async getAnchorCatalog(promotionId: string): Promise<AnchorCatalog> {
    const promotion = await this.repository.findById(promotionId);
    if (!promotion) {
      throw new AppError('Promotion not found', 404);
    }
    return generateAnchorCatalog(promotion);
  }

  async getAnchorOccurrences(promotionId: string): Promise<AnchorOccurrences> {
    const promotion = await this.repository.findById(promotionId);
    if (!promotion) {
      throw new AppError('Promotion not found', 404);
    }
    return generateAnchorOccurrences(promotion);
  }

  async getAvailableQualifyConditions(
    promotionId: string
  ): Promise<QualifyConditionEntity[]> {
    const conditions =
      await this.repository.findAvailableQualifyConditionsByPromotionId(
        promotionId
      );

    if (!conditions) {
      throw new AppError('Promotion not found', 404);
    }

    return conditions.map((condition) => toPromotionQualifyConditionEntity(condition));
  }
}

import { createId } from '@paralleldrive/cuid2';
import {
  BonusRolloverUsageConditionsSchema,
  BetListItemSchema,
  CasinoSpinsUsageConditionsSchema,
  DepositEntitySchema,
  FreeBetTypeSpecificFieldsSchema,
  QualifyConditionTypeSchema,
  QualifyConditionSchema,
  RewardSchema,
  RewardRelatedTrackingSchema,
  resolveTimeframeWindow,
  getRewardNextQualifyDeadline,
  getQualifyConditionLifecyclePolicy,
  getRewardLifecyclePolicy,
  type PaginatedResponse,
  type AnchorRefType,
  type CreateRewardInput,
  type RewardRelatedBet,
  type RewardRelatedBetContext,
  type RewardRelatedDeposit,
  type RewardRelatedTracking,
  type QualifyCondition,
  type QualifyConditionParentContext,
  type QualifyConditionEntity,
  type Reward,
  type RewardEntity,
  type RewardListInput,
  type Timeframe,
  type UsageConditions,
} from '@matbett/shared';
import type { IRewardService } from '@matbett/api';
import { Prisma } from '@prisma/client';
import { AppError, BadRequestError } from '@/utils/errors';
import { prisma } from '@/lib/prisma';
import { BetRepository } from '@/repositories/bet.repository';
import { DepositRepository } from '@/repositories/deposit.repository';
import { extractQualifyConditions } from '@/lib/transformers/qualify-condition.transformer';
import { toInputJson } from '@/utils/prisma-json';
import { RewardRepository } from '@/repositories/reward.repository';
import { toBetListItem } from '@/lib/transformers/bet.transformer';
import { toDepositEntity } from '@/lib/transformers/deposit.transformer';
import { PromotionRepository } from '@/repositories/promotion.repository';
import { toPromotionEntity } from '@/lib/transformers/promotion.transformer';
import {
  toQualifyConditionEntity,
  toRewardUpdateInput,
  toRewardEntity,
} from '@/lib/transformers/reward.transformer';

const persistedRefType: AnchorRefType = 'persisted';

type AnchorEntityType = 'PROMOTION' | 'PHASE' | 'REWARD' | 'QUALIFY_CONDITION';

const getAnchorRefKey = (
  entityType: AnchorEntityType,
  refType: AnchorRefType,
  ref: string
): string => `${entityType}:${refType}:${ref}`;

const registerAnchorRef = (
  refMap: Map<string, string>,
  entityType: AnchorEntityType,
  persistedId: string,
  clientId?: string
): void => {
  refMap.set(getAnchorRefKey(entityType, 'persisted', persistedId), persistedId);
  if (clientId) {
    refMap.set(getAnchorRefKey(entityType, 'client', clientId), persistedId);
  }
};

const resolveTimeframeAnchors = (
  timeframe: Timeframe,
  refMap: Map<string, string>
): Timeframe => {
  if (timeframe.mode !== 'RELATIVE') {
    return timeframe;
  }

  const { entityType, entityRef, entityRefType } = timeframe.anchor;
  const entityTypeKey: AnchorEntityType = entityType;

  const persistedKey = getAnchorRefKey(entityTypeKey, 'persisted', entityRef);
  const clientKey = getAnchorRefKey(entityTypeKey, 'client', entityRef);

  const resolvedRef =
    entityRefType === 'client'
      ? refMap.get(clientKey)
      : refMap.get(persistedKey);

  if (!resolvedRef) {
    throw new BadRequestError(
      `Invalid relative timeframe anchor: ${entityType}:${entityRefType}:${entityRef}`
    );
  }

  return {
    ...timeframe,
    anchor: {
      ...timeframe.anchor,
      entityRefType: persistedRefType,
      entityRef: resolvedRef,
    },
  };
};

const resolveUsageConditionsAnchors = (
  usageConditions: UsageConditions,
  refMap: Map<string, string>
): UsageConditions => ({
  ...usageConditions,
  timeframe: resolveTimeframeAnchors(usageConditions.timeframe, refMap),
});

const mapRewardStatusDates = (status: Reward['status'] | undefined, statusDate: Date | undefined) => {
  const dates: {
    qualifyConditionsFulfilledAt?: Date | null;
    claimedAt?: Date | null;
    receivedAt?: Date | null;
    useStartedAt?: Date | null;
    useCompletedAt?: Date | null;
    expiredAt?: Date | null;
  } = {};

  if (!status) {return dates;}

  switch (status) {
    case 'PENDING_TO_CLAIM':
      if (!statusDate) {
        throw new BadRequestError('statusDate is required when changing status.');
      }
      dates.qualifyConditionsFulfilledAt = statusDate;
      break;
    case 'CLAIMED':
      if (!statusDate) {
        throw new BadRequestError('statusDate is required when changing status.');
      }
      dates.claimedAt = statusDate;
      break;
    case 'RECEIVED':
      if (!statusDate) {
        throw new BadRequestError('statusDate is required when changing status.');
      }
      dates.receivedAt = statusDate;
      break;
    case 'IN_USE':
      if (!statusDate) {
        throw new BadRequestError('statusDate is required when changing status.');
      }
      dates.useStartedAt = statusDate;
      break;
    case 'USED':
      if (!statusDate) {
        throw new BadRequestError('statusDate is required when changing status.');
      }
      dates.useCompletedAt = statusDate;
      break;
    case 'EXPIRED':
      if (!statusDate) {
        throw new BadRequestError('statusDate is required when changing status.');
      }
      dates.expiredAt = statusDate;
      break;
    default:
      break;
  }

  return dates;
};

const mapQualifyConditionStatusDates = (
  status: QualifyCondition['status'] | undefined,
  statusDate: Date | undefined
) => {
  const dates: {
    startedAt?: Date | null;
    qualifiedAt?: Date | null;
    failedAt?: Date | null;
    expiredAt?: Date | null;
  } = {};

  if (!status) {return dates;}

  switch (status) {
    case 'QUALIFYING':
      if (!statusDate) {
        throw new BadRequestError('statusDate is required when changing status.');
      }
      dates.startedAt = statusDate;
      break;
    case 'FULFILLED':
      if (!statusDate) {
        throw new BadRequestError('statusDate is required when changing status.');
      }
      dates.qualifiedAt = statusDate;
      break;
    case 'FAILED':
      if (!statusDate) {
        throw new BadRequestError('statusDate is required when changing status.');
      }
      dates.failedAt = statusDate;
      break;
    case 'EXPIRED':
      if (!statusDate) {
        throw new BadRequestError('statusDate is required when changing status.');
      }
      dates.expiredAt = statusDate;
      break;
    default:
      break;
  }

  return dates;
};

const getConditionIdentityKey = (condition: QualifyCondition): string => {
  if (condition.id) {return `id:${condition.id}`;}
  if (condition.clientId) {return `client:${condition.clientId}`;}
  throw new Error('QualifyCondition requires id or clientId');
};

const normalizeQualifyConditionDefinition = (
  condition: QualifyCondition | QualifyConditionEntity,
) => ({
  identity: 'id' in condition && condition.id ? `id:${condition.id}` : null,
  type: condition.type,
  description: condition.description ?? null,
  timeframe: condition.timeframe,
  conditions: condition.conditions,
});

const normalizeRewardDefinition = (
  reward: Reward | RewardEntity,
) => ({
  type: reward.type,
  valueType: reward.valueType,
  value: reward.value,
  activationMethod: reward.activationMethod,
  claimMethod: reward.claimMethod,
  activationRestrictions: reward.activationRestrictions ?? null,
  claimRestrictions: reward.claimRestrictions ?? null,
  withdrawalRestrictions: reward.withdrawalRestrictions ?? null,
  typeSpecificFields: reward.typeSpecificFields ?? null,
  usageConditions: reward.usageConditions,
  qualifyConditions: reward.qualifyConditions.map(normalizeQualifyConditionDefinition),
});

const hasRewardDefinitionChanges = (
  nextReward: Reward,
  existingReward: RewardEntity,
) =>
  JSON.stringify(normalizeRewardDefinition(nextReward)) !==
  JSON.stringify(normalizeRewardDefinition(existingReward));

const hasQualifyConditionDefinitionChanges = (
  nextCondition: QualifyCondition,
  existingCondition: QualifyConditionEntity,
) =>
  JSON.stringify(normalizeQualifyConditionDefinition(nextCondition)) !==
  JSON.stringify(normalizeQualifyConditionDefinition(existingCondition));

const shouldCreateUsageTrackingForStatus = (
  status: Reward['status'] | undefined,
) => status === 'RECEIVED' || status === 'IN_USE' || status === 'USED';

const isStakeNotReturned = (typeSpecificFields: unknown): boolean => {
  const parsed = FreeBetTypeSpecificFieldsSchema.safeParse(typeSpecificFields);
  return parsed.success ? parsed.data.stakeNotReturned : true;
};

const getRequiredRollover = (usageConditions: unknown, rewardValue: number): number => {
  const parsed = BonusRolloverUsageConditionsSchema.safeParse(usageConditions);
  return parsed.success ? (parsed.data.multiplier ?? 1) * rewardValue : rewardValue;
};

const getRemainingSpins = (usageConditions: unknown): number => {
  const parsed = CasinoSpinsUsageConditionsSchema.safeParse(usageConditions);
  return parsed.success ? parsed.data.spinsCount ?? 0 : 0;
};

const buildInitialUsageTrackingData = (
  reward: RewardEntity,
) => {
  const base = {
    totalRisk: 0,
    totalProfit: 0,
    balance: 0,
    yield: 0,
  };
  const rewardValue = typeof reward.value === 'number' ? reward.value : 0;
  const rewardType = reward.type;

  switch (rewardType) {
    case 'FREEBET':
      return {
        ...base,
        type: 'FREEBET' as const,
        totalUsed: 0,
        remainingBalance: rewardValue,
        isSnr: isStakeNotReturned(reward.typeSpecificFields),
      };
    case 'BET_BONUS_ROLLOVER':
      return {
        ...base,
        type: 'BET_BONUS_ROLLOVER' as const,
        totalUsed: 0,
        rolloverProgress: 0,
        remainingRollover: getRequiredRollover(
          reward.usageConditions,
          rewardValue,
        ),
      };
    case 'BET_BONUS_NO_ROLLOVER':
      return {
        ...base,
        type: 'BET_BONUS_NO_ROLLOVER' as const,
        totalUsed: 0,
      };
    case 'CASHBACK_FREEBET':
      return {
        ...base,
        type: 'CASHBACK_FREEBET' as const,
        totalCashback: 0,
      };
    case 'ENHANCED_ODDS':
      return {
        ...base,
        type: 'ENHANCED_ODDS' as const,
        oddsUsed: 0,
      };
    case 'CASINO_SPINS':
      return {
        ...base,
        type: 'CASINO_SPINS' as const,
        spinsUsed: 0,
        remainingSpins: getRemainingSpins(reward.usageConditions),
      };
    default:
      return {
        ...base,
        type: rewardType,
      };
  }
};

type ExistingRewardRecord = NonNullable<
  Awaited<ReturnType<RewardRepository['findById']>>
>;
type ExistingRewardQualifyConditionRecord = NonNullable<
  Awaited<ReturnType<RewardRepository['findQualifyConditionSummary']>>
>;

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

const resolveRewardStatusForQualifyConditionMutation = (
  currentRewardStatus: string,
  nextRewardStatus: string | undefined,
) => {
  if (currentRewardStatus === 'QUALIFYING' || nextRewardStatus === 'QUALIFYING') {
    return 'QUALIFYING';
  }

  return nextRewardStatus ?? currentRewardStatus;
};

const buildRewardLifecyclePolicyForUpdate = (
  existing: ExistingRewardRecord,
  nextReward: Reward,
  qualifyConditionStatuses: Array<string | undefined>,
) =>
  getRewardLifecyclePolicy({
    isPersisted: true,
    rewardType: nextReward.type ?? existing.type,
    rewardStatus: nextReward.status ?? existing.status,
    claimMethod: nextReward.claimMethod ?? existing.claimMethod,
    promotionStatus: existing.phase.promotion.status,
    phaseStatus: existing.phase.status,
    qualifyConditionStatuses,
  });

const buildQualifyConditionParentContextsForRewardUpdate = (
  existingReward: ExistingRewardRecord,
  rewardStatusForMutation: string,
  condition: ExistingRewardQualifyConditionRecord,
): QualifyConditionParentContext[] =>
  condition.rewards.map((reward) => ({
    rewardStatus: reward.id === existingReward.id ? rewardStatusForMutation : reward.status,
    phaseStatus: reward.phase.status,
    promotionStatus: reward.phase.promotion.status,
  }));

function buildRewardQualifyConditionLookup(reward: ExistingRewardRecord) {
  return new Map(
    reward.qualifyConditions.map((condition, index) => [
      condition.id,
      {
        index: index + 1,
        type: QualifyConditionTypeSchema.parse(condition.type),
      },
    ]),
  );
}

function resolveRewardRelatedBetContext(
  rewardId: string,
  bet: ReturnType<typeof BetListItemSchema.parse>,
  qualifyConditionLookup: ReturnType<typeof buildRewardQualifyConditionLookup>,
): RewardRelatedBetContext | null {
  const usageParticipation = bet.participations.find(
    (participation) =>
      participation.kind === 'REWARD_USAGE' && participation.rewardId === rewardId,
  );

  if (usageParticipation) {
    return {
      role: 'USAGE',
    };
  }

  const qualifyParticipation = bet.participations.find(
    (
      participation,
    ): participation is Extract<typeof bet.participations[number], { kind: 'QUALIFY_TRACKING' }> =>
      participation.kind === 'QUALIFY_TRACKING' &&
      (participation.calculationRewardId === rewardId || participation.rewardIds.includes(rewardId)),
  );

  if (!qualifyParticipation) {
    return null;
  }

  const qualifyCondition = qualifyConditionLookup.get(qualifyParticipation.qualifyConditionId);

  return {
    role: 'QUALIFY_TRACKING',
    qualifyConditionId: qualifyParticipation.qualifyConditionId,
    qualifyConditionIndex: qualifyCondition?.index,
    qualifyConditionType: qualifyCondition?.type,
  };
}

function resolveRewardRelatedDepositContext(
  rewardId: string,
  deposit: ReturnType<typeof DepositEntitySchema.parse>,
  qualifyConditionLookup: ReturnType<typeof buildRewardQualifyConditionLookup>,
): RewardRelatedDeposit['context'] | null {
  const participation = deposit.participations.find(
    (candidate) => candidate.rewardId === rewardId && candidate.qualifyConditionId,
  );

  if (!participation?.qualifyConditionId) {
    return null;
  }

  const qualifyCondition = qualifyConditionLookup.get(participation.qualifyConditionId);

  if (!qualifyCondition) {
    return null;
  }

  return {
    qualifyConditionId: participation.qualifyConditionId,
    qualifyConditionIndex: qualifyCondition.index,
    qualifyConditionType: 'DEPOSIT',
  };
}

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

export class RewardService implements IRewardService {
  private repository: RewardRepository;
  private betRepository: BetRepository;
  private depositRepository: DepositRepository;
  private promotionRepository: PromotionRepository;

  constructor() {
    this.repository = new RewardRepository();
    this.betRepository = new BetRepository();
    this.depositRepository = new DepositRepository();
    this.promotionRepository = new PromotionRepository();
  }

  async create(
    userId: string,
    input: CreateRewardInput,
  ): Promise<RewardEntity> {
    return prisma.$transaction(async (tx) => {
      const phase = await this.repository.findPhaseContextForUser(
        userId,
        input.phaseId,
        input.promotionId,
        tx,
      );

      if (!phase) {
        throw new AppError('Phase not found for promotion', 404);
      }

      const data = RewardSchema.parse(input.data);
      const rewardStatus = data.status ?? 'QUALIFYING';

      if (data.qualifyConditions.length > 0) {
        throw new BadRequestError(
          'Create the reward first, then add qualify conditions from the reward context.',
        );
      }

      if (rewardStatus !== 'QUALIFYING') {
        throw new BadRequestError(
          'A contextually created reward must start in QUALIFYING status.',
        );
      }

      const rewardId = data.id ?? createId();
      const lifecyclePolicy = getRewardLifecyclePolicy({
        isPersisted: false,
        rewardType: data.type,
        rewardStatus,
        claimMethod: data.claimMethod,
        promotionStatus: phase.promotion.status,
        phaseStatus: phase.status,
        qualifyConditionStatuses: [],
      });
      const statusDisabledReasons = getDisabledStatusReasons(
        lifecyclePolicy.statusOptions,
        rewardStatus,
      );

      if (statusDisabledReasons.length > 0) {
        throw new BadRequestError(formatLifecycleReasons(statusDisabledReasons));
      }

      const anchorRefMap = new Map<string, string>();
      registerAnchorRef(anchorRefMap, 'PROMOTION', input.promotionId);
      registerAnchorRef(anchorRefMap, 'PHASE', input.phaseId);
      registerAnchorRef(anchorRefMap, 'REWARD', rewardId, data.clientId);

      const resolvedUsageConditions = resolveUsageConditionsAnchors(
        data.usageConditions,
        anchorRefMap,
      );
      const statusDates = mapRewardStatusDates(data.status, data.statusDate);

      let created = await this.repository.create(
        {
          id: rewardId,
          type: data.type,
          value: data.value ?? 0,
          valueType: data.valueType,
          activationMethod: data.activationMethod,
          claimMethod: data.claimMethod,
          activationRestrictions: data.activationRestrictions ?? null,
          claimRestrictions: data.claimRestrictions ?? null,
          withdrawalRestrictions: data.withdrawalRestrictions ?? null,
          status: rewardStatus,
          typeSpecificFields:
            data.typeSpecificFields === null || data.typeSpecificFields === undefined
              ? Prisma.DbNull
              : toInputJson(data.typeSpecificFields),
          usageConditions: toInputJson(resolvedUsageConditions),
          promotion: {
            connect: {
              id: input.promotionId,
            },
          },
          phase: {
            connect: {
              id: input.phaseId,
            },
          },
          ...statusDates,
        },
        tx,
      );

      if (
        shouldCreateUsageTrackingForStatus(rewardStatus) &&
        !created.usageTracking
      ) {
        const createdEntity = toRewardEntity(created);
        await this.repository.createUsageTracking(
          {
            rewardId: created.id,
            type: created.type,
            balance: 0,
            usageData: toInputJson(buildInitialUsageTrackingData(createdEntity)),
          },
          tx,
        );

        const refreshed = await this.repository.findById(created.id, tx);
        if (!refreshed) {
          throw new AppError('Reward not found after create', 404);
        }
        created = refreshed;
      }

      return toRewardEntity(created);
    });
  }

  async list(
    userId: string,
    input: RewardListInput,
  ): Promise<PaginatedResponse<RewardEntity>> {
    const { pageIndex, pageSize, status, type, promotionId, sorting, globalFilter } = input;

    const where: Prisma.RewardWhereInput = {};

    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }
    if (promotionId) {
      where.promotionId = promotionId;
    }
    if (globalFilter && globalFilter.trim().length > 0) {
      const search = globalFilter.trim();
      where.OR = [
        {
          promotion: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          type: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          activationRestrictions: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          claimRestrictions: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          withdrawalRestrictions: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const sortId = sorting?.[0]?.id;
    const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';
    const requiresCustomTemporalSort =
      sortId === 'nextQualifyDeadline' || sortId === 'usageTimeframeEnd';

    let orderBy: Prisma.RewardOrderByWithRelationInput = {
      createdAt: 'desc',
    };
    if (sorting && sorting.length > 0 && sorting[0]) {
      const { id, desc } = sorting[0];
      const direction = desc ? 'desc' : 'asc';
      if (
        id === 'createdAt' ||
        id === 'updatedAt' ||
        id === 'status' ||
        id === 'type' ||
        id === 'value'
      ) {
        orderBy = { [id]: direction };
      }
    }

    const [rows, total, promotions] = await prisma.$transaction(async (tx) => {
      const rowsPromise = this.repository.findManyForUser(
        userId,
        requiresCustomTemporalSort
          ? {
              where,
            }
          : {
              where,
              orderBy,
              skip: pageIndex * pageSize,
              take: pageSize,
            },
        tx,
      );
      const totalPromise = this.repository.countForUser(userId, where, tx);
      const rowsResult = await rowsPromise;
      const promotionIds = [...new Set(rowsResult.map((row) => row.promotionId).filter(Boolean))];
      const promotionsResult =
        promotionIds.length > 0
          ? await this.promotionRepository.findMany(
              {
                where: {
                  id: {
                    in: promotionIds,
                  },
                },
              },
              tx,
            )
          : [];
      const totalResult = await totalPromise;

      return [rowsResult, totalResult, promotionsResult] as const;
    });

    const promotionById = new Map(
      promotions.map((promotion) => [promotion.id, toPromotionEntity(promotion)]),
    );

    let data = rows.map((row) => {
      const entity = toRewardEntity(row);
      const promotion = entity.promotionId ? promotionById.get(entity.promotionId) : undefined;
      const usageWindow = resolveTimeframeWindow(entity.usageConditions.timeframe, promotion);
      const nextDeadline = getRewardNextQualifyDeadline(entity, promotion);

      return {
        ...entity,
        nextQualifyDeadline: nextDeadline.date,
        usageTimeframeEnd: usageWindow.end,
      };
    });

    if (requiresCustomTemporalSort) {
      data = [...data].sort((left, right) =>
        compareNullableDates(
          sortId === 'nextQualifyDeadline' ? left.nextQualifyDeadline : left.usageTimeframeEnd,
          sortId === 'nextQualifyDeadline' ? right.nextQualifyDeadline : right.usageTimeframeEnd,
          sortDirection,
        ),
      );
    }

    return {
      data: requiresCustomTemporalSort
        ? data.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize)
        : data,
      meta: {
        pageCount: Math.ceil(total / pageSize),
        rowCount: total,
        pageIndex,
        pageSize,
      },
    };
  }

  async getById(id: string): Promise<RewardEntity | null> {
    const reward = await this.repository.findById(id);
    if (!reward) {return null;}
    return toRewardEntity(reward);
  }

  async getRelatedTracking(userId: string, id: string): Promise<RewardRelatedTracking> {
    const reward = await this.repository.findByIdForUser(userId, id);

    if (!reward) {
      throw new AppError('Reward not found', 404);
    }

    const qualifyConditionLookup = buildRewardQualifyConditionLookup(reward);

    const [bets, deposits] = await Promise.all([
      this.betRepository.findManyBetsForUser(userId, {
        where: {
          participations: {
            some: {
              OR: [
                {
                  kind: 'REWARD_USAGE',
                  rewardId: id,
                },
                {
                  kind: 'QUALIFY_TRACKING',
                  OR: [
                    { calculationRewardId: id },
                    { rewardIds: { has: id } },
                  ],
                },
              ],
            },
          },
        },
        orderBy: {
          placedAt: 'desc',
        },
      }),
      this.depositRepository.findMany(userId, {
        where: {
          participations: {
            some: {
              rewardId: id,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      }),
    ]);

    const relatedBets = bets.reduce<RewardRelatedBet[]>((items, betRecord) => {
      const bet = BetListItemSchema.parse(toBetListItem(betRecord));
      const context = resolveRewardRelatedBetContext(id, bet, qualifyConditionLookup);

      if (!context) {
        return items;
      }

      items.push({
        bet,
        context,
      });

      return items;
    }, []);

    const relatedDeposits = deposits.reduce<RewardRelatedDeposit[]>((items, depositRecord) => {
      const deposit = DepositEntitySchema.parse(toDepositEntity(depositRecord));
      const context = resolveRewardRelatedDepositContext(id, deposit, qualifyConditionLookup);

      if (!context) {
        return items;
      }

      items.push({
        deposit,
        context,
      });

      return items;
    }, []);

    return RewardRelatedTrackingSchema.parse({
      rewardId: id,
      relatedBets,
      relatedDeposits,
    });
  }

  async update(id: string, data: Reward): Promise<RewardEntity> {
    return prisma.$transaction(async (tx) => {
      const existing = await this.repository.findById(id, tx);
      if (!existing) {
        throw new AppError('Reward not found', 404);
      }
      const existingEntity = toRewardEntity(existing);
      const parsedQualifyConditions = data.qualifyConditions?.map((condition) =>
        QualifyConditionSchema.parse(condition)
      );
      const nextQualifyConditionStatuses =
        parsedQualifyConditions?.map((condition) => condition.status) ??
        existing.qualifyConditions.map((condition) => condition.status);
      const rewardLifecyclePolicy = buildRewardLifecyclePolicyForUpdate(
        existing,
        data,
        nextQualifyConditionStatuses,
      );
      const rewardStatusDisabledReasons = getDisabledStatusReasons(
        rewardLifecyclePolicy.statusOptions,
        data.status,
      );

      if (rewardStatusDisabledReasons.length > 0) {
        throw new BadRequestError(formatLifecycleReasons(rewardStatusDisabledReasons));
      }

      if (
        !rewardLifecyclePolicy.canEditStructure &&
        hasRewardDefinitionChanges(data, existingEntity)
      ) {
        throw new BadRequestError(
          formatLifecycleReasons(rewardLifecyclePolicy.structureReasons),
        );
      }

      const anchorRefMap = new Map<string, string>();
      registerAnchorRef(anchorRefMap, 'PROMOTION', existing.promotionId);
      registerAnchorRef(anchorRefMap, 'PHASE', existing.phaseId);
      registerAnchorRef(anchorRefMap, 'REWARD', existing.id);

      for (const existingCondition of existing.qualifyConditions) {
        registerAnchorRef(anchorRefMap, 'QUALIFY_CONDITION', existingCondition.id);
      }

      const conditionIdMap = new Map<string, string>();

      if (parsedQualifyConditions) {
        const rewardStatusForQualifyConditionMutation =
          resolveRewardStatusForQualifyConditionMutation(
            existing.status,
            data.status,
          );

        for (const condition of parsedQualifyConditions) {
          const identityKey = getConditionIdentityKey(condition);
          const resolvedId = condition.id ?? createId();
          conditionIdMap.set(identityKey, resolvedId);
          registerAnchorRef(
            anchorRefMap,
            'QUALIFY_CONDITION',
            resolvedId,
            condition.clientId
          );
        }

        for (const condition of parsedQualifyConditions) {
          const identityKey = getConditionIdentityKey(condition);
          const resolvedId = conditionIdMap.get(identityKey);

          if (!resolvedId) {
            throw new Error(`[Integrity Error] Missing resolved id for condition ${identityKey}`);
          }

          const resolvedTimeframe = resolveTimeframeAnchors(
            condition.timeframe,
            anchorRefMap
          );
          const conditionDates = mapQualifyConditionStatusDates(
            condition.status,
            condition.statusDate
          );

          if (condition.id) {
            const existingPoolCondition = await this.repository.findQualifyConditionSummary(
              condition.id,
              tx
            );

            if (!existingPoolCondition) {
              throw new AppError('Qualify condition not found', 404);
            }

            if (existingPoolCondition.promotionId !== existing.promotionId) {
              throw new AppError(
                'Qualify condition does not belong to reward promotion',
                400
              );
            }
            const conditionLifecyclePolicy = getQualifyConditionLifecyclePolicy({
              isPersisted: true,
              conditionType: condition.type,
              conditionStatus: condition.status ?? existingPoolCondition.status,
              parents: buildQualifyConditionParentContextsForRewardUpdate(
                existing,
                rewardStatusForQualifyConditionMutation,
                existingPoolCondition,
              ),
            });
            const qualifyConditionStatusDisabledReasons = getDisabledStatusReasons(
              conditionLifecyclePolicy.statusOptions,
              condition.status,
            );

            if (qualifyConditionStatusDisabledReasons.length > 0) {
              throw new BadRequestError(
                formatLifecycleReasons(qualifyConditionStatusDisabledReasons),
              );
            }

            if (
              !conditionLifecyclePolicy.canEditStructure &&
              hasQualifyConditionDefinitionChanges(
                condition,
                toQualifyConditionEntity(existingPoolCondition),
              )
            ) {
              throw new BadRequestError(
                formatLifecycleReasons(conditionLifecyclePolicy.structureReasons),
              );
            }

            await this.repository.updateQualifyCondition(
              condition.id,
              {
                type: condition.type,
                description: condition.description,
                status: condition.status,
                timeframe: toInputJson(resolvedTimeframe),
                conditions: extractQualifyConditions(condition),
                ...conditionDates,
              },
              tx
            );
          } else {
            const newConditionLifecyclePolicy = getQualifyConditionLifecyclePolicy({
              isPersisted: false,
              conditionType: condition.type,
              conditionStatus: condition.status,
              parents: [
                {
                  rewardStatus: rewardStatusForQualifyConditionMutation,
                  phaseStatus: existing.phase.status,
                  promotionStatus: existing.phase.promotion.status,
                },
              ],
            });
            const newConditionStatusDisabledReasons = getDisabledStatusReasons(
              newConditionLifecyclePolicy.statusOptions,
              condition.status,
            );

            if (newConditionStatusDisabledReasons.length > 0) {
              throw new BadRequestError(
                formatLifecycleReasons(newConditionStatusDisabledReasons),
              );
            }

            await this.repository.createQualifyCondition(
              {
                id: resolvedId,
                type: condition.type,
                description: condition.description,
                status: condition.status || 'PENDING',
                timeframe: toInputJson(resolvedTimeframe),
                conditions: extractQualifyConditions(condition),
                promotion: { connect: { id: existing.promotionId } },
                ...conditionDates,
              },
              tx
            );
          }
        }
      }

      const rewardUpdateInput = toRewardUpdateInput(data);

      if (data.status !== undefined || data.statusDate !== undefined) {
        const statusDates = mapRewardStatusDates(data.status, data.statusDate);
        Object.assign(rewardUpdateInput, statusDates);
      }

      if (
        data.usageConditions !== undefined &&
        data.usageConditions !== null
      ) {
        const resolvedUsageConditions = resolveUsageConditionsAnchors(
          data.usageConditions,
          anchorRefMap
        );

        rewardUpdateInput.usageConditions = toInputJson(resolvedUsageConditions);
      }

      if (parsedQualifyConditions) {
        const relationIds = parsedQualifyConditions.map((condition) => {
          const identityKey = getConditionIdentityKey(condition);
          const resolvedId = conditionIdMap.get(identityKey);

          if (!resolvedId) {
            throw new Error(`[Integrity Error] Missing relation id for condition ${identityKey}`);
          }

          return { id: resolvedId };
        });

        rewardUpdateInput.qualifyConditions = {
          set: relationIds,
        };
      }

      let updated = await this.repository.update(id, rewardUpdateInput, tx);

      if (
        shouldCreateUsageTrackingForStatus(data.status) &&
        !updated.usageTracking
      ) {
        const updatedEntity = toRewardEntity(updated);
        await this.repository.createUsageTracking(
          {
            rewardId: updated.id,
            type: updated.type,
            balance: 0,
            usageData: toInputJson(buildInitialUsageTrackingData(updatedEntity)),
          },
          tx,
        );

        const refreshed = await this.repository.findById(id, tx);
        if (!refreshed) {
          throw new AppError('Reward not found after update', 404);
        }
        updated = refreshed;
      }

      // Pool rule: a qualify condition must always belong to at least one reward.
      // After syncing reward relations, delete orphan conditions in the same promotion.
      const orphanIds = await this.repository.findOrphanQualifyConditionIds(
        existing.promotionId,
        tx
      );
      await this.repository.deleteOrphanQualifyConditions(
        existing.promotionId,
        orphanIds,
        tx
      );

      return toRewardEntity(updated);
    });
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new AppError('Reward not found', 404);
    }
    if (existing.qualifyConditions.length > 0) {
      throw new BadRequestError(
        'Cannot delete reward with qualify conditions. Remove child qualify conditions first.'
      );
    }
    await this.repository.delete(id);
  }
}

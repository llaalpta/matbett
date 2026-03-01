import { createId } from '@paralleldrive/cuid2';
import type { IQualifyConditionService } from '@matbett/api';
import {
  QualifyConditionSchema,
  getQualifyConditionLifecyclePolicy,
  resolveTimeframeWindow,
  type AnchorRefType,
  type QualifyCondition,
  type QualifyConditionEntity,
  type QualifyConditionListInput,
  type PaginatedResponse,
  type Timeframe,
} from '@matbett/shared';
import type { Prisma } from '@prisma/client';

import { extractQualifyConditions } from '@/lib/transformers/qualify-condition.transformer';
import { toQualifyConditionEntity } from '@/lib/transformers/reward.transformer';
import { QualifyConditionRepository } from '@/repositories/qualify-condition.repository';
import { toInputJson } from '@/utils/prisma-json';
import { AppError, BadRequestError } from '@/utils/errors';
import { prisma } from '@/lib/prisma';
import { PromotionRepository } from '@/repositories/promotion.repository';
import { toPromotionEntity } from '@/lib/transformers/promotion.transformer';
import { RewardRepository } from '@/repositories/reward.repository';

const persistedRefType: AnchorRefType = 'persisted';

type AnchorEntityType = 'PROMOTION' | 'PHASE' | 'REWARD' | 'QUALIFY_CONDITION';

const getAnchorRefKey = (
  entityType: AnchorEntityType,
  refType: AnchorRefType,
  ref: string,
): string => `${entityType}:${refType}:${ref}`;

const registerAnchorRef = (
  refMap: Map<string, string>,
  entityType: AnchorEntityType,
  persistedId: string,
  clientId?: string,
): void => {
  refMap.set(getAnchorRefKey(entityType, 'persisted', persistedId), persistedId);
  if (clientId) {
    refMap.set(getAnchorRefKey(entityType, 'client', clientId), persistedId);
  }
};

const resolveTimeframeAnchors = (
  timeframe: Timeframe,
  refMap: Map<string, string>,
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
      `Invalid relative timeframe anchor: ${entityType}:${entityRefType}:${entityRef}`,
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

function mapStatusDate(status: QualifyCondition['status'] | undefined, statusDate: Date | undefined) {
  const dates: {
    startedAt?: Date | null;
    qualifiedAt?: Date | null;
    failedAt?: Date | null;
    expiredAt?: Date | null;
  } = {};

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
}

const normalizeQualifyConditionDefinition = (
  condition: QualifyCondition | QualifyConditionEntity,
) => ({
  identity: 'id' in condition && condition.id ? `id:${condition.id}` : null,
  type: condition.type,
  description: condition.description ?? null,
  timeframe: condition.timeframe,
  conditions: condition.conditions,
});

const hasQualifyConditionDefinitionChanges = (
  nextCondition: QualifyCondition,
  existingCondition: QualifyConditionEntity,
) =>
  JSON.stringify(normalizeQualifyConditionDefinition(nextCondition)) !==
  JSON.stringify(normalizeQualifyConditionDefinition(existingCondition));

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

export class QualifyConditionService implements IQualifyConditionService {
  private readonly repository: QualifyConditionRepository;
  private readonly promotionRepository: PromotionRepository;
  private readonly rewardRepository: RewardRepository;

  constructor() {
    this.repository = new QualifyConditionRepository();
    this.promotionRepository = new PromotionRepository();
    this.rewardRepository = new RewardRepository();
  }

  async list(
    userId: string,
    input: QualifyConditionListInput
  ): Promise<PaginatedResponse<QualifyConditionEntity>> {
    const { pageIndex, pageSize, status, type, promotionId, sorting, globalFilter } = input;

    const where: Prisma.RewardQualifyConditionWhereInput = {};

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
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          promotion: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          rewards: {
            some: {
              type: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    const sortId = sorting?.[0]?.id;
    const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';
    const requiresCustomTemporalSort =
      sortId === 'timeframeStart' || sortId === 'timeframeEnd';

    let orderBy: Prisma.RewardQualifyConditionOrderByWithRelationInput = {
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
        id === 'description'
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
        tx
      );
      const totalPromise = this.repository.countForUser(userId, where, tx);

      const rowsResult = await rowsPromise;
      const promotionIds = [...new Set(rowsResult.map((row) => row.promotionId))];
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
      const entity = toQualifyConditionEntity(row);
      const promotion = promotionById.get(entity.promotionId);
      const timeframeWindow = resolveTimeframeWindow(entity.timeframe, promotion);

      return {
        ...entity,
        timeframeStart: timeframeWindow.start,
        timeframeEnd: timeframeWindow.end,
      };
    });

    if (requiresCustomTemporalSort) {
      data = [...data].sort((left, right) =>
        compareNullableDates(
          sortId === 'timeframeStart' ? left.timeframeStart : left.timeframeEnd,
          sortId === 'timeframeStart' ? right.timeframeStart : right.timeframeEnd,
          sortDirection,
        ),
      );
    }

    const pagedData = requiresCustomTemporalSort
      ? data.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize)
      : data;

    return {
      data: pagedData,
      meta: {
        pageCount: Math.ceil(total / pageSize),
        rowCount: total,
        pageIndex,
        pageSize,
      },
    };
  }

  async getById(id: string, userId: string): Promise<QualifyConditionEntity | null> {
    const condition = await this.repository.findByIdForUser(id, userId);
    if (!condition) {
      return null;
    }
    return toQualifyConditionEntity(condition);
  }

  async createForReward(
    userId: string,
    rewardId: string,
    data: QualifyCondition,
  ): Promise<QualifyConditionEntity> {
    return prisma.$transaction(async (tx) => {
      const reward = await this.rewardRepository.findByIdForUser(
        userId,
        rewardId,
        tx,
      );

      if (!reward) {
        throw new AppError('Reward not found', 404);
      }

      const validated = QualifyConditionSchema.parse(data);
      const conditionStatus = validated.status ?? 'PENDING';

      if (conditionStatus !== 'PENDING' && conditionStatus !== 'QUALIFYING') {
        throw new BadRequestError(
          'A contextually created qualify condition must start in PENDING or QUALIFYING status.',
        );
      }

      const lifecyclePolicy = getQualifyConditionLifecyclePolicy({
        isPersisted: true,
        conditionType: validated.type,
        conditionStatus,
        parents: [
          {
            rewardStatus: reward.status,
            phaseStatus: reward.phase.status,
            promotionStatus: reward.phase.promotion.status,
          },
        ],
      });

      if (!lifecyclePolicy.canEditStructure) {
        throw new BadRequestError(
          formatLifecycleReasons(lifecyclePolicy.structureReasons),
        );
      }

      const statusDisabledReasons = getDisabledStatusReasons(
        lifecyclePolicy.statusOptions,
        conditionStatus,
      );

      if (statusDisabledReasons.length > 0) {
        throw new BadRequestError(formatLifecycleReasons(statusDisabledReasons));
      }

      const conditionId = validated.id ?? createId();
      const anchorRefMap = new Map<string, string>();
      registerAnchorRef(anchorRefMap, 'PROMOTION', reward.promotionId);
      registerAnchorRef(anchorRefMap, 'PHASE', reward.phaseId);
      registerAnchorRef(anchorRefMap, 'REWARD', reward.id);
      registerAnchorRef(
        anchorRefMap,
        'QUALIFY_CONDITION',
        conditionId,
        validated.clientId,
      );

      const created = await this.repository.create(
        {
          id: conditionId,
          type: validated.type,
          description: validated.description ?? null,
          status: conditionStatus,
          timeframe: toInputJson(
            resolveTimeframeAnchors(validated.timeframe, anchorRefMap),
          ),
          conditions: extractQualifyConditions(validated),
          promotion: {
            connect: {
              id: reward.promotionId,
            },
          },
          rewards: {
            connect: {
              id: reward.id,
            },
          },
          ...mapStatusDate(conditionStatus, validated.statusDate),
        },
        tx,
      );

      return toQualifyConditionEntity(created);
    });
  }

  async update(id: string, data: QualifyCondition, userId: string): Promise<QualifyConditionEntity> {
    const existing = await this.repository.findByIdForUser(id, userId);
    if (!existing) {
      throw new AppError('Qualify condition not found', 404);
    }

    const validated = QualifyConditionSchema.parse(data);
    const lifecyclePolicy = getQualifyConditionLifecyclePolicy({
      isPersisted: true,
      conditionType: validated.type,
      conditionStatus: validated.status,
      parents: existing.rewards.map((reward) => ({
        rewardStatus: reward.status,
        phaseStatus: reward.phase.status,
        promotionStatus: reward.phase.promotion.status,
      })),
    });
    const statusDisabledReasons = getDisabledStatusReasons(
      lifecyclePolicy.statusOptions,
      validated.status,
    );

    if (statusDisabledReasons.length > 0) {
      throw new BadRequestError(formatLifecycleReasons(statusDisabledReasons));
    }

    if (
      !lifecyclePolicy.canEditStructure &&
      hasQualifyConditionDefinitionChanges(
        validated,
        toQualifyConditionEntity(existing),
      )
    ) {
      throw new BadRequestError(
        formatLifecycleReasons(lifecyclePolicy.structureReasons),
      );
    }

    const statusDates = mapStatusDate(validated.status, validated.statusDate);

    const updateInput: Prisma.RewardQualifyConditionUpdateInput = {
      type: validated.type,
      description: validated.description ?? null,
      status: validated.status,
      timeframe: toInputJson(validated.timeframe),
      conditions: extractQualifyConditions(validated),
      ...statusDates,
    };

    const updated = await this.repository.update(id, updateInput);
    return toQualifyConditionEntity(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.repository.findByIdForUser(id, userId);
    if (!existing) {
      throw new AppError('Qualify condition not found', 404);
    }

    const hasDirectChildren =
      existing._count.rewards > 0 ||
      existing._count.depositParticipations > 0 ||
      existing._count.betParticipations > 0;

    if (hasDirectChildren) {
      throw new BadRequestError(
        'Cannot delete qualify condition with child entities. Remove children first.'
      );
    }

    await this.repository.delete(id);
  }
}

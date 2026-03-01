import { createId } from '@paralleldrive/cuid2';
import {
  QualifyConditionSchema,
  type AnchorRefType,
  type QualifyCondition,
  type Reward,
  type RewardEntity,
  type Timeframe,
  type UsageConditions,
} from '@matbett/shared';
import type { IRewardService } from '@matbett/api';
import { AppError, BadRequestError } from '@/utils/errors';
import { prisma } from '@/lib/prisma';
import { extractQualifyConditions } from '@/lib/transformers/qualify-condition.transformer';
import { toInputJson } from '@/utils/prisma-json';
import { RewardRepository } from '@/repositories/reward.repository';
import { toRewardUpdateInput, toRewardEntity } from '@/lib/transformers/reward.transformer';

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

export class RewardService implements IRewardService {
  private repository: RewardRepository;

  constructor() {
    this.repository = new RewardRepository();
  }

  async getById(id: string): Promise<RewardEntity | null> {
    const reward = await this.repository.findById(id);
    if (!reward) {return null;}
    return toRewardEntity(reward);
  }

  async update(id: string, data: Reward): Promise<RewardEntity> {
    return prisma.$transaction(async (tx) => {
      const existing = await this.repository.findById(id, tx);
      if (!existing) {
        throw new AppError('Reward not found', 404);
      }

      const anchorRefMap = new Map<string, string>();
      registerAnchorRef(anchorRefMap, 'PROMOTION', existing.promotionId);
      registerAnchorRef(anchorRefMap, 'PHASE', existing.phaseId);
      registerAnchorRef(anchorRefMap, 'REWARD', existing.id);

      for (const existingCondition of existing.qualifyConditions) {
        registerAnchorRef(anchorRefMap, 'QUALIFY_CONDITION', existingCondition.id);
      }

      const parsedQualifyConditions = data.qualifyConditions?.map((condition) =>
        QualifyConditionSchema.parse(condition)
      );

      const conditionIdMap = new Map<string, string>();

      if (parsedQualifyConditions) {
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
            const existingPoolCondition = await tx.rewardQualifyCondition.findUnique({
              where: { id: condition.id },
              select: { id: true, promotionId: true },
            });

            if (!existingPoolCondition) {
              throw new AppError('Qualify condition not found', 404);
            }

            if (existingPoolCondition.promotionId !== existing.promotionId) {
              throw new AppError(
                'Qualify condition does not belong to reward promotion',
                400
              );
            }

            await tx.rewardQualifyCondition.update({
              where: { id: condition.id },
              data: {
                type: condition.type,
                description: condition.description,
                status: condition.status,
                timeframe: toInputJson(resolvedTimeframe),
                conditions: extractQualifyConditions(condition),
                ...conditionDates,
              },
            });
          } else {
            await tx.rewardQualifyCondition.create({
              data: {
                id: resolvedId,
                type: condition.type,
                description: condition.description,
                status: condition.status || 'PENDING',
                timeframe: toInputJson(resolvedTimeframe),
                conditions: extractQualifyConditions(condition),
                promotion: { connect: { id: existing.promotionId } },
                ...conditionDates,
              },
            });
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

      const updated = await this.repository.update(id, rewardUpdateInput, tx);

      // Pool rule: a qualify condition must always belong to at least one reward.
      // After syncing reward relations, delete orphan conditions in the same promotion.
      const orphanConditions = await tx.rewardQualifyCondition.findMany({
        where: {
          promotionId: existing.promotionId,
          rewards: { none: {} },
        },
        select: { id: true },
      });

      if (orphanConditions.length > 0) {
        const orphanIds = orphanConditions.map((condition) => condition.id);

        await tx.rewardQualifyCondition.deleteMany({
          where: {
            promotionId: existing.promotionId,
            id: { in: orphanIds },
            rewards: { none: {} },
          },
        });
      }

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

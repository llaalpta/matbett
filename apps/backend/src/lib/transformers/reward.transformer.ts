import { Prisma } from '@prisma/client';
import type {
  Reward,
  RewardEntity,
  QualifyConditionEntity,
} from '@matbett/shared';
import {
  RewardStatusSchema,
  RewardTypeSchema,
  RewardValueTypeSchema,
  ActivationMethodSchema,
  ClaimMethodSchema,
  QualifyConditionStatusSchema,
  PromotionStatusSchema,
  PhaseStatusSchema,
  TimeframeSchema,
  DepositConditionsSchema,
  BetConditionsSpecificSchema,
  LossesCashbackConditionsSchema,
  DepositQualifyTrackingSchema,
  BetQualifyTrackingSchema,
  LossesCashbackQualifyTrackingSchema,
  FreeBetUsageTrackingSchema,
  BonusRolloverUsageTrackingSchema,
  BonusNoRolloverUsageTrackingSchema,
  CashbackUsageTrackingSchema,
  EnhancedOddsUsageTrackingSchema,
  CasinoSpinsUsageTrackingSchema,
} from '@matbett/shared';
import {
  Reward as PrismaReward,
  RewardQualifyCondition as PrismaRewardQualifyCondition,
  RewardUsageTracking as PrismaRewardUsageTracking,
} from '@prisma/client';
import { toInputJson } from '@/utils/prisma-json';
import {
  parseTypeSpecificFieldsByRewardType,
  parseUsageConditionsByRewardType,
} from './reward-shared.transformer';

type PrismaQualifyConditionWithCounts = PrismaRewardQualifyCondition & {
  _count?: {
    rewards: number;
    depositParticipations: number;
    betParticipations: number;
  };
  rewards?: Array<{
    id: string;
    type: PrismaReward['type'];
    status: PrismaReward['status'];
    phase: {
      id: string;
      name: string | null;
      status: string;
      promotion: {
        status: string;
        phases?: Array<{
          id: string;
        }>;
      };
    };
  }>;
  promotion?: {
    name: string;
  };
};

function getRewardStatusDate(status: string, dates: {
  qualifyConditionsFulfilledAt?: Date | null;
  claimedAt?: Date | null;
  receivedAt?: Date | null;
  useStartedAt?: Date | null;
  useCompletedAt?: Date | null;
  expiredAt?: Date | null;
  createdAt: Date;
}): Date {
  switch (status) {
    case "PENDING_TO_CLAIM":
      return dates.qualifyConditionsFulfilledAt ?? dates.createdAt;
    case "CLAIMED":
      return dates.claimedAt ?? dates.createdAt;
    case "RECEIVED":
      return dates.receivedAt ?? dates.createdAt;
    case "IN_USE":
      return dates.useStartedAt ?? dates.createdAt;
    case "USED":
      return dates.useCompletedAt ?? dates.createdAt;
    case "EXPIRED":
      return dates.expiredAt ?? dates.createdAt;
    default:
      return dates.createdAt;
  }
}

function getQualifyConditionStatusDate(status: string, dates: {
  startedAt?: Date | null;
  qualifiedAt?: Date | null;
  failedAt?: Date | null;
  expiredAt?: Date | null;
  createdAt: Date;
}): Date {
  switch (status) {
    case "QUALIFYING":
      return dates.startedAt ?? dates.createdAt;
    case "FULFILLED":
      return dates.qualifiedAt ?? dates.createdAt;
    case "FAILED":
      return dates.failedAt ?? dates.createdAt;
    case "EXPIRED":
      return dates.expiredAt ?? dates.createdAt;
    default:
      return dates.createdAt;
  }
}

function buildTrackingSummary(condition: {
  type: string;
  trackingData: Prisma.JsonValue | null;
  trackingCounts?: {
    betParticipations?: number;
    depositParticipations?: number;
  };
  conditions: Prisma.JsonValue;
}): {
  current?: number;
  target?: number;
  label?: string;
} | undefined {
  const totalParticipations =
    (condition.trackingCounts?.betParticipations ?? 0) +
    (condition.trackingCounts?.depositParticipations ?? 0);

  if (condition.type === 'DEPOSIT') {
    return {
      current: totalParticipations,
      target: 1,
      label: totalParticipations === 1 ? '1/1 depósito' : `${totalParticipations}/1 depósito`,
    };
  }

  if (condition.type === 'BET') {
    const tracking = condition.trackingData
      ? BetQualifyTrackingSchema.safeParse(condition.trackingData)
      : null;
    const parsedConditions = BetConditionsSpecificSchema.safeParse(condition.conditions);
    const target = parsedConditions.success && parsedConditions.data.allowRetries
      ? parsedConditions.data.maxAttempts ?? undefined
      : totalParticipations > 0
        ? totalParticipations
        : 1;

    return {
      current: tracking?.success ? tracking.data.currentAttempts : totalParticipations,
      target,
      label:
        target !== undefined
          ? `${tracking?.success ? tracking.data.currentAttempts : totalParticipations}/${target} intentos`
          : `${totalParticipations} apuestas`,
    };
  }

  if (condition.type === 'LOSSES_CASHBACK') {
    return {
      current: totalParticipations,
      label:
        totalParticipations === 1 ? '1 apuesta' : `${totalParticipations} apuestas`,
    };
  }

  return undefined;
}

// Helper para extraer condiciones de uso especificas
function extractUsageConditions(
  usageConditions: Reward['usageConditions'] | null | undefined
): Prisma.InputJsonValue | Prisma.NullTypes.DbNull {
  if (!usageConditions) {return Prisma.DbNull;}

  switch (usageConditions.type) {
    case 'FREEBET': return toInputJson(usageConditions);
    case 'BET_BONUS_ROLLOVER': return toInputJson(usageConditions);
    case 'BET_BONUS_NO_ROLLOVER': return toInputJson(usageConditions);
    case 'CASHBACK_FREEBET': return toInputJson(usageConditions);
    case 'ENHANCED_ODDS': return toInputJson(usageConditions);
    case 'CASINO_SPINS': return toInputJson(usageConditions);
    default:
      throw new Error('[Transformer Error] Usage Condition Type not handled');
  }
}

// Helper para reconstruir entidad de condicion de calificacion
export function toQualifyConditionEntity(prismaCondition: PrismaQualifyConditionWithCounts): QualifyConditionEntity {
  const timeframe = TimeframeSchema.parse(prismaCondition.timeframe);
  const hasRewards = (prismaCondition._count?.rewards ?? 0) > 0;
  const hasDeposits = (prismaCondition._count?.depositParticipations ?? 0) > 0;
  const hasBets = (prismaCondition._count?.betParticipations ?? 0) > 0;
  const canDelete = !(hasRewards || hasDeposits || hasBets);

  const linkedRewards = (prismaCondition.rewards ?? []).map((reward) => {
    const phaseIndex = reward.phase.promotion.phases?.findIndex(
      (phase) => phase.id === reward.phase.id,
    );

    return {
      id: reward.id,
      type: RewardTypeSchema.parse(reward.type),
      status: RewardStatusSchema.parse(reward.status),
      phaseId: reward.phase.id,
      phaseIndex: phaseIndex !== undefined && phaseIndex >= 0 ? phaseIndex : undefined,
      phaseName: reward.phase.name ?? undefined,
      phaseStatus: PhaseStatusSchema.parse(reward.phase.status),
      promotionStatus: PromotionStatusSchema.parse(reward.phase.promotion.status),
    };
  });
  const trackingSummary = buildTrackingSummary({
    type: prismaCondition.type,
    trackingData: prismaCondition.trackingData,
    trackingCounts: prismaCondition._count,
    conditions: prismaCondition.conditions,
  });

  const baseFields = {
    id: prismaCondition.id,
    type: prismaCondition.type,
    description: prismaCondition.description ?? undefined,
    status: QualifyConditionStatusSchema.parse(prismaCondition.status),
    statusDate: getQualifyConditionStatusDate(prismaCondition.status, {
      startedAt: prismaCondition.startedAt,
      qualifiedAt: prismaCondition.qualifiedAt,
      failedAt: prismaCondition.failedAt,
      expiredAt: prismaCondition.expiredAt,
      createdAt: prismaCondition.createdAt,
    }),
    canDelete,
    timeframe: timeframe,
    balance: prismaCondition.balance,
    promotionId: prismaCondition.promotionId,
    promotionName: prismaCondition.promotion?.name,
    linkedRewards,
    trackingSummary,
    trackingStats: {
      totalParticipations:
        (prismaCondition._count?.depositParticipations ?? 0) +
        (prismaCondition._count?.betParticipations ?? 0),
      betParticipations: prismaCondition._count?.betParticipations ?? 0,
      depositParticipations: prismaCondition._count?.depositParticipations ?? 0,
    },
    startedAt: prismaCondition.startedAt ?? null,
    qualifiedAt: prismaCondition.qualifiedAt ?? null,
    failedAt: prismaCondition.failedAt ?? null,
    expiredAt: prismaCondition.expiredAt ?? null,
    createdAt: prismaCondition.createdAt,
    updatedAt: prismaCondition.updatedAt,
  };

  switch (prismaCondition.type) {
    case 'DEPOSIT': {
      const conditions = DepositConditionsSchema.parse(prismaCondition.conditions);
      return {
        ...baseFields,
        type: 'DEPOSIT',
        conditions,
        tracking: prismaCondition.trackingData
          ? DepositQualifyTrackingSchema.parse(prismaCondition.trackingData)
          : null,
      };
    }
    case 'BET': {
      const conditions = BetConditionsSpecificSchema.parse(prismaCondition.conditions);
      return {
        ...baseFields,
        type: 'BET',
        conditions,
        tracking: prismaCondition.trackingData
          ? BetQualifyTrackingSchema.parse(prismaCondition.trackingData)
          : null,
      };
    }
    case 'LOSSES_CASHBACK': {
      const conditions = LossesCashbackConditionsSchema.parse(prismaCondition.conditions);
      return {
        ...baseFields,
        type: 'LOSSES_CASHBACK',
        conditions,
        tracking: prismaCondition.trackingData
          ? LossesCashbackQualifyTrackingSchema.parse(prismaCondition.trackingData)
          : null,
      };
    }
    default:
      throw new Error(`Tipo de QualifyCondition no soportado: ${prismaCondition.type}`);
  }
}

// Helper para reconstruir entidad de recompensa
export function toRewardEntity(
  prismaReward: PrismaReward & {
    qualifyConditions: PrismaQualifyConditionWithCounts[];
    usageTracking?: PrismaRewardUsageTracking | null;
    phase?: {
      id: string;
      name: string | null;
      promotionId: string;
      promotion: {
        name: string;
      };
    }; // Opcional: solo viene en consultas standalone
  }
): RewardEntity {
  const status = RewardStatusSchema.parse(prismaReward.status);
  const qualifyConditions = prismaReward.qualifyConditions.map(toQualifyConditionEntity);

  const baseFields = {
    id: prismaReward.id,
    type: prismaReward.type,
    value: prismaReward.value,
    valueType: RewardValueTypeSchema.parse(prismaReward.valueType),
    activationMethod: ActivationMethodSchema.parse(prismaReward.activationMethod),
    claimMethod: ClaimMethodSchema.parse(prismaReward.claimMethod),
    activationRestrictions: prismaReward.activationRestrictions ?? undefined,
    claimRestrictions: prismaReward.claimRestrictions ?? undefined,
    withdrawalRestrictions: prismaReward.withdrawalRestrictions ?? undefined,
    status,
    statusDate: getRewardStatusDate(status, {
      qualifyConditionsFulfilledAt: prismaReward.qualifyConditionsFulfilledAt,
      claimedAt: prismaReward.claimedAt,
      receivedAt: prismaReward.receivedAt,
      useStartedAt: prismaReward.useStartedAt,
      useCompletedAt: prismaReward.useCompletedAt,
      expiredAt: prismaReward.expiredAt,
      createdAt: prismaReward.createdAt,
    }),
    canDelete: qualifyConditions.length === 0,
    qualifyConditions,
    totalBalance: prismaReward.totalBalance,
    phaseId: prismaReward.phaseId,
    promotionId: prismaReward.promotionId,
    promotionName: prismaReward.phase?.promotion.name,
    phaseName: prismaReward.phase?.name ?? undefined,
    usageTrackingId: prismaReward.usageTracking?.id ?? undefined,
    qualifyConditionsFulfilledAt: prismaReward.qualifyConditionsFulfilledAt ?? null,
    claimedAt: prismaReward.claimedAt ?? null,
    receivedAt: prismaReward.receivedAt ?? null,
    useStartedAt: prismaReward.useStartedAt ?? null,
    useCompletedAt: prismaReward.useCompletedAt ?? null,
    expiredAt: prismaReward.expiredAt ?? null,
    createdAt: prismaReward.createdAt,
    updatedAt: prismaReward.updatedAt,
  };

  // Reconstruir usageConditions basado en el tipo de reward
  const usageConditionsData = prismaReward.usageConditions;

  switch (prismaReward.type) {
    case 'FREEBET': {
      const usageTracking = prismaReward.usageTracking
        ? FreeBetUsageTrackingSchema.parse(prismaReward.usageTracking.usageData)
        : null;
      return {
        ...baseFields,
        type: 'FREEBET',
        typeSpecificFields: parseTypeSpecificFieldsByRewardType(
          'FREEBET',
          prismaReward.typeSpecificFields
        ),
        usageConditions: parseUsageConditionsByRewardType('FREEBET', usageConditionsData),
        usageTracking
      };
    }
    case 'BET_BONUS_ROLLOVER': {
      const usageTracking = prismaReward.usageTracking
        ? BonusRolloverUsageTrackingSchema.parse(
            prismaReward.usageTracking.usageData,
          )
        : null;
      return {
        ...baseFields,
        type: 'BET_BONUS_ROLLOVER',
        typeSpecificFields: parseTypeSpecificFieldsByRewardType(
          'BET_BONUS_ROLLOVER',
          prismaReward.typeSpecificFields
        ),
        usageConditions: parseUsageConditionsByRewardType('BET_BONUS_ROLLOVER', usageConditionsData),
        usageTracking
      };
    }
    case 'BET_BONUS_NO_ROLLOVER': {
      const usageTracking = prismaReward.usageTracking
        ? BonusNoRolloverUsageTrackingSchema.parse(
            prismaReward.usageTracking.usageData,
          )
        : null;
      return {
        ...baseFields,
        type: 'BET_BONUS_NO_ROLLOVER',
        typeSpecificFields: parseTypeSpecificFieldsByRewardType(
          'BET_BONUS_NO_ROLLOVER',
          prismaReward.typeSpecificFields
        ),
        usageConditions: parseUsageConditionsByRewardType('BET_BONUS_NO_ROLLOVER', usageConditionsData),
        usageTracking
      };
    }
    case 'CASHBACK_FREEBET': {
      const usageTracking = prismaReward.usageTracking
        ? CashbackUsageTrackingSchema.parse(
            prismaReward.usageTracking.usageData,
          )
        : null;
      return {
        ...baseFields,
        type: 'CASHBACK_FREEBET',
        typeSpecificFields: parseTypeSpecificFieldsByRewardType(
          'CASHBACK_FREEBET',
          prismaReward.typeSpecificFields
        ),
        usageConditions: parseUsageConditionsByRewardType('CASHBACK_FREEBET', usageConditionsData),
        usageTracking
      };
    }
    case 'ENHANCED_ODDS': {
      const usageTracking = prismaReward.usageTracking
        ? EnhancedOddsUsageTrackingSchema.parse(
            prismaReward.usageTracking.usageData,
          )
        : null;
      return {
        ...baseFields,
        type: 'ENHANCED_ODDS',
        typeSpecificFields: parseTypeSpecificFieldsByRewardType(
          'ENHANCED_ODDS',
          prismaReward.typeSpecificFields
        ),
        usageConditions: parseUsageConditionsByRewardType('ENHANCED_ODDS', usageConditionsData),
        usageTracking
      };
    }
    case 'CASINO_SPINS': {
      const usageTracking = prismaReward.usageTracking
        ? CasinoSpinsUsageTrackingSchema.parse(
            prismaReward.usageTracking.usageData,
          )
        : null;
      return {
        ...baseFields,
        type: 'CASINO_SPINS',
        typeSpecificFields: parseTypeSpecificFieldsByRewardType(
          'CASINO_SPINS',
          prismaReward.typeSpecificFields
        ),
        usageConditions: parseUsageConditionsByRewardType('CASINO_SPINS', usageConditionsData),
        usageTracking
      };
    }
    default:
      throw new Error(`Tipo de Reward no soportado: ${prismaReward.type}`);
  }
}

export function toRewardUpdateInput(reward: Partial<Reward>): Prisma.RewardUpdateInput {
  const updateInput: Prisma.RewardUpdateInput = {};

  if (reward.type !== undefined) {updateInput.type = reward.type;}
  if (reward.value !== undefined) {updateInput.value = reward.value;}
  if (reward.valueType !== undefined) {updateInput.valueType = reward.valueType;}
  if (reward.activationMethod !== undefined) {updateInput.activationMethod = reward.activationMethod;}
  if (reward.claimMethod !== undefined) {updateInput.claimMethod = reward.claimMethod;}
  if (reward.activationRestrictions !== undefined) {updateInput.activationRestrictions = reward.activationRestrictions;}
  if (reward.claimRestrictions !== undefined) {updateInput.claimRestrictions = reward.claimRestrictions;}
  if (reward.withdrawalRestrictions !== undefined) {updateInput.withdrawalRestrictions = reward.withdrawalRestrictions;}
  if (reward.status !== undefined) {updateInput.status = reward.status;}

  // typeSpecificFields
  if ('typeSpecificFields' in reward) {
    if (reward.typeSpecificFields === null || reward.typeSpecificFields === undefined) {
      updateInput.typeSpecificFields = Prisma.DbNull;
    } else {
      updateInput.typeSpecificFields = toInputJson(reward.typeSpecificFields);
    }
  }

  // usageConditions
  if (reward.usageConditions !== undefined) {
    if (reward.usageConditions === null) {
      updateInput.usageConditions = Prisma.DbNull;
    } else {
      updateInput.usageConditions = extractUsageConditions(reward.usageConditions);
    }
  }

  // Nested qualifyConditions updates are handled in service layer.

  return updateInput;
}

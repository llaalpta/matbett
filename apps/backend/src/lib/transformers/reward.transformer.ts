import { Prisma } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';
import stringify from 'fast-json-stable-stringify';
import type {
  Reward,
  RewardEntity,
  QualifyConditionEntity,
} from '@matbett/shared';
import {
  RewardStatusSchema,
  TimeframeSchema,
  DepositConditionsSchema,
  BetConditionsSpecificSchema,
  LossesCashbackConditionsSchema,
  FreeBetUsageConditionsSchema,
  BonusRolloverUsageConditionsSchema,
  BonusNoRolloverUsageConditionsSchema,
  CashbackUsageConditionsSchema,
  EnhancedOddsUsageConditionsSchema,
  CasinoSpinsUsageConditionsSchema,
  FreeBetTypeSpecificFieldsSchema,
} from '@matbett/shared';
import {
  Reward as PrismaReward,
  RewardQualifyCondition as PrismaRewardQualifyCondition,
  RewardUsageTracking as PrismaRewardUsageTracking,
} from '@prisma/client';

// Helper para tipos JSON
function toJson(data: object): Prisma.InputJsonValue {
  return data as Prisma.InputJsonValue;
}

// Importar la función compartida desde qualify-condition.transformer
import { extractQualifyConditions } from './qualify-condition.transformer';

// Helper para extraer campos específicos por tipo
function extractTypeSpecificFields(reward: Reward): Prisma.InputJsonValue | Prisma.NullTypes.DbNull {
  if (reward.type === 'FREEBET' && 'typeSpecificFields' in reward && reward.typeSpecificFields) {
    return toJson(reward.typeSpecificFields);
  }
  return Prisma.DbNull;
}

// Helper para extraer condiciones de uso específicas
function extractUsageConditions(reward: Reward): Prisma.InputJsonValue | Prisma.NullTypes.DbNull {
  if (!reward.usageConditions) return Prisma.DbNull;

  switch (reward.usageConditions.type) {
    case 'FREEBET': return toJson(reward.usageConditions);
    case 'BET_BONUS_ROLLOVER': return toJson(reward.usageConditions);
    case 'BET_BONUS_NO_ROLLOVER': return toJson(reward.usageConditions);
    case 'CASHBACK_FREEBET': return toJson(reward.usageConditions);
    case 'ENHANCED_ODDS': return toJson(reward.usageConditions);
    case 'CASINO_SPINS': return toJson(reward.usageConditions);
    default:
      const _exhaustiveCheck: never = reward.usageConditions;
      throw new Error(`[Transformer Error] Usage Condition Type not handled: ${(_exhaustiveCheck as any).type}`);
  }
}

// Helper para reconstruir entidad de condición de calificación
export function toQualifyConditionEntity(prismaCondition: PrismaRewardQualifyCondition): QualifyConditionEntity {
  const timeframe = TimeframeSchema.parse(prismaCondition.timeframe);

  const baseFields = {
    id: prismaCondition.id,
    type: prismaCondition.type,
    description: prismaCondition.description ?? undefined,
    status: RewardStatusSchema.parse(prismaCondition.status), // Reutilizamos status de Reward
    // ❌ contributesToRewardValue eliminado - ahora solo existe dentro de conditions como discriminador
    timeframe: timeframe,
    balance: prismaCondition.balance,
    phaseId: prismaCondition.phaseId,
    dependsOnQualifyConditionId: prismaCondition.dependsOnQualifyConditionId ?? undefined,
    startedAt: prismaCondition.startedAt ?? null,
    qualifiedAt: prismaCondition.qualifiedAt ?? null,
    failedAt: prismaCondition.failedAt ?? null,
    expiredAt: prismaCondition.expiredAt ?? null,
    createdAt: prismaCondition.createdAt,
    updatedAt: prismaCondition.updatedAt,
  };

  switch (prismaCondition.type) {
    case 'DEPOSIT':
      return {
        ...baseFields,
        type: 'DEPOSIT',
        conditions: DepositConditionsSchema.parse(prismaCondition.conditions),
        tracking: null, // Tracking no está disponible en este contexto (solo en promotion transformer)
      };
    case 'BET':
      return {
        ...baseFields,
        type: 'BET',
        conditions: BetConditionsSpecificSchema.parse(prismaCondition.conditions),
        tracking: null,
      };
    case 'LOSSES_CASHBACK':
      return {
        ...baseFields,
        type: 'LOSSES_CASHBACK',
        conditions: LossesCashbackConditionsSchema.parse(prismaCondition.conditions),
        tracking: null,
      };
    default:
      throw new Error(`Tipo de QualifyCondition no soportado: ${prismaCondition.type}`);
  }
}

// Helper para reconstruir entidad de recompensa
export function toRewardEntity(
  prismaReward: PrismaReward & {
    qualifyConditions: PrismaRewardQualifyCondition[];
    usageTracking?: PrismaRewardUsageTracking | null;
    phase?: { promotionId: string }; // Opcional: solo viene en consultas standalone
  }
): RewardEntity {
  const status = RewardStatusSchema.parse(prismaReward.status);
  const qualifyConditions = prismaReward.qualifyConditions.map(toQualifyConditionEntity);

  const baseFields = {
    id: prismaReward.id,
    type: prismaReward.type,
    value: prismaReward.value,
    valueType: prismaReward.valueType,
    activationMethod: prismaReward.activationMethod,
    claimMethod: prismaReward.claimMethod,
    claimRestrictions: prismaReward.claimRestrictions ?? undefined,
    status,
    qualifyConditions,
    totalBalance: prismaReward.totalBalance,
    phaseId: prismaReward.phaseId,
    promotionId: prismaReward.phase?.promotionId, // Incluir si viene de consulta standalone
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
    case 'FREEBET':
      return {
        ...baseFields,
        type: 'FREEBET',
        typeSpecificFields: prismaReward.typeSpecificFields
          ? FreeBetTypeSpecificFieldsSchema.parse(prismaReward.typeSpecificFields)
          : { stakeNotReturned: true }, // Default si no existe
        usageConditions: FreeBetUsageConditionsSchema.parse(usageConditionsData),
        usageTracking: null
      };
    case 'BET_BONUS_ROLLOVER':
      return {
        ...baseFields,
        type: 'BET_BONUS_ROLLOVER',
        typeSpecificFields: null, // Sin campos específicos
        usageConditions: BonusRolloverUsageConditionsSchema.parse(usageConditionsData),
        usageTracking: null
      };
    case 'BET_BONUS_NO_ROLLOVER':
      return {
        ...baseFields,
        type: 'BET_BONUS_NO_ROLLOVER',
        typeSpecificFields: null, // Sin campos específicos
        usageConditions: BonusNoRolloverUsageConditionsSchema.parse(usageConditionsData),
        usageTracking: null
      };
    case 'CASHBACK_FREEBET':
      return {
        ...baseFields,
        type: 'CASHBACK_FREEBET',
        typeSpecificFields: null, // Sin campos específicos
        usageConditions: CashbackUsageConditionsSchema.parse(usageConditionsData),
        usageTracking: null
      };
    case 'ENHANCED_ODDS':
      return {
        ...baseFields,
        type: 'ENHANCED_ODDS',
        typeSpecificFields: null, // Sin campos específicos
        usageConditions: EnhancedOddsUsageConditionsSchema.parse(usageConditionsData),
        usageTracking: null
      };
    case 'CASINO_SPINS':
      return {
        ...baseFields,
        type: 'CASINO_SPINS',
        typeSpecificFields: null, // Sin campos específicos
        usageConditions: CasinoSpinsUsageConditionsSchema.parse(usageConditionsData),
        usageTracking: null
      };
    default:
      throw new Error(`Tipo de Reward no soportado: ${prismaReward.type}`);
  }
}


export function toRewardCreateInput(reward: Reward, phaseId: string): Prisma.RewardCreateInput {
  const conditionHashToIdMap = new Map<string, string>();
  const uniqueConditionsToCreate: Prisma.RewardQualifyConditionCreateWithoutRewardsInput[] = [];

  for (const qc of reward.qualifyConditions) {
    const hash = stringify(qc);
    if (!conditionHashToIdMap.has(hash)) {
      const newId = createId();
      conditionHashToIdMap.set(hash, newId);
      uniqueConditionsToCreate.push({
        id: newId,
        type: qc.type,
        description: qc.description,
        status: qc.status || 'PENDING',
        // ❌ contributesToRewardValue eliminado - ahora solo dentro de conditions como discriminador
        timeframe: toJson(qc.timeframe),
        conditions: extractQualifyConditions(qc),
        phase: { connect: { id: phaseId } }, // Qualify conditions belong to phase
      });
    }
  }

  return {
    id: createId(), // Backend genera IDs
    phase: { connect: { id: phaseId } }, // Se conecta a una fase existente
    type: reward.type,
    value: reward.value,
    valueType: reward.valueType,
    activationMethod: reward.activationMethod,
    claimMethod: reward.claimMethod,
    claimRestrictions: reward.claimRestrictions,
    status: reward.status || 'QUALIFYING',
    typeSpecificFields: extractTypeSpecificFields(reward),
    usageConditions: extractUsageConditions(reward),
    qualifyConditions: {
      create: uniqueConditionsToCreate,
    },
    // No incluye totalBalance, lo calcula el sistema
    // No incluye timestamps de estado, los setea el sistema
  };
}

export function toRewardUpdateInput(reward: Partial<Reward>): Prisma.RewardUpdateInput {
  const updateInput: Prisma.RewardUpdateInput = {};

  if (reward.type !== undefined) updateInput.type = reward.type;
  if (reward.value !== undefined) updateInput.value = reward.value;
  if (reward.valueType !== undefined) updateInput.valueType = reward.valueType;
  if (reward.activationMethod !== undefined) updateInput.activationMethod = reward.activationMethod;
  if (reward.claimMethod !== undefined) updateInput.claimMethod = reward.claimMethod;
  if (reward.claimRestrictions !== undefined) updateInput.claimRestrictions = reward.claimRestrictions;
  if (reward.status !== undefined) updateInput.status = reward.status;

  // typeSpecificFields
  if ('typeSpecificFields' in reward) {
    if (reward.typeSpecificFields === null || reward.typeSpecificFields === undefined) {
      updateInput.typeSpecificFields = Prisma.DbNull;
    } else {
      updateInput.typeSpecificFields = toJson(reward.typeSpecificFields);
    }
  }

  // usageConditions
  if (reward.usageConditions !== undefined) {
    if (reward.usageConditions === null) {
      updateInput.usageConditions = Prisma.DbNull;
    } else {
      updateInput.usageConditions = extractUsageConditions(reward as Reward); // Castear a Reward para usar en extractUsageConditions
    }
  }

  // Lógica para actualizar qualifyConditions: Crear/Actualizar/Eliminar
  // Esto es muy complejo y similar a Promotion. Es un TODO importante si se necesita edición anidada
  // Por ahora, solo actualizaremos las propiedades simples de Reward

  return updateInput;
}

import { createId } from '@paralleldrive/cuid2';
import { Prisma } from '@prisma/client';
import stringify from 'fast-json-stable-stringify';
import type {
  Reward as PrismaReward,
  Phase as PrismaPhase,
  RewardQualifyCondition as PrismaRewardQualifyCondition,
  RewardUsageTracking as PrismaRewardUsageTracking,
} from '@prisma/client';
import type {
  Promotion,
  PromotionEntity,
  PhaseEntity,
  RewardEntity,
  QualifyConditionEntity,
  QualifyCondition,
  Phase,
  AvailableTimeframes,
  AvailableTimeframesByType,
  TimeframeEventTimestamp,
  AnchorEvent,
} from '@matbett/shared';
import {
  TimeframeSchema,
  RewardStatusSchema,
  PhaseStatusSchema,
  PromotionStatusSchema,
  QualifyConditionStatusSchema,
  DepositConditionsSchema,
  BetConditionsSpecificSchema,
  LossesCashbackConditionsSchema,
  DepositQualifyTrackingSchema,
  BetQualifyTrackingSchema,
  LossesCashbackQualifyTrackingSchema,
  FreeBetUsageConditionsSchema,
  BonusRolloverUsageConditionsSchema,
  BonusNoRolloverUsageConditionsSchema,
  CashbackUsageConditionsSchema,
  EnhancedOddsUsageConditionsSchema,
  CasinoSpinsUsageConditionsSchema,
  FreeBetUsageTrackingSchema,
  BonusRolloverUsageTrackingSchema,
  BonusNoRolloverUsageTrackingSchema,
  CashbackUsageTrackingSchema,
  EnhancedOddsUsageTrackingSchema,
  CasinoSpinsUsageTrackingSchema,
  FreeBetTypeSpecificFieldsSchema,
} from '@matbett/shared';
import type { PromotionWithRelations } from '@/repositories/promotion.repository';

// =================================================================
// SECTION 1: HELPERS
// =================================================================

/**
 * Safe cast helper for JSON fields
 * Converts a known object type to Prisma.InputJsonValue without 'unknown' casting
 */
function toJson(data: object): Prisma.InputJsonValue {
  return data as Prisma.InputJsonValue;
}

/**
 * Helper para extraer typeSpecificFields según el tipo de reward
 */
function extractTypeSpecificFields(reward: { type: string; typeSpecificFields?: unknown }): Prisma.InputJsonValue | Prisma.NullTypes.DbNull {
  if (reward.type === 'FREEBET' && 'typeSpecificFields' in reward && reward.typeSpecificFields) {
    return toJson(reward.typeSpecificFields as object);
  }
  return Prisma.DbNull;
}

// Importar la función compartida desde qualify-condition.transformer
import { extractQualifyConditions } from './qualify-condition.transformer';

/**
 * Helper defensivo para obtener un ID del mapa de hashes.
 */
const getConditionIdOrThrow = (hash: string, map: Map<string, string>): string => {
  const id = map.get(hash);
  if (!id) {
    throw new Error(`[Integrity Error] No se encontró ID generado para el hash de condición: ${hash}`);
  }
  return id;
};

/**
 * Genera la estructura de AvailableTimeframes para que el frontend sepa
 * qué eventos (anchors) están disponibles para configurar fechas relativas.
 */
export function generateAvailableTimeframes(promotion: PromotionWithRelations): AvailableTimeframes {
  const timeframes: AvailableTimeframes = [];

  // 1. PROMOTION LEVEL
  const promotionTimestamps: TimeframeEventTimestamp[] = [
    { event: 'ACTIVE' as AnchorEvent, eventLabel: 'Activación de Promoción', date: promotion.activatedAt?.toISOString() ?? '' },
    { event: 'COMPLETED' as AnchorEvent, eventLabel: 'Finalización de Promoción', date: promotion.completedAt?.toISOString() ?? '' },
    { event: 'EXPIRED' as AnchorEvent, eventLabel: 'Expiración de Promoción', date: promotion.expiredAt?.toISOString() ?? '' },
  ];

  timeframes.push({
    entityType: 'PROMOTION',
    entityTypeLabel: 'Promoción',
    entities: [{
      entityId: promotion.id,
      entityLabel: promotion.name,
      timeStamps: promotionTimestamps,
    }],
  });

  // 2. PHASE LEVEL
  const phaseEntities: AvailableTimeframesByType = {
    entityType: 'PHASE',
    entityTypeLabel: 'Fases',
    entities: [],
  };

  // 3. REWARD LEVEL
  const rewardEntities: AvailableTimeframesByType = {
    entityType: 'REWARD',
    entityTypeLabel: 'Recompensas',
    entities: [],
  };

  // 4. QUALIFY CONDITION LEVEL
  const qualifyConditionEntities: AvailableTimeframesByType = {
    entityType: 'QUALIFY_CONDITION',
    entityTypeLabel: 'Condiciones de Calificación',
    entities: [],
  };

  for (const phase of promotion.phases) {
    // Add Phase
    phaseEntities.entities.push({
      entityId: phase.id,
      entityLabel: phase.name,
      timeStamps: [
        { event: 'ACTIVE' as AnchorEvent, eventLabel: 'Activación de Fase', date: phase.activatedAt?.toISOString() ?? '' },
        { event: 'COMPLETED' as AnchorEvent, eventLabel: 'Finalización de Fase', date: phase.completedAt?.toISOString() ?? '' },
        { event: 'EXPIRED' as AnchorEvent, eventLabel: 'Expiración de Fase', date: phase.expiredAt?.toISOString() ?? '' },
      ],
    });

    // Add Qualify Conditions within Phase (from pool)
    if (phase.availableQualifyConditions) {
      for (const qc of phase.availableQualifyConditions) {
        qualifyConditionEntities.entities.push({
          entityId: qc.id,
          entityLabel: qc.description || `${qc.type} Condition`,
          timeStamps: [
            { event: 'STARTED' as AnchorEvent, eventLabel: 'Inicio de condición', date: qc.startedAt?.toISOString() ?? '' },
            { event: 'FULFILLED' as AnchorEvent, eventLabel: 'Condición cumplida', date: qc.qualifiedAt?.toISOString() ?? '' },
            { event: 'FAILED' as AnchorEvent, eventLabel: 'Condición fallida', date: qc.failedAt?.toISOString() ?? '' },
            { event: 'EXPIRED' as AnchorEvent, eventLabel: 'Condición expirada', date: qc.expiredAt?.toISOString() ?? '' },
          ]
        });
      }
    }

    // Add Rewards within Phase
    for (const reward of phase.rewards) {
      // Asumimos eventos estándar de Reward
      rewardEntities.entities.push({
        entityId: reward.id,
        entityLabel: `${phase.name} - ${reward.type} (${reward.value})`,
        timeStamps: [
          { event: 'PENDING_TO_CLAIM' as AnchorEvent, eventLabel: 'Condiciones Cumplidas', date: reward.qualifyConditionsFulfilledAt?.toISOString() ?? '' },
          { event: 'CLAIMED' as AnchorEvent, eventLabel: 'Reclamado', date: reward.claimedAt?.toISOString() ?? '' },
          { event: 'RECEIVED' as AnchorEvent, eventLabel: 'Recibido', date: reward.receivedAt?.toISOString() ?? '' },
          { event: 'IN_USE' as AnchorEvent, eventLabel: 'Uso Iniciado', date: reward.useStartedAt?.toISOString() ?? '' },
          { event: 'USED' as AnchorEvent, eventLabel: 'Uso Completado', date: reward.useCompletedAt?.toISOString() ?? '' },
          { event: 'EXPIRED' as AnchorEvent, eventLabel: 'Expirado', date: reward.expiredAt?.toISOString() ?? '' },
        ],
      });
    }
  }

  if (phaseEntities.entities.length > 0) timeframes.push(phaseEntities);
  if (rewardEntities.entities.length > 0) timeframes.push(rewardEntities);
  if (qualifyConditionEntities.entities.length > 0) timeframes.push(qualifyConditionEntities);

  // --- DIAGNÓSTICO ---
  console.log('🔍 Generated Available Timeframes:', JSON.stringify(timeframes, null, 2));

  return timeframes;
}

/**
 * Helper para mapear status + statusDate a los campos de fecha de Prisma (Promotion/Phase)
 */
function mapStatusDates(status: string | undefined, statusDate: Date | null | undefined) {
  const dates: { activatedAt?: Date | null; completedAt?: Date | null; expiredAt?: Date | null } = {};
  
  if (!status) return dates;

  // Si hay una fecha explícita proporcionada por el usuario, la usamos.
  // Si no, usamos la fecha actual (now).
  const dateToUse = statusDate ?? new Date();

  switch (status) {
    case 'ACTIVE':
      dates.activatedAt = dateToUse;
      break;
    case 'COMPLETED':
      dates.completedAt = dateToUse;
      break;
    case 'EXPIRED':
      dates.expiredAt = dateToUse;
      break;
    // 'NOT_STARTED' no setea ninguna fecha específica, o podría limpiar activatedAt si se quisiera revertir
  }
  return dates;
}

/**
 * Helper para mapear status de Reward a sus fechas correspondientes
 */
function mapRewardStatusDates(status: string | undefined, statusDate: Date | null | undefined) {
  const dates: { 
    qualifyConditionsFulfilledAt?: Date | null; 
    claimedAt?: Date | null; 
    receivedAt?: Date | null; 
    useStartedAt?: Date | null; 
    useCompletedAt?: Date | null; 
    expiredAt?: Date | null; 
  } = {};

  if (!status) return dates;
  const dateToUse = statusDate ?? new Date();

  switch (status) {
    case 'PENDING_TO_CLAIM':
      dates.qualifyConditionsFulfilledAt = dateToUse;
      break;
    case 'CLAIMED':
      dates.claimedAt = dateToUse;
      break;
    case 'RECEIVED':
      dates.receivedAt = dateToUse;
      break;
    case 'IN_USE':
      dates.useStartedAt = dateToUse;
      break;
    case 'USED':
      dates.useCompletedAt = dateToUse;
      break;
    case 'EXPIRED':
      dates.expiredAt = dateToUse;
      break;
    // 'QUALIFYING' no tiene campo de fecha explícito. Su "fecha de inicio" es el createdAt del registro.
  }
  return dates;
}

/**
 * Helper para mapear status de QualifyCondition a sus fechas correspondientes
 */
function mapQualifyConditionStatusDates(status: string | undefined, statusDate: Date | null | undefined) {
  const dates: { 
    startedAt?: Date | null; 
    qualifiedAt?: Date | null; 
    failedAt?: Date | null; 
    expiredAt?: Date | null; 
  } = {};

  if (!status) return dates;
  const dateToUse = statusDate ?? new Date();

  switch (status) {
    case 'QUALIFYING':
      dates.startedAt = dateToUse;
      break;
    case 'FULFILLED':
      dates.qualifiedAt = dateToUse;
      break;
    case 'FAILED':
      dates.failedAt = dateToUse;
      break;
    case 'EXPIRED': // QualifyCondition también puede expirar
      dates.expiredAt = dateToUse;
      break;
    // 'PENDING' no tiene campo de fecha explícito.
  }
  return dates;
}

// =================================================================
// SECTION 2: CREATE/UPDATE TRANSFORMERS
// =================================================================

/**
 * Transforma un input de Promotion a formato Prisma para crear, usando la estrategia
 * de "Application-Side IDs" para garantizar la atomicidad y la integridad.
 */
export function toPromotionCreateInput(
  promotion: Promotion,
  userId: string
): Prisma.PromotionCreateInput {
  const promotionDates = mapStatusDates(promotion.status, promotion.statusDate);

  return {
    name: promotion.name,
    description: promotion.description,
    bookmaker: promotion.bookmaker,
    status: promotion.status || 'NOT_STARTED',
    timeframe: toJson(promotion.timeframe),
    cardinality: promotion.cardinality,
    activationMethod: promotion.activationMethod || 'AUTOMATIC',
    user: { connect: { id: userId } },
    
    // Mapeo de fechas de estado de Promoción
    ...promotionDates,

    phases: {
      create: promotion.phases.map((phase) => {
        const phaseDates = mapStatusDates(phase.status, phase.statusDate);
        const conditionHashToIdMap = new Map<string, string>();
        // Use strict Prisma type for the array
        const uniqueConditionsToCreate: Prisma.RewardQualifyConditionCreateWithoutPhaseInput[] = [];
        const allConditions = phase.rewards.flatMap(r => r.qualifyConditions);

        for (const qc of allConditions) {
          const qcDates = mapQualifyConditionStatusDates(qc.status, qc.statusDate); // Usar statusDate si existe
          const hash = stringify(qc); // Hash estable
          if (!conditionHashToIdMap.has(hash)) {
            const newId = createId();
            conditionHashToIdMap.set(hash, newId);
            uniqueConditionsToCreate.push({
              id: newId,
              type: qc.type,
              description: qc.description,
              status: qc.status || 'PENDING',
              // ❌ contributesToRewardValue eliminado - ahora solo dentro de conditions
              timeframe: toJson(qc.timeframe),
              conditions: extractQualifyConditions(qc),
              ...qcDates, // Fechas iniciales si nace con status
            });
          }
        }

        const rewardsCreatePayload = phase.rewards.map((reward) => {
          const rewardDates = mapRewardStatusDates(reward.status, reward.statusDate); // Usar statusDate si existe
          return {
            type: reward.type,
            value: reward.value,
            valueType: reward.valueType,
            activationMethod: reward.activationMethod,
            claimMethod: reward.claimMethod,
            claimRestrictions: reward.claimRestrictions,
            status: reward.status || 'QUALIFYING',
            typeSpecificFields: extractTypeSpecificFields(reward),
            usageConditions: reward.usageConditions ? toJson(reward.usageConditions) : Prisma.JsonNull,
            qualifyConditions: {
              connect: reward.qualifyConditions.map(qc => ({
                id: getConditionIdOrThrow(stringify(qc), conditionHashToIdMap)
              }))
            },
            ...rewardDates, // Fechas iniciales si nace con status
          };
        });

        return {
          name: phase.name,
          description: phase.description,
          status: phase.status || 'NOT_STARTED',
          activationMethod: phase.activationMethod,
          timeframe: toJson(phase.timeframe),
          availableQualifyConditions: { create: uniqueConditionsToCreate },
          rewards: { create: rewardsCreatePayload },
          // Mapeo de fechas de estado de fase
          ...phaseDates,
        };
      }),
    },
  };
}

/**
 * Transforma un input parcial de Promotion a formato Prisma para actualizar,
 * usando una estrategia híbrida de "Application-Side IDs" y diffing.
 */
export function toPromotionUpdateInput(
  data: Partial<Promotion>
): Prisma.PromotionUpdateInput {
  const updateInput: Prisma.PromotionUpdateInput = {};
  
  if (data.name !== undefined) updateInput.name = data.name;
  if (data.description !== undefined) updateInput.description = data.description;
  if (data.bookmaker !== undefined) updateInput.bookmaker = data.bookmaker;
  if (data.status !== undefined) updateInput.status = data.status;
  if (data.timeframe !== undefined) updateInput.timeframe = toJson(data.timeframe);
  if (data.cardinality !== undefined) updateInput.cardinality = data.cardinality;
  if (data.activationMethod !== undefined) updateInput.activationMethod = data.activationMethod;

  // Actualizar fechas de Promoción si cambia el status o se provee statusDate
  if (data.status) {
    const dates = mapStatusDates(data.status, data.statusDate);
    Object.assign(updateInput, dates);
  }

  if (data.phases !== undefined) {
    const existingPhases = data.phases.filter(p => p.id) as Phase[];
    const newPhases = data.phases.filter(p => !p.id) as Phase[];
    const activePhaseIds = existingPhases.map(p => p.id!);

    updateInput.phases = {
      deleteMany: { id: { notIn: activePhaseIds } },
      create: newPhases.map(phase => transformNewPhaseWithIds(phase)),
      
      update: existingPhases.map(phase => {
        // --- MAPA MAESTRO HÍBRIDO ---
        const conditionMap = new Map<string, string>();
        const allConditions = phase.rewards.flatMap(r => r.qualifyConditions);
        
        allConditions.filter(qc => qc.id).forEach(qc => {
            conditionMap.set(qc.id!, qc.id!);
        });
        
        const newConditions = allConditions.filter(qc => !qc.id);
        const uniqueNewConditions: (QualifyCondition & { _generatedId: string })[] = [];

        newConditions.forEach(qc => {
            const hash = stringify(qc);
            if (!conditionMap.has(hash)) {
                const newId = createId();
                conditionMap.set(hash, newId);
                uniqueNewConditions.push({ ...qc, _generatedId: newId });
            }
        });

        const resolveId = (qc: QualifyCondition): string => {
            if (qc.id) {
               const id = conditionMap.get(qc.id);
               if(!id) throw new Error(`[Integrity Error] ID existente perdido: ${qc.id}`);
               return id;
            }
            const hash = stringify(qc);
            const id = conditionMap.get(hash);
            if (!id) throw new Error(`[Integrity Error] Hash perdido para condición nueva: ${hash}`);
            return id;
        };

        const activeConditionIds = allConditions.filter(qc => qc.id).map(qc => qc.id!);

        const phaseDates = mapStatusDates(phase.status, phase.statusDate);

        return {
          where: { id: phase.id! },
          data: {
            name: phase.name,
            description: phase.description,
            status: phase.status,
            activationMethod: phase.activationMethod,
            timeframe: toJson(phase.timeframe),
            ...phaseDates, // Actualizar fechas de fase

            availableQualifyConditions: {
              deleteMany: { id: { notIn: activeConditionIds } },
              
              create: uniqueNewConditions.map(qc => {
                const qcDates = mapQualifyConditionStatusDates(qc.status, qc.statusDate); // Usar statusDate si existe
                return {
                  id: qc._generatedId,
                  type: qc.type,
                  description: qc.description,
                  status: qc.status || 'PENDING',
                  // ❌ contributesToRewardValue eliminado - ahora solo dentro de conditions
                  timeframe: toJson(qc.timeframe),
                  conditions: extractQualifyConditions(qc),
                  ...qcDates,
                };
              }),
              
              update: allConditions.filter(qc => qc.id).map(qc => {
                const qcDates = mapQualifyConditionStatusDates(qc.status, qc.statusDate); // Usar statusDate si existe
                return {
                  where: { id: qc.id! },
                  data: {
                    type: qc.type,
                    description: qc.description,
                    status: qc.status,
                    // ❌ contributesToRewardValue eliminado - ahora solo dentro de conditions
                    timeframe: toJson(qc.timeframe),
                    conditions: extractQualifyConditions(qc),
                    ...qcDates,
                  }
                };
              })
            },

            rewards: {
              deleteMany: { id: { notIn: phase.rewards.filter(r => r.id).map(r => r.id!) } },
              
              create: phase.rewards.filter(r => !r.id).map(r => {
                const rewardDates = mapRewardStatusDates(r.status, r.statusDate); // Usar statusDate si existe
                return {
                  type: r.type,
                  value: r.value,
                  valueType: r.valueType,
                  activationMethod: r.activationMethod,
                  claimMethod: r.claimMethod,
                  claimRestrictions: r.claimRestrictions,
                  status: r.status || 'QUALIFYING',
                  typeSpecificFields: extractTypeSpecificFields(r),
                  usageConditions: r.usageConditions ? toJson(r.usageConditions) : Prisma.JsonNull,
                  qualifyConditions: {
                      connect: r.qualifyConditions.map(qc => ({ id: resolveId(qc) }))
                  },
                  ...rewardDates,
                };
              }),

              update: phase.rewards.filter(r => r.id).map(r => {
                const rewardDates = mapRewardStatusDates(r.status, r.statusDate); // Usar statusDate si existe
                return {
                  where: { id: r.id! },
                  data: {
                      type: r.type,
                      value: r.value,
                      valueType: r.valueType,
                      activationMethod: r.activationMethod,
                      claimMethod: r.claimMethod,
                      claimRestrictions: r.claimRestrictions,
                      status: r.status,
                      typeSpecificFields: extractTypeSpecificFields(r),
                      usageConditions: r.usageConditions ? toJson(r.usageConditions) : Prisma.JsonNull,
                      qualifyConditions: {
                          set: r.qualifyConditions.map(qc => ({ id: resolveId(qc) }))
                      },
                      ...rewardDates,
                  }
                };
              })
            }
          }
        };
      })
    };
  }
  return updateInput;
}

/**
 * Helper para transformar fases nuevas durante un update.
 */
function transformNewPhaseWithIds(phase: Phase): Prisma.PhaseCreateWithoutPromotionInput {
    const phaseDates = mapStatusDates(phase.status, phase.statusDate);
    const conditionHashToIdMap = new Map<string, string>();
    // Use strict Prisma type for the array
    const uniqueConditionsToCreate: Prisma.RewardQualifyConditionCreateWithoutPhaseInput[] = [];
    const allConditions = phase.rewards.flatMap(r => r.qualifyConditions);

    for (const qc of allConditions) {
      const qcDates = mapQualifyConditionStatusDates(qc.status, qc.statusDate);
      const hash = stringify(qc);
      if (!conditionHashToIdMap.has(hash)) {
        const newId = createId();
        conditionHashToIdMap.set(hash, newId);
        uniqueConditionsToCreate.push({
          id: newId,
          type: qc.type,
          description: qc.description,
          status: qc.status || 'PENDING',
          // ❌ contributesToRewardValue eliminado - ahora solo dentro de conditions
          timeframe: toJson(qc.timeframe),
          conditions: extractQualifyConditions(qc),
          ...qcDates,
        });
      }
    }

    return {
      name: phase.name,
      description: phase.description,
      status: phase.status || 'NOT_STARTED',
      activationMethod: phase.activationMethod,
      timeframe: toJson(phase.timeframe),
      availableQualifyConditions: { create: uniqueConditionsToCreate },
      rewards: {
        create: phase.rewards.map((reward) => {
          const rewardDates = mapRewardStatusDates(reward.status, reward.statusDate);
          return {
            type: reward.type,
            value: reward.value,
            valueType: reward.valueType,
            activationMethod: reward.activationMethod,
            claimMethod: reward.claimMethod,
            claimRestrictions: reward.claimRestrictions,
            status: reward.status || 'QUALIFYING',
            typeSpecificFields: extractTypeSpecificFields(reward),
            usageConditions: reward.usageConditions ? toJson(reward.usageConditions) : Prisma.JsonNull,
            qualifyConditions: {
              connect: reward.qualifyConditions.map((qc) => ({
                id: getConditionIdOrThrow(stringify(qc), conditionHashToIdMap)
              }))
            },
            ...rewardDates,
          };
        })
      },
      ...phaseDates,
    };
}


// =================================================================
// SECTION 3: ENTITY TRANSFORMERS (Prisma to Frontend)
// =================================================================

type RewardWithRelations = PrismaReward & {
  qualifyConditions: PrismaRewardQualifyCondition[];
  usageTracking: PrismaRewardUsageTracking | null;
};

type PhaseWithRelations = PrismaPhase & {
  availableQualifyConditions: PrismaRewardQualifyCondition[];
  rewards: RewardWithRelations[];
};

function toQualifyConditionEntity(condition: PrismaRewardQualifyCondition): QualifyConditionEntity {
  const timeframe = TimeframeSchema.parse(condition.timeframe);
  const status = QualifyConditionStatusSchema.parse(condition.status);

  const baseFields = {
    id: condition.id,
    type: condition.type,
    status,
    timeframe,
    // ❌ contributesToRewardValue eliminado - ahora solo dentro de conditions como discriminador
    balance: condition.balance,
    phaseId: condition.phaseId,
    description: condition.description,
    dependsOnQualifyConditionId: condition.dependsOnQualifyConditionId,
    startedAt: condition.startedAt,
    qualifiedAt: condition.qualifiedAt,
    failedAt: condition.failedAt,
    expiredAt: condition.expiredAt,
    createdAt: condition.createdAt,
    updatedAt: condition.updatedAt,
  };

  switch (condition.type) {
    case 'DEPOSIT': {
      const conditions = DepositConditionsSchema.parse(condition.conditions);
      const tracking = condition.trackingData
        ? DepositQualifyTrackingSchema.parse(condition.trackingData)
        : null;
      return {
        ...baseFields,
        type: 'DEPOSIT' as const,
        conditions,
        tracking,
      };
    }
    case 'BET': {
      const conditions = BetConditionsSpecificSchema.parse(condition.conditions);
      const tracking = condition.trackingData
        ? BetQualifyTrackingSchema.parse(condition.trackingData)
        : null;
      return {
        ...baseFields,
        type: 'BET' as const,
        conditions,
        tracking,
      };
    }
    case 'LOSSES_CASHBACK': {
      const conditions = LossesCashbackConditionsSchema.parse(condition.conditions);
      const tracking = condition.trackingData
        ? LossesCashbackQualifyTrackingSchema.parse(condition.trackingData)
        : null;
      return {
        ...baseFields,
        type: 'LOSSES_CASHBACK' as const,
        conditions,
        tracking,
      };
    }
    default: {
      // Type-safe error handling without unknown
      const invalidType = condition.type;
      throw new Error(`Tipo de QualifyCondition no soportado: ${String(invalidType)}`);
    }
  }
}

function toRewardEntity(reward: RewardWithRelations): RewardEntity {
  const status = RewardStatusSchema.parse(reward.status);
  const qualifyConditions = reward.qualifyConditions.map(toQualifyConditionEntity);

  const baseFields = {
    id: reward.id,
    type: reward.type,
    value: reward.value,
    valueType: reward.valueType,
    activationMethod: reward.activationMethod,
    claimMethod: reward.claimMethod,
    claimRestrictions: reward.claimRestrictions,
    status,
    qualifyConditions,
    totalBalance: reward.totalBalance,
    phaseId: reward.phaseId,
    qualifyConditionsFulfilledAt: reward.qualifyConditionsFulfilledAt,
    claimedAt: reward.claimedAt,
    receivedAt: reward.receivedAt,
    useStartedAt: reward.useStartedAt,
    useCompletedAt: reward.useCompletedAt,
    expiredAt: reward.expiredAt,
    createdAt: reward.createdAt,
    updatedAt: reward.updatedAt,
  };

  switch (reward.type) {
    case 'FREEBET': {
      const typeSpecificFields = reward.typeSpecificFields
        ? FreeBetTypeSpecificFieldsSchema.parse(reward.typeSpecificFields)
        : { stakeNotReturned: true }; // Default
      const usageConditions = FreeBetUsageConditionsSchema.parse(reward.usageConditions);
      const usageTracking = reward.usageTracking
        ? FreeBetUsageTrackingSchema.parse(reward.usageTracking)
        : reward.usageTracking;
      return { ...baseFields, type: 'FREEBET' as const, typeSpecificFields, usageConditions, usageTracking };
    }
    case 'CASHBACK_FREEBET': {
      const usageConditions = CashbackUsageConditionsSchema.parse(reward.usageConditions);
      const usageTracking = reward.usageTracking
        ? CashbackUsageTrackingSchema.parse(reward.usageTracking)
        : reward.usageTracking;
      return { ...baseFields, type: 'CASHBACK_FREEBET' as const, typeSpecificFields: null, usageConditions, usageTracking };
    }
    case 'BET_BONUS_ROLLOVER': {
      const usageConditions = BonusRolloverUsageConditionsSchema.parse(reward.usageConditions);
      const usageTracking = reward.usageTracking
        ? BonusRolloverUsageTrackingSchema.parse(reward.usageTracking)
        : reward.usageTracking;
      return { ...baseFields, type: 'BET_BONUS_ROLLOVER' as const, typeSpecificFields: null, usageConditions, usageTracking };
    }
    case 'BET_BONUS_NO_ROLLOVER': {
      const usageConditions = BonusNoRolloverUsageConditionsSchema.parse(reward.usageConditions);
      const usageTracking = reward.usageTracking
        ? BonusNoRolloverUsageTrackingSchema.parse(reward.usageTracking)
        : reward.usageTracking;
      return { ...baseFields, type: 'BET_BONUS_NO_ROLLOVER' as const, typeSpecificFields: null, usageConditions, usageTracking };
    }
    case 'ENHANCED_ODDS': {
      const usageConditions = EnhancedOddsUsageConditionsSchema.parse(reward.usageConditions);
      const usageTracking = reward.usageTracking
        ? EnhancedOddsUsageTrackingSchema.parse(reward.usageTracking)
        : reward.usageTracking;
      return { ...baseFields, type: 'ENHANCED_ODDS' as const, typeSpecificFields: null, usageConditions, usageTracking };
    }
    case 'CASINO_SPINS': {
      const usageConditions = CasinoSpinsUsageConditionsSchema.parse(reward.usageConditions);
      const usageTracking = reward.usageTracking
        ? CasinoSpinsUsageTrackingSchema.parse(reward.usageTracking)
        : reward.usageTracking;
      return { ...baseFields, type: 'CASINO_SPINS' as const, typeSpecificFields: null, usageConditions, usageTracking };
    }
    default: {
      // Type-safe error handling
      const invalidType = reward.type;
      throw new Error(`Tipo de Reward no soportado: ${String(invalidType)}`);
    }
  }
}

function toPhaseEntity(phase: PhaseWithRelations): PhaseEntity {
  const rewardEntities = phase.rewards.map(toRewardEntity);
  const totalBalance = rewardEntities.reduce((sum, reward) => sum + reward.totalBalance, 0);
  const timeframe = TimeframeSchema.parse(phase.timeframe);
  const status = PhaseStatusSchema.parse(phase.status);
  const availableQualifyConditions = phase.availableQualifyConditions.map(toQualifyConditionEntity);

  return {
    id: phase.id,
    name: phase.name,
    description: phase.description ?? '',
    status,
    activationMethod: phase.activationMethod,
    timeframe,
    availableQualifyConditions,
    rewards: rewardEntities,
    totalBalance,
    promotionId: phase.promotionId,
    createdAt: phase.createdAt,
    updatedAt: phase.updatedAt,
    activatedAt: phase.activatedAt,
    completedAt: phase.completedAt,
    expiredAt: phase.expiredAt,
  } as PhaseEntity;
}

interface ToPromotionEntityOptions {
  /** Include availableTimeframes in the entity. Default: true. Set to false for list views. */
  includeAvailableTimeframes?: boolean;
}

export function toPromotionEntity(
  promotion: PromotionWithRelations,
  options: ToPromotionEntityOptions = {}
): PromotionEntity {
  const { includeAvailableTimeframes = true } = options;
  const phaseEntities = promotion.phases.map(toPhaseEntity);
  const totalBalance = phaseEntities.reduce((sum, phase) => sum + phase.totalBalance, 0);
  const timeframe = TimeframeSchema.parse(promotion.timeframe);
  const status = PromotionStatusSchema.parse(promotion.status);

  // Generar dinámicamente las opciones de timeframe (solo si se requiere)
  const availableTimeframes = includeAvailableTimeframes
    ? generateAvailableTimeframes(promotion)
    : undefined;

  return {
    id: promotion.id,
    name: promotion.name,
    description: promotion.description ?? '',
    bookmaker: promotion.bookmaker,
    status,
    timeframe,
    cardinality: promotion.cardinality,
    activationMethod: promotion.activationMethod,
    phases: phaseEntities,
    totalBalance,
    userId: promotion.userId,
    // Campo inyectado (DTO) - solo presente en getById, no en list
    availableTimeframes,
    createdAt: promotion.createdAt,
    updatedAt: promotion.updatedAt,
    activatedAt: promotion.activatedAt,
    completedAt: promotion.completedAt,
    expiredAt: promotion.expiredAt,
  } as PromotionEntity;
}
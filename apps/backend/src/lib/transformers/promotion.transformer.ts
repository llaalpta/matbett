import { createId } from '@paralleldrive/cuid2';
import { Prisma } from '@prisma/client';
import { toInputJson } from '@/utils/prisma-json';
import { requireNumber } from '@/utils/validation';
import { BadRequestError } from '@/utils/errors';
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
  Reward,
  QualifyConditionEntity,
  QualifyCondition,
  Phase,
  AnchorCatalog,
  AnchorCatalogByType,
  AnchorOccurrences,
  Timeframe,
  UsageConditions,
} from '@matbett/shared';
import {
  TimeframeSchema,
  AbsoluteTimeframeSchema,
  promotionAnchorEventOptions,
  phaseAnchorEventOptions,
  rewardAnchorEventOptions,
  qualifyConditionAnchorEventOptions,
  BookmakerAccountTypeSchema,
  RewardStatusSchema,
  RewardTypeSchema,
  RewardValueTypeSchema,
  ActivationMethodSchema,
  ClaimMethodSchema,
  BookmakerSchema,
  PromotionCardinalitySchema,
  PhaseStatusSchema,
  PromotionStatusSchema,
  QualifyConditionStatusSchema,
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
  AnchorRefType,
} from '@matbett/shared';
import { z } from 'zod';
import type { PromotionWithRelations } from '@/repositories/promotion.repository';
import {
  parseTypeSpecificFieldsByRewardType,
  parseUsageConditionsByRewardType,
} from './reward-shared.transformer';

type PromotionBookmakerAccountSnapshot = {
  id: string;
  bookmaker: string;
};

// =================================================================
// SECTION 1: HELPERS
// =================================================================

/**
 * Helper para extraer typeSpecificFields según el tipo de reward
 */
function extractTypeSpecificFields(reward: Reward): Prisma.InputJsonValue | Prisma.NullTypes.DbNull {
  if (reward.type === 'FREEBET' && reward.typeSpecificFields) {
    return toInputJson(reward.typeSpecificFields);
  }
  return Prisma.DbNull;
}

// Importar la función compartida desde qualify-condition.transformer
import { extractQualifyConditions } from './qualify-condition.transformer';

const getConditionIdOrThrow = (key: string, map: Map<string, string>): string => {
  const id = map.get(key);
  if (!id) {
    throw new Error(`[Integrity Error] No se encontró ID generado para la condición: ${key}`);
  }
  return id;
};

const getConditionKey = (qc: QualifyCondition): string => {
  if (qc.id) {return `id:${qc.id}`;}
  if (qc.clientId) {return `client:${qc.clientId}`;}
  throw new Error('QualifyCondition requires id or clientId');
};

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
): UsageConditions => {
  return {
    ...usageConditions,
    timeframe: resolveTimeframeAnchors(usageConditions.timeframe, refMap),
  };
};

/**
 * Genera el AnchorCatalog para que el frontend sepa
 * qué eventos (anchors) están disponibles para configurar fechas relativas.
 */
const persistedRefType: AnchorRefType = 'persisted';


export function generateAnchorCatalog(promotion: PromotionWithRelations): AnchorCatalog {
  const catalog: AnchorCatalog = [];

  const promotionEvents = promotionAnchorEventOptions.map((option) => ({
    event: option.value,
    eventLabel: option.label,
  }));

  catalog.push({
    entityType: 'PROMOTION',
    entityTypeLabel: 'Promotion',
    entities: [
      {
        entityRefType: persistedRefType,
        entityRef: promotion.id,
        entityLabel: promotion.name,
        events: promotionEvents,
      },
    ],
  });

  const phaseEntries: AnchorCatalogByType = {
    entityType: 'PHASE',
    entityTypeLabel: 'Phases',
    entities: [],
  };
  const rewardEntries: AnchorCatalogByType = {
    entityType: 'REWARD',
    entityTypeLabel: 'Rewards',
    entities: [],
  };
  const qualifyEntries: AnchorCatalogByType = {
    entityType: 'QUALIFY_CONDITION',
    entityTypeLabel: 'Qualify Conditions',
    entities: [],
  };

  for (const qc of promotion.availableQualifyConditions) {
    const conditionEvents = qualifyConditionAnchorEventOptions.map((option) => ({
      event: option.value,
      eventLabel: option.label,
    }));

    qualifyEntries.entities.push({
      entityRefType: persistedRefType,
      entityRef: qc.id,
      entityLabel: qc.description || qc.type + ' Condition',
      events: conditionEvents,
    });
  }

  for (const phase of promotion.phases) {
    const phaseEvents = phaseAnchorEventOptions.map((option) => ({
      event: option.value,
      eventLabel: option.label,
    }));

    phaseEntries.entities.push({
      entityRefType: persistedRefType,
      entityRef: phase.id,
      entityLabel: phase.name,
      events: phaseEvents,
    });

    for (const reward of phase.rewards) {
      const rewardEvents = rewardAnchorEventOptions.map((option) => ({
        event: option.value,
        eventLabel: option.label,
      }));

      rewardEntries.entities.push({
        entityRefType: persistedRefType,
        entityRef: reward.id,
        entityLabel: phase.name + ' - ' + reward.type + ' (' + reward.value + ')',
        events: rewardEvents,
      });
    }
  }

  if (phaseEntries.entities.length > 0) {catalog.push(phaseEntries);}
  if (rewardEntries.entities.length > 0) {catalog.push(rewardEntries);}
  if (qualifyEntries.entities.length > 0) {catalog.push(qualifyEntries);}

  return catalog;
}

export function generateAnchorOccurrences(promotion: PromotionWithRelations): AnchorOccurrences {
  const occurrences: AnchorOccurrences = [
    { entityType: 'PROMOTION', entityRefType: persistedRefType, entityRef: promotion.id, event: 'ACTIVE', occurredAt: promotion.activatedAt },
    { entityType: 'PROMOTION', entityRefType: persistedRefType, entityRef: promotion.id, event: 'COMPLETED', occurredAt: promotion.completedAt },
    { entityType: 'PROMOTION', entityRefType: persistedRefType, entityRef: promotion.id, event: 'EXPIRED', occurredAt: promotion.expiredAt },
  ];

  for (const phase of promotion.phases) {
    occurrences.push(
      { entityType: 'PHASE', entityRefType: persistedRefType, entityRef: phase.id, event: 'ACTIVE', occurredAt: phase.activatedAt },
      { entityType: 'PHASE', entityRefType: persistedRefType, entityRef: phase.id, event: 'COMPLETED', occurredAt: phase.completedAt },
      { entityType: 'PHASE', entityRefType: persistedRefType, entityRef: phase.id, event: 'EXPIRED', occurredAt: phase.expiredAt },
    );

    for (const reward of phase.rewards) {
      occurrences.push(
        { entityType: 'REWARD', entityRefType: persistedRefType, entityRef: reward.id, event: 'PENDING_TO_CLAIM', occurredAt: reward.qualifyConditionsFulfilledAt },
        { entityType: 'REWARD', entityRefType: persistedRefType, entityRef: reward.id, event: 'CLAIMED', occurredAt: reward.claimedAt },
        { entityType: 'REWARD', entityRefType: persistedRefType, entityRef: reward.id, event: 'RECEIVED', occurredAt: reward.receivedAt },
        { entityType: 'REWARD', entityRefType: persistedRefType, entityRef: reward.id, event: 'IN_USE', occurredAt: reward.useStartedAt },
        { entityType: 'REWARD', entityRefType: persistedRefType, entityRef: reward.id, event: 'USED', occurredAt: reward.useCompletedAt },
        { entityType: 'REWARD', entityRefType: persistedRefType, entityRef: reward.id, event: 'EXPIRED', occurredAt: reward.expiredAt },
      );
    }
  }

  for (const qc of promotion.availableQualifyConditions) {
    occurrences.push(
      { entityType: 'QUALIFY_CONDITION', entityRefType: persistedRefType, entityRef: qc.id, event: 'STARTED', occurredAt: qc.startedAt },
      { entityType: 'QUALIFY_CONDITION', entityRefType: persistedRefType, entityRef: qc.id, event: 'FULFILLED', occurredAt: qc.qualifiedAt },
      { entityType: 'QUALIFY_CONDITION', entityRefType: persistedRefType, entityRef: qc.id, event: 'FAILED', occurredAt: qc.failedAt },
      { entityType: 'QUALIFY_CONDITION', entityRefType: persistedRefType, entityRef: qc.id, event: 'EXPIRED', occurredAt: qc.expiredAt },
    );
  }

  return occurrences;
}

function mapStatusDates(status: string | undefined, statusDate: Date | undefined) {
  const dates: { activatedAt?: Date | null; completedAt?: Date | null; expiredAt?: Date | null } = {};
  
  if (!status) {return dates;}

  // Si hay una fecha explícita proporcionada por el usuario, la usamos.
  // Si no, usamos la fecha actual (now).

  switch (status) {
    case 'ACTIVE':
      if (!statusDate) {
        throw new BadRequestError('statusDate is required when changing status.');
      }
      dates.activatedAt = statusDate;
      break;
    case 'COMPLETED':
      if (!statusDate) {
        throw new BadRequestError('statusDate is required when changing status.');
      }
      dates.completedAt = statusDate;
      break;
    case 'EXPIRED':
      if (!statusDate) {
        throw new BadRequestError('statusDate is required when changing status.');
      }
      dates.expiredAt = statusDate;
      break;
    // 'NOT_STARTED' no setea ninguna fecha específica, o podría limpiar activatedAt si se quisiera revertir
  }
  return dates;
}

/**
 * Helper para mapear status de Reward a sus fechas correspondientes
 */
function mapRewardStatusDates(status: string | undefined, statusDate: Date | undefined) {
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
    // 'QUALIFYING' no tiene campo de fecha explícito. Su "fecha de inicio" es el createdAt del registro.
  }
  return dates;
}

/**
 * Helper para mapear status de QualifyCondition a sus fechas correspondientes
 */
function mapQualifyConditionStatusDates(status: string | undefined, statusDate: Date | undefined) {
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
    case 'EXPIRED': // QualifyCondition también puede expirar
      if (!statusDate) {
        throw new BadRequestError('statusDate is required when changing status.');
      }
      dates.expiredAt = statusDate;
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
  userId: string,
  bookmakerAccount: PromotionBookmakerAccountSnapshot
): Prisma.PromotionCreateInput {
  const promotionId = createId();
  const promotionDates = mapStatusDates(promotion.status, promotion.statusDate);
  const conditionKeyToIdMap = new Map<string, string>();
  const anchorRefMap = new Map<string, string>();
  const conditionsToCreate: Prisma.RewardQualifyConditionCreateWithoutPromotionInput[] = [];
  const phasesWithIds = promotion.phases.map((phase) => ({
    phase,
    phaseId: phase.id ?? createId(),
    rewardsWithIds: phase.rewards.map((reward) => ({
      reward,
      rewardId: reward.id ?? createId(),
    })),
  }));

  registerAnchorRef(anchorRefMap, 'PROMOTION', promotionId, promotion.clientId);
  for (const phaseData of phasesWithIds) {
    registerAnchorRef(
      anchorRefMap,
      'PHASE',
      phaseData.phaseId,
      phaseData.phase.clientId
    );
    for (const rewardData of phaseData.rewardsWithIds) {
      registerAnchorRef(
        anchorRefMap,
        'REWARD',
        rewardData.rewardId,
        rewardData.reward.clientId
      );
    }
  }

  const ensureCondition = (qc: QualifyCondition): string => {
    const key = getConditionKey(qc);
    const existing = conditionKeyToIdMap.get(key);
    if (existing) {return existing;}

    const generatedId = qc.id ?? createId();
    const qcDates = mapQualifyConditionStatusDates(qc.status, qc.statusDate);
    conditionKeyToIdMap.set(key, generatedId);
    registerAnchorRef(anchorRefMap, 'QUALIFY_CONDITION', generatedId, qc.clientId);
    conditionsToCreate.push({
      id: generatedId,
      type: qc.type,
      description: qc.description,
      status: qc.status || 'PENDING',
      timeframe: toInputJson(resolveTimeframeAnchors(qc.timeframe, anchorRefMap)),
      conditions: extractQualifyConditions(qc),
      ...qcDates,
    });
    return generatedId;
  };

  for (const qc of promotion.availableQualifyConditions) {
    ensureCondition(qc);
  }

  for (const phaseData of phasesWithIds) {
    for (const rewardData of phaseData.rewardsWithIds) {
      const reward = rewardData.reward;
      for (const qc of reward.qualifyConditions) {
        ensureCondition(qc);
      }
    }
  }

  return {
    id: promotionId,
    name: promotion.name,
    description: promotion.description,
    bookmaker: bookmakerAccount.bookmaker,
    bookmakerAccount: { connect: { id: bookmakerAccount.id } },
    status: promotion.status || 'NOT_STARTED',
    timeframe: toInputJson(resolveTimeframeAnchors(promotion.timeframe, anchorRefMap)),
    cardinality: promotion.cardinality,
    activationMethod: promotion.activationMethod || 'AUTOMATIC',
    user: { connect: { id: userId } },

    // Mapeo de fechas de estado de Promocion
    ...promotionDates,
    availableQualifyConditions: { create: conditionsToCreate },

    phases: {
      create: phasesWithIds.map((phaseData) => {
        const phase = phaseData.phase;
        const phaseDates = mapStatusDates(phase.status, phase.statusDate);

        const rewardsCreatePayload = phaseData.rewardsWithIds.map((rewardData) => {
          const reward = rewardData.reward;
          const rewardDates = mapRewardStatusDates(reward.status, reward.statusDate);
          return {
            id: rewardData.rewardId,
            type: reward.type,
            value: requireNumber(reward.value, 'reward.value'),
            valueType: reward.valueType,
            activationMethod: ActivationMethodSchema.parse(reward.activationMethod),
            claimMethod: ClaimMethodSchema.parse(reward.claimMethod),
            activationRestrictions: reward.activationRestrictions,
            claimRestrictions: reward.claimRestrictions,
            withdrawalRestrictions: reward.withdrawalRestrictions,
            status: reward.status || 'QUALIFYING',
            typeSpecificFields: extractTypeSpecificFields(reward),
            usageConditions: reward.usageConditions
              ? toInputJson(resolveUsageConditionsAnchors(reward.usageConditions, anchorRefMap))
              : Prisma.JsonNull,
            promotion: { connect: { id: promotionId } },
            qualifyConditions: {
              connect: reward.qualifyConditions.map((qc) => ({
                id: getConditionIdOrThrow(getConditionKey(qc), conditionKeyToIdMap),
              })),
            },
            ...rewardDates,
          };
        });

        return {
          id: phaseData.phaseId,
          name: phase.name,
          description: phase.description,
          status: phase.status || 'NOT_STARTED',
          activationMethod: ActivationMethodSchema.parse(phase.activationMethod),
          timeframe: toInputJson(resolveTimeframeAnchors(phase.timeframe, anchorRefMap)),
          rewards: { create: rewardsCreatePayload },
          // Mapeo de fechas de estado de fase
          ...phaseDates,
        };
      }),
    },
  };
}

export function toPromotionUpdateInput(
  data: Partial<Promotion>,
  promotionId: string,
  bookmakerAccount?: PromotionBookmakerAccountSnapshot
): Prisma.PromotionUpdateInput {
  const updateInput: Prisma.PromotionUpdateInput = {};
  const anchorRefMap = new Map<string, string>();
  registerAnchorRef(anchorRefMap, 'PROMOTION', promotionId, data.clientId);
  
  if (data.name !== undefined) {updateInput.name = data.name;}
  if (data.description !== undefined) {updateInput.description = data.description;}
  if (data.bookmakerAccountId !== undefined && bookmakerAccount) {
    updateInput.bookmaker = bookmakerAccount.bookmaker;
    updateInput.bookmakerAccount = { connect: { id: bookmakerAccount.id } };
  }
  if (data.status !== undefined) {updateInput.status = data.status;}
  if (data.timeframe !== undefined) {
    updateInput.timeframe = toInputJson(
      resolveTimeframeAnchors(data.timeframe, anchorRefMap)
    );
  }
  if (data.cardinality !== undefined) {updateInput.cardinality = data.cardinality;}
  if (data.activationMethod !== undefined) {updateInput.activationMethod = data.activationMethod;}

  // Actualizar fechas de Promoción si cambia el status o se provee statusDate
  if (data.status) {
    const dates = mapStatusDates(data.status, data.statusDate);
    Object.assign(updateInput, dates);
  }

  if (data.phases !== undefined) {
    const phasesWithIds = data.phases.map((phase) => ({
      phase,
      phaseId: phase.id ?? createId(),
      rewardsWithIds: phase.rewards.map((reward) => ({
        reward,
        rewardId: reward.id ?? createId(),
      })),
    }));

    for (const phaseData of phasesWithIds) {
      registerAnchorRef(
        anchorRefMap,
        'PHASE',
        phaseData.phaseId,
        phaseData.phase.clientId
      );
      for (const rewardData of phaseData.rewardsWithIds) {
        registerAnchorRef(
          anchorRefMap,
          'REWARD',
          rewardData.rewardId,
          rewardData.reward.clientId
        );
      }
    }

    const existingPhases = phasesWithIds.filter(
      (phaseData) => Boolean(phaseData.phase.id)
    );
    const newPhases = phasesWithIds.filter(
      (phaseData) => !phaseData.phase.id
    );
    const activePhaseIds = existingPhases.map((phaseData) => phaseData.phaseId);

    const rewardConditions = phasesWithIds.flatMap((phaseData) =>
      phaseData.rewardsWithIds.flatMap((rewardData) => rewardData.reward.qualifyConditions)
    );
    const poolConditions = data.availableQualifyConditions ?? [];
    const allConditions = [...poolConditions, ...rewardConditions];
    const conditionMap = new Map<string, string>();
    const newConditions: QualifyCondition[] = [];

    for (const qc of allConditions) {
      const key = getConditionKey(qc);
      if (conditionMap.has(key)) {continue;}
      if (qc.id) {
        conditionMap.set(key, qc.id);
        registerAnchorRef(anchorRefMap, 'QUALIFY_CONDITION', qc.id, qc.clientId);
      } else {
        const newId = createId();
        conditionMap.set(key, newId);
        registerAnchorRef(anchorRefMap, 'QUALIFY_CONDITION', newId, qc.clientId);
        newConditions.push(qc);
      }
    }

    const resolveId = (qc: QualifyCondition): string =>
      getConditionIdOrThrow(getConditionKey(qc), conditionMap);

    const activeConditionIds = allConditions
      .filter((qc): qc is QualifyCondition & { id: string } => Boolean(qc.id))
      .map((qc) => qc.id);

    updateInput.availableQualifyConditions = {
      deleteMany: { id: { notIn: activeConditionIds } },
      create: newConditions.map((qc) => {
        const qcDates = mapQualifyConditionStatusDates(qc.status, qc.statusDate);
        const generatedId = resolveId(qc);
        return {
          id: generatedId,
          type: qc.type,
          description: qc.description,
          status: qc.status || 'PENDING',
          timeframe: toInputJson(resolveTimeframeAnchors(qc.timeframe, anchorRefMap)),
          conditions: extractQualifyConditions(qc),
          ...qcDates,
        };
      }),
      update: allConditions
        .filter((qc): qc is QualifyCondition & { id: string } => Boolean(qc.id))
        .map((qc) => {
        const qcDates = mapQualifyConditionStatusDates(qc.status, qc.statusDate);
        return {
          where: { id: qc.id },
          data: {
            type: qc.type,
            description: qc.description,
            status: qc.status,
            timeframe: toInputJson(resolveTimeframeAnchors(qc.timeframe, anchorRefMap)),
            conditions: extractQualifyConditions(qc),
            ...qcDates,
          }
        };
      })
    };

    updateInput.phases = {
      deleteMany: { id: { notIn: activePhaseIds } },
      create: newPhases.map((phaseData) =>
        transformNewPhaseWithIds(
          phaseData,
          resolveId,
          promotionId,
          anchorRefMap
        )
      ),

      update: existingPhases.map((phaseData) => {
        const phase = phaseData.phase;
        const phaseDates = mapStatusDates(phase.status, phase.statusDate);

        return {
          where: { id: phaseData.phaseId },
          data: {
            name: phase.name,
            description: phase.description,
            status: phase.status,
            activationMethod: ActivationMethodSchema.parse(phase.activationMethod),
            timeframe: toInputJson(
              resolveTimeframeAnchors(phase.timeframe, anchorRefMap)
            ),
            ...phaseDates,

            rewards: {
              deleteMany: {
                id: {
                  notIn: phaseData.rewardsWithIds
                    .filter((rewardData) => Boolean(rewardData.reward.id))
                    .map((rewardData) => rewardData.rewardId),
                },
              },

              create: phaseData.rewardsWithIds
                .filter((rewardData) => !rewardData.reward.id)
                .map((rewardData) => {
                const reward = rewardData.reward;
                const rewardDates = mapRewardStatusDates(reward.status, reward.statusDate);
                return {
                  id: rewardData.rewardId,
                  type: reward.type,
                  value: requireNumber(reward.value, 'reward.value'),
                  valueType: reward.valueType,
                  activationMethod: reward.activationMethod,
                  claimMethod: ClaimMethodSchema.parse(reward.claimMethod),
                  activationRestrictions: reward.activationRestrictions,
                  claimRestrictions: reward.claimRestrictions,
                  withdrawalRestrictions: reward.withdrawalRestrictions,
                  status: reward.status || 'QUALIFYING',
                  typeSpecificFields: extractTypeSpecificFields(reward),
                  usageConditions: reward.usageConditions
                    ? toInputJson(
                        resolveUsageConditionsAnchors(
                          reward.usageConditions,
                          anchorRefMap
                        )
                      )
                    : Prisma.JsonNull,
                  promotion: { connect: { id: promotionId } },
                  qualifyConditions: {
                    connect: reward.qualifyConditions.map((qc) => ({ id: resolveId(qc) }))
                  },
                  ...rewardDates,
                };
              }),

              update: phaseData.rewardsWithIds
                .filter((rewardData) => Boolean(rewardData.reward.id))
                .map((rewardData) => {
                const reward = rewardData.reward;
                const rewardDates = mapRewardStatusDates(reward.status, reward.statusDate);
                const rewardUpdateData: Prisma.RewardUpdateWithWhereUniqueWithoutPhaseInput = {
                  where: { id: rewardData.rewardId },
                  data: {
                    type: reward.type,
                    valueType: reward.valueType,
                    activationMethod: reward.activationMethod,
                    claimMethod: ClaimMethodSchema.parse(reward.claimMethod),
                    activationRestrictions: reward.activationRestrictions,
                    claimRestrictions: reward.claimRestrictions,
                    withdrawalRestrictions: reward.withdrawalRestrictions,
                    status: reward.status,
                    typeSpecificFields: extractTypeSpecificFields(reward),
                    usageConditions: reward.usageConditions
                      ? toInputJson(
                          resolveUsageConditionsAnchors(
                            reward.usageConditions,
                            anchorRefMap
                          )
                        )
                      : Prisma.JsonNull,
                    qualifyConditions: {
                      set: reward.qualifyConditions.map((qc) => ({ id: resolveId(qc) }))
                    },
                    ...rewardDates,
                  }
                };

                if (reward.value !== undefined) {
                  rewardUpdateData.data.value = reward.value;
                }

                return rewardUpdateData;
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
function transformNewPhaseWithIds(
  phaseData: {
    phase: Phase;
    phaseId: string;
    rewardsWithIds: Array<{ reward: Reward; rewardId: string }>;
  },
  resolveId: (qc: QualifyCondition) => string,
  promotionId: string,
  anchorRefMap: Map<string, string>
): Prisma.PhaseCreateWithoutPromotionInput {
    const { phase } = phaseData;
    const phaseDates = mapStatusDates(phase.status, phase.statusDate);

    return {
      id: phaseData.phaseId,
      name: phase.name,
      description: phase.description,
      status: phase.status || 'NOT_STARTED',
      activationMethod: ActivationMethodSchema.parse(phase.activationMethod),
      timeframe: toInputJson(resolveTimeframeAnchors(phase.timeframe, anchorRefMap)),
      rewards: {
        create: phaseData.rewardsWithIds.map((rewardData) => {
          const { reward } = rewardData;
          const rewardDates = mapRewardStatusDates(reward.status, reward.statusDate);
          return {
            id: rewardData.rewardId,
            type: reward.type,
            value: requireNumber(reward.value, 'reward.value'),
            valueType: reward.valueType,
            activationMethod: ActivationMethodSchema.parse(reward.activationMethod),
            claimMethod: ClaimMethodSchema.parse(reward.claimMethod),
            activationRestrictions: reward.activationRestrictions,
            claimRestrictions: reward.claimRestrictions,
            withdrawalRestrictions: reward.withdrawalRestrictions,
            status: reward.status || 'QUALIFYING',
            typeSpecificFields: extractTypeSpecificFields(reward),
            usageConditions: reward.usageConditions
              ? toInputJson(resolveUsageConditionsAnchors(reward.usageConditions, anchorRefMap))
              : Prisma.JsonNull,
            promotion: { connect: { id: promotionId } },
            qualifyConditions: {
              connect: reward.qualifyConditions.map((qc) => ({
                id: resolveId(qc)
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
  qualifyConditions: Array<
    PrismaRewardQualifyCondition & {
      _count?: {
        rewards: number;
        depositParticipations: number;
        betParticipations: number;
      };
    }
  >;
  usageTracking: PrismaRewardUsageTracking | null;
};

type PhaseWithRelations = PrismaPhase & {
  rewards: RewardWithRelations[];
};

type PromotionQualifyConditionWithCounts = PrismaRewardQualifyCondition & {
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
      };
    };
  }>;
};

function parseUsageTrackingOrNull<T extends z.ZodTypeAny>(
  schema: T,
  usageTracking: PrismaRewardUsageTracking | null,
): z.infer<T> | null {
  if (!usageTracking) {
    return null;
  }

  const parsed = schema.safeParse(usageTracking.usageData);
  return parsed.success ? parsed.data : null;
}

function getPromotionLikeStatusDate(status: string, dates: {
  activatedAt?: Date | null;
  completedAt?: Date | null;
  expiredAt?: Date | null;
  createdAt: Date;
}): Date {
  switch (status) {
    case "ACTIVE":
      return dates.activatedAt ?? dates.createdAt;
    case "COMPLETED":
      return dates.completedAt ?? dates.createdAt;
    case "EXPIRED":
      return dates.expiredAt ?? dates.createdAt;
    default:
      return dates.createdAt;
  }
}

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

export function toPromotionQualifyConditionEntity(
  condition: PromotionQualifyConditionWithCounts
): QualifyConditionEntity {
  const timeframe = TimeframeSchema.parse(condition.timeframe);
  const status = QualifyConditionStatusSchema.parse(condition.status);

  const baseFields = {
    id: condition.id,
    type: condition.type,
    status,
    statusDate: getQualifyConditionStatusDate(status, {
      startedAt: condition.startedAt,
      qualifiedAt: condition.qualifiedAt,
      failedAt: condition.failedAt,
      expiredAt: condition.expiredAt,
      createdAt: condition.createdAt,
    }),
    canDelete:
      (condition._count?.rewards ?? 0) === 0 &&
      (condition._count?.depositParticipations ?? 0) === 0 &&
      (condition._count?.betParticipations ?? 0) === 0,
    timeframe,
    balance: condition.balance,
    promotionId: condition.promotionId,
    promotionName: undefined,
    linkedRewards: (condition.rewards ?? []).map((reward) => ({
      id: reward.id,
      type: RewardTypeSchema.parse(reward.type),
      status: RewardStatusSchema.parse(reward.status),
      phaseId: reward.phase.id,
      phaseName: reward.phase.name ?? undefined,
      phaseStatus: PhaseStatusSchema.parse(reward.phase.status),
      promotionStatus: PromotionStatusSchema.parse(reward.phase.promotion.status),
    })),
    trackingStats: {
      totalParticipations:
        (condition._count?.depositParticipations ?? 0) +
        (condition._count?.betParticipations ?? 0),
      betParticipations: condition._count?.betParticipations ?? 0,
      depositParticipations: condition._count?.depositParticipations ?? 0,
    },
    description: condition.description,
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
  const qualifyConditions = reward.qualifyConditions.map(
    (condition) => toPromotionQualifyConditionEntity(condition)
  );

  const baseFields = {
    id: reward.id,
    type: reward.type,
    value: reward.value,
    valueType: RewardValueTypeSchema.parse(reward.valueType),
    activationMethod: ActivationMethodSchema.parse(reward.activationMethod),
    claimMethod: ClaimMethodSchema.parse(reward.claimMethod),
    activationRestrictions: reward.activationRestrictions,
    claimRestrictions: reward.claimRestrictions,
    withdrawalRestrictions: reward.withdrawalRestrictions,
    status,
    statusDate: getRewardStatusDate(status, {
      qualifyConditionsFulfilledAt: reward.qualifyConditionsFulfilledAt,
      claimedAt: reward.claimedAt,
      receivedAt: reward.receivedAt,
      useStartedAt: reward.useStartedAt,
      useCompletedAt: reward.useCompletedAt,
      expiredAt: reward.expiredAt,
      createdAt: reward.createdAt,
    }),
    canDelete: qualifyConditions.length === 0,
    qualifyConditions,
    totalBalance: reward.totalBalance,
    phaseId: reward.phaseId,
    promotionId: reward.promotionId,
    promotionName: undefined,
    phaseName: undefined,
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
      const typeSpecificFields = parseTypeSpecificFieldsByRewardType(
        'FREEBET',
        reward.typeSpecificFields
      );
      const usageConditions = parseUsageConditionsByRewardType(
        'FREEBET',
        reward.usageConditions
      );
      const usageTracking = parseUsageTrackingOrNull(
        FreeBetUsageTrackingSchema,
        reward.usageTracking
      );
      return { ...baseFields, type: 'FREEBET' as const, typeSpecificFields, usageConditions, usageTracking };
    }
    case 'CASHBACK_FREEBET': {
      const usageConditions = parseUsageConditionsByRewardType(
        'CASHBACK_FREEBET',
        reward.usageConditions
      );
      const usageTracking = parseUsageTrackingOrNull(
        CashbackUsageTrackingSchema,
        reward.usageTracking
      );
      return {
        ...baseFields,
        type: 'CASHBACK_FREEBET' as const,
        typeSpecificFields: parseTypeSpecificFieldsByRewardType(
          'CASHBACK_FREEBET',
          reward.typeSpecificFields
        ),
        usageConditions,
        usageTracking
      };
    }
    case 'BET_BONUS_ROLLOVER': {
      const usageConditions = parseUsageConditionsByRewardType(
        'BET_BONUS_ROLLOVER',
        reward.usageConditions
      );
      const usageTracking = parseUsageTrackingOrNull(
        BonusRolloverUsageTrackingSchema,
        reward.usageTracking
      );
      return {
        ...baseFields,
        type: 'BET_BONUS_ROLLOVER' as const,
        typeSpecificFields: parseTypeSpecificFieldsByRewardType(
          'BET_BONUS_ROLLOVER',
          reward.typeSpecificFields
        ),
        usageConditions,
        usageTracking
      };
    }
    case 'BET_BONUS_NO_ROLLOVER': {
      const usageConditions = parseUsageConditionsByRewardType(
        'BET_BONUS_NO_ROLLOVER',
        reward.usageConditions
      );
      const usageTracking = parseUsageTrackingOrNull(
        BonusNoRolloverUsageTrackingSchema,
        reward.usageTracking
      );
      return {
        ...baseFields,
        type: 'BET_BONUS_NO_ROLLOVER' as const,
        typeSpecificFields: parseTypeSpecificFieldsByRewardType(
          'BET_BONUS_NO_ROLLOVER',
          reward.typeSpecificFields
        ),
        usageConditions,
        usageTracking
      };
    }
    case 'ENHANCED_ODDS': {
      const usageConditions = parseUsageConditionsByRewardType(
        'ENHANCED_ODDS',
        reward.usageConditions
      );
      const usageTracking = parseUsageTrackingOrNull(
        EnhancedOddsUsageTrackingSchema,
        reward.usageTracking
      );
      return {
        ...baseFields,
        type: 'ENHANCED_ODDS' as const,
        typeSpecificFields: parseTypeSpecificFieldsByRewardType(
          'ENHANCED_ODDS',
          reward.typeSpecificFields
        ),
        usageConditions,
        usageTracking
      };
    }
    case 'CASINO_SPINS': {
      const usageConditions = parseUsageConditionsByRewardType(
        'CASINO_SPINS',
        reward.usageConditions
      );
      const usageTracking = parseUsageTrackingOrNull(
        CasinoSpinsUsageTrackingSchema,
        reward.usageTracking
      );
      return {
        ...baseFields,
        type: 'CASINO_SPINS' as const,
        typeSpecificFields: parseTypeSpecificFieldsByRewardType(
          'CASINO_SPINS',
          reward.typeSpecificFields
        ),
        usageConditions,
        usageTracking
      };
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
  return {
    id: phase.id,
    name: phase.name,
    description: phase.description ?? '',
    status,
    statusDate: getPromotionLikeStatusDate(status, {
      activatedAt: phase.activatedAt,
      completedAt: phase.completedAt,
      expiredAt: phase.expiredAt,
      createdAt: phase.createdAt,
    }),
    activationMethod: ActivationMethodSchema.parse(phase.activationMethod),
    timeframe,
    rewards: rewardEntities,
    canDelete: rewardEntities.length === 0,
    totalBalance,
    promotionId: phase.promotionId,
    createdAt: phase.createdAt,
    updatedAt: phase.updatedAt,
    activatedAt: phase.activatedAt,
    completedAt: phase.completedAt,
    expiredAt: phase.expiredAt,
  };
}

export function toPromotionEntity(
  promotion: PromotionWithRelations
): PromotionEntity {
  const phaseEntities = promotion.phases.map(toPhaseEntity);
  const availableQualifyConditions = promotion.availableQualifyConditions.map((condition) =>
    toPromotionQualifyConditionEntity(condition)
  );
  const totalBalance = phaseEntities.reduce((sum, phase) => sum + phase.totalBalance, 0);
  const status = PromotionStatusSchema.parse(promotion.status);

  return {
    id: promotion.id,
    name: promotion.name,
    description: promotion.description ?? '',
    bookmakerAccountId: promotion.bookmakerAccountId,
    bookmaker: BookmakerSchema.parse(
      promotion.bookmakerAccount?.bookmaker ?? promotion.bookmaker
    ),
    bookmakerAccountIdentifier: promotion.bookmakerAccount?.accountIdentifier,
    bookmakerAccountType: promotion.bookmakerAccount
      ? BookmakerAccountTypeSchema.parse(promotion.bookmakerAccount.accountType)
      : undefined,
    status,
    statusDate: getPromotionLikeStatusDate(status, {
      activatedAt: promotion.activatedAt,
      completedAt: promotion.completedAt,
      expiredAt: promotion.expiredAt,
      createdAt: promotion.createdAt,
    }),
    timeframe: AbsoluteTimeframeSchema.parse(promotion.timeframe),
    cardinality: PromotionCardinalitySchema.parse(promotion.cardinality),
    activationMethod: ActivationMethodSchema.parse(promotion.activationMethod),
    phases: phaseEntities,
    availableQualifyConditions,
    totalBalance,
    userId: promotion.userId,
    createdAt: promotion.createdAt,
    updatedAt: promotion.updatedAt,
    activatedAt: promotion.activatedAt,
    completedAt: promotion.completedAt,
    expiredAt: promotion.expiredAt,
  };
}

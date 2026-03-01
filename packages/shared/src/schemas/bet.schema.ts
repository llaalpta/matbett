import { z } from 'zod';
import {
  BetLineModeSchema,
  BetParticipationKindSchema,
  BetStatusSchema,
  HedgeAdjustmentTypeSchema,
  HedgeModeSchema,
  LegRoleSchema,
  OptionsSchema,
  QualifyConditionTypeSchema,
  RewardTypeSchema,
  ScenarioIdSchema,
  StrategyKindSchema,
  StrategyTypeSchema,
} from './enums';
import {
  getScenarioId,
  type ScenarioId as ScenarioIdValue,
  type ScenarioPromoAction,
  validateLegShapeByScenario,
} from './bet-scenarios';
import {
  PaginationInputSchema,
  createPaginatedResponseSchema,
} from './pagination.schema';

const EntityIdSchema = z.string().min(1);
const DutchingOptionsCountSchema = z.union([z.literal(2), z.literal(3)]);
const DefaultLegRoleOrder = ['MAIN', 'HEDGE1', 'HEDGE2', 'HEDGE3'] as const;
const SupportedPromoActions: readonly ScenarioPromoAction[] = [
  'NO_PROMO',
  'GENERATE_FREEBET',
  'USE_FREEBET',
];

// =============================================
// BATCH-LEVEL EVENT DATA
// =============================================

export const BatchEventSchema = z.object({
  eventName: z.string().min(1),
  marketName: z.string().min(1),
  eventOptions: OptionsSchema,
  eventDate: z.date().optional(),
});

export const BetSelectionSchema = z.object({
  eventIndex: z.number().int().min(0),
  selection: z.string().min(1),
  odds: z.number().optional(),
});

export const EnhancedOddsSchema = z.object({
  originalOdds: z.number(),
});

// =============================================
// STRATEGY + CALCULATION CONTEXT
// =============================================

const NoStrategyContextSchema = z.object({
  kind: z.literal('NONE'),
});

const HedgeStrategyContextSchemaBase = z.object({
  kind: z.literal('HEDGE'),
  strategyType: StrategyTypeSchema,
  lineMode: BetLineModeSchema,
  mode: HedgeModeSchema,
  dutchingOptionsCount: DutchingOptionsCountSchema.optional(),
  hedgeAdjustmentType: HedgeAdjustmentTypeSchema.optional(),
});

export const HedgeStrategyContextSchema = HedgeStrategyContextSchemaBase.superRefine(
  validateStrategyContext,
);

export const StrategyContextSchema = z
  .discriminatedUnion('kind', [NoStrategyContextSchema, HedgeStrategyContextSchemaBase])
  .superRefine(validateStrategyContext);

export const CreateCalculationTargetSchema = z.object({
  participationKey: z.string().min(1),
});

export const CreateCalculationContextSchema = z.object({
  scenarioId: ScenarioIdSchema.optional(),
  target: CreateCalculationTargetSchema.optional(),
});

export const UpdateCalculationTargetSchema = z
  .object({
    participationId: EntityIdSchema.optional(),
    participationKey: z.string().min(1).optional(),
  })
  .superRefine(validateUpdateCalculationTarget);

export const UpdateCalculationContextSchema = z.object({
  scenarioId: ScenarioIdSchema.optional(),
  target: UpdateCalculationTargetSchema.optional(),
});

// =============================================
// PARTICIPATIONS
// =============================================

const PromotionParticipationInputCommonSchema = z.object({
  participationKey: z.string().min(1),
  kind: BetParticipationKindSchema,
  rewardType: RewardTypeSchema,
  contributesToTracking: z.boolean(),
});

const QualifyTrackingParticipationInputSchemaBase =
  PromotionParticipationInputCommonSchema.extend({
    kind: z.literal('QUALIFY_TRACKING'),
    qualifyConditionId: EntityIdSchema,
    rewardIds: z.array(EntityIdSchema).min(1),
    calculationRewardId: EntityIdSchema,
  });

const RewardUsageParticipationInputSchemaBase =
  PromotionParticipationInputCommonSchema.extend({
    kind: z.literal('REWARD_USAGE'),
    usageTrackingId: EntityIdSchema,
    rewardId: EntityIdSchema,
  });

export const QualifyTrackingParticipationInputSchema =
  QualifyTrackingParticipationInputSchemaBase.superRefine(validatePromotionParticipation);

export const RewardUsageParticipationInputSchema =
  RewardUsageParticipationInputSchemaBase.superRefine(validatePromotionParticipation);

export const PromotionParticipationInputSchema = z
  .discriminatedUnion('kind', [
    QualifyTrackingParticipationInputSchemaBase,
    RewardUsageParticipationInputSchemaBase,
  ])
  .superRefine(validatePromotionParticipation);

const BetParticipationEntityBaseSchema = z.object({
  id: EntityIdSchema,
  batchId: EntityIdSchema,
  betId: EntityIdSchema,
  promotionId: EntityIdSchema,
  phaseId: EntityIdSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const PromotionParticipationEntityCommonSchema = z.object({
  kind: BetParticipationKindSchema,
  rewardType: RewardTypeSchema,
  contributesToTracking: z.boolean(),
});

export const QualifyTrackingParticipationSchema = BetParticipationEntityBaseSchema.extend({
  ...PromotionParticipationEntityCommonSchema.shape,
  kind: z.literal('QUALIFY_TRACKING'),
  qualifyConditionId: EntityIdSchema,
  rewardIds: z.array(EntityIdSchema).min(1),
  calculationRewardId: EntityIdSchema,
});

export const RewardUsageParticipationSchema = BetParticipationEntityBaseSchema.extend({
  ...PromotionParticipationEntityCommonSchema.shape,
  kind: z.literal('REWARD_USAGE'),
  usageTrackingId: EntityIdSchema,
  rewardId: EntityIdSchema,
  stakeAmount: z.number().optional(),
  rolloverContribution: z.number().optional(),
});

export const BetParticipationSchema = z.discriminatedUnion('kind', [
  QualifyTrackingParticipationSchema,
  RewardUsageParticipationSchema,
]);

// =============================================
// LEG + BATCH INPUTS
// =============================================

export const BetLegInputSchema = z.object({
  legRole: LegRoleSchema.optional(),
  legOrder: z.number().int().min(0),
  bookmakerAccountId: EntityIdSchema,
  selections: z.array(BetSelectionSchema).min(1),
  stake: z.number(),
  odds: z.number(),
  commission: z.number().min(0).default(0),
  profit: z.number(),
  risk: z.number(),
  yield: z.number(),
  status: BetStatusSchema.default('PENDING'),
  placedAt: z.date().optional(),
  settledAt: z.date().nullable().optional(),
  enhancedOdds: EnhancedOddsSchema.optional(),
  participations: z.array(PromotionParticipationInputSchema).default([]),
});

export const UpdateBetLegInputSchema = BetLegInputSchema.extend({
  betId: EntityIdSchema.optional(),
});

export const BetSchema = BetLegInputSchema.omit({
  participations: true,
  placedAt: true,
  status: true,
}).extend({
  id: EntityIdSchema,
  batchId: EntityIdSchema,
  status: BetStatusSchema,
  placedAt: z.date(),
  participations: z.array(BetParticipationSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const RegisterBetsBatchSchemaBase = z.object({
  strategy: StrategyContextSchema,
  calculation: CreateCalculationContextSchema,
  events: z.array(BatchEventSchema).min(1).max(3),
  legs: z.array(BetLegInputSchema).min(1).max(4),
  profit: z.number(),
  risk: z.number(),
  yield: z.number(),
});

const UpdateBetsBatchSchemaBase = z.object({
  strategy: StrategyContextSchema,
  calculation: UpdateCalculationContextSchema,
  events: z.array(BatchEventSchema).min(1).max(3),
  legs: z.array(UpdateBetLegInputSchema).min(1).max(4),
  profit: z.number(),
  risk: z.number(),
  yield: z.number(),
});

export const RegisterBetsBatchSchema = RegisterBetsBatchSchemaBase.superRefine((value, ctx) =>
  validateBatch(value, ctx, 'create'),
);

export const UpdateBetsBatchSchema = UpdateBetsBatchSchemaBase.superRefine((value, ctx) =>
  validateBatch(value, ctx, 'update'),
);

export const BetRegistrationBatchSchema = z.object({
  id: EntityIdSchema,
  strategy: StrategyContextSchema,
  scenarioId: ScenarioIdSchema.optional(),
  calculationParticipationId: EntityIdSchema.optional(),
  events: z.array(BatchEventSchema).min(1).max(3),
  legs: z.array(BetSchema).min(1).max(4),
  profit: z.number(),
  risk: z.number(),
  yield: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const BetBatchSummarySchema = z.object({
  id: EntityIdSchema,
  strategy: StrategyContextSchema,
  scenarioId: ScenarioIdSchema.optional(),
  calculationParticipationId: EntityIdSchema.optional(),
  legsCount: z.number().int().min(1),
  bookmakerAccountIds: z.array(EntityIdSchema),
  statuses: z.array(BetStatusSchema),
  profit: z.number(),
  risk: z.number(),
  yield: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const BetPromotionContextSchema = z.object({
  promotionId: EntityIdSchema,
  promotionName: z.string().min(1),
  rewardId: EntityIdSchema.optional(),
  rewardType: RewardTypeSchema.optional(),
  phaseId: EntityIdSchema.optional(),
  phaseName: z.string().min(1).optional(),
  role: z.enum(['QUALIFICATION', 'USAGE']),
});

export const BetBatchListInputSchema = PaginationInputSchema.extend({
  strategyKind: StrategyKindSchema.optional(),
  status: BetStatusSchema.optional(),
  bookmakerAccountId: EntityIdSchema.optional(),
});

export const BetListItemSchema = BetSchema.extend({
  strategy: StrategyContextSchema,
  scenarioId: ScenarioIdSchema.optional(),
  events: z.array(BatchEventSchema).min(1).max(3),
  batchCreatedAt: z.date(),
  batchUpdatedAt: z.date(),
  promotionContext: BetPromotionContextSchema.nullable().optional(),
  balance: z.number().nullable().optional(),
});

export const BetListInputSchema = PaginationInputSchema.extend({
  status: BetStatusSchema.optional(),
  bookmakerAccountId: EntityIdSchema.optional(),
  promotionId: EntityIdSchema.optional(),
  qualifyConditionId: EntityIdSchema.optional(),
  usageTrackingId: EntityIdSchema.optional(),
  batchId: EntityIdSchema.optional(),
  placedFrom: z.date().optional(),
  placedTo: z.date().optional(),
});

export const AvailableRewardUsageContextSchema = z.object({
  rewardId: EntityIdSchema,
  rewardType: RewardTypeSchema,
  rewardValue: z.number(),
  usageTrackingId: EntityIdSchema,
  promotionId: EntityIdSchema,
  promotionName: z.string().min(1),
  phaseId: EntityIdSchema,
  phaseName: z.string().min(1),
});

export const AvailableQualifyRewardOptionSchema = z.object({
  rewardId: EntityIdSchema,
  rewardType: RewardTypeSchema,
  phaseId: EntityIdSchema,
  phaseName: z.string().min(1),
});

export const AvailableQualifyTrackingContextSchema = z.object({
  qualifyConditionId: EntityIdSchema,
  qualifyConditionType: QualifyConditionTypeSchema,
  description: z.string().optional(),
  promotionId: EntityIdSchema,
  promotionName: z.string().min(1),
  rewards: z.array(AvailableQualifyRewardOptionSchema).min(1),
});

export const AvailablePromotionContextsSchema = z.object({
  bookmakerAccountId: EntityIdSchema,
  rewardUsageContexts: z.array(AvailableRewardUsageContextSchema),
  qualifyTrackingContexts: z.array(AvailableQualifyTrackingContextSchema),
});

export const BetDashboardTotalsSchema = z.object({
  totalBatches: z.number().int().min(0),
  totalBets: z.number().int().min(0),
  totalProfit: z.number(),
  totalRisk: z.number(),
  averageYield: z.number(),
  byStatus: z.record(BetStatusSchema, z.number()),
  byBookmaker: z.record(z.string(), z.number()),
});

export const DeleteBetBatchResultSchema = z.object({
  success: z.boolean(),
});

export const PaginatedBetBatchResponseSchema =
  createPaginatedResponseSchema(BetBatchSummarySchema);

export const PaginatedBetListResponseSchema =
  createPaginatedResponseSchema(BetListItemSchema);

// =============================================
// LIST RESPONSE
// =============================================

export const BetListMetadataSchema = z.object({
  totalBets: z.number(),
  totalStake: z.number(),
  totalProfit: z.number(),
  profitByStatus: z.record(BetStatusSchema, z.number()),
});

export const BetListResponseSchema = z.object({
  items: z.array(BetSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  stats: BetListMetadataSchema,
});

// =============================================
// INFERRED TYPES
// =============================================

export type BatchEvent = z.infer<typeof BatchEventSchema>;
export type BetSelection = z.infer<typeof BetSelectionSchema>;
export type EnhancedOdds = z.infer<typeof EnhancedOddsSchema>;

export type NoStrategyContext = z.infer<typeof NoStrategyContextSchema>;
export type HedgeStrategyContext = z.infer<typeof HedgeStrategyContextSchema>;
export type StrategyContext = z.infer<typeof StrategyContextSchema>;

export type CreateCalculationTarget = z.infer<typeof CreateCalculationTargetSchema>;
export type CreateCalculationContext = z.infer<typeof CreateCalculationContextSchema>;
export type UpdateCalculationTarget = z.infer<typeof UpdateCalculationTargetSchema>;
export type UpdateCalculationContext = z.infer<typeof UpdateCalculationContextSchema>;

export type QualifyTrackingParticipationInput = z.infer<
  typeof QualifyTrackingParticipationInputSchema
>;
export type RewardUsageParticipationInput = z.infer<
  typeof RewardUsageParticipationInputSchema
>;
export type PromotionParticipationInput = z.infer<typeof PromotionParticipationInputSchema>;

export type QualifyTrackingParticipation = z.infer<typeof QualifyTrackingParticipationSchema>;
export type RewardUsageParticipation = z.infer<typeof RewardUsageParticipationSchema>;
export type BetParticipation = z.infer<typeof BetParticipationSchema>;

export type BetLegInput = z.infer<typeof BetLegInputSchema>;
export type UpdateBetLegInput = z.infer<typeof UpdateBetLegInputSchema>;
export type Bet = z.infer<typeof BetSchema>;
export type RegisterBetsBatch = z.infer<typeof RegisterBetsBatchSchema>;
export type UpdateBetsBatch = z.infer<typeof UpdateBetsBatchSchema>;
export type BetRegistrationBatch = z.infer<typeof BetRegistrationBatchSchema>;
export type BetBatchSummary = z.infer<typeof BetBatchSummarySchema>;
export type BetPromotionContext = z.infer<typeof BetPromotionContextSchema>;
export type BetBatchListInput = z.infer<typeof BetBatchListInputSchema>;
export type BetListItem = z.infer<typeof BetListItemSchema>;
export type BetListInput = z.infer<typeof BetListInputSchema>;
export type AvailableRewardUsageContext = z.infer<typeof AvailableRewardUsageContextSchema>;
export type AvailableQualifyRewardOption = z.infer<typeof AvailableQualifyRewardOptionSchema>;
export type AvailableQualifyTrackingContext = z.infer<
  typeof AvailableQualifyTrackingContextSchema
>;
export type AvailablePromotionContexts = z.infer<typeof AvailablePromotionContextsSchema>;
export type BetDashboardTotals = z.infer<typeof BetDashboardTotalsSchema>;
export type DeleteBetBatchResult = z.infer<typeof DeleteBetBatchResultSchema>;

export type BetListMetadata = z.infer<typeof BetListMetadataSchema>;
export type BetListResponse = z.infer<typeof BetListResponseSchema>;

// =============================================
// VALIDATION HELPERS
// =============================================

function validateStrategyContext(
  value: z.infer<typeof NoStrategyContextSchema> | z.infer<typeof HedgeStrategyContextSchemaBase>,
  ctx: z.RefinementCtx,
) {
  if (value.kind !== 'HEDGE') {
    return;
  }

  if (value.lineMode !== 'SINGLE' && value.mode !== 'STANDARD') {
    ctx.addIssue({
      code: 'custom',
      message: 'Las combinadas solo admiten mode=STANDARD.',
      path: ['mode'],
    });
  }

  if (value.strategyType === 'MATCHED_BETTING' && value.dutchingOptionsCount !== undefined) {
    ctx.addIssue({
      code: 'custom',
      message: 'dutchingOptionsCount solo aplica a DUTCHING + SINGLE.',
      path: ['dutchingOptionsCount'],
    });
  }

  if (value.strategyType === 'DUTCHING' && value.lineMode === 'SINGLE' && !value.dutchingOptionsCount) {
    ctx.addIssue({
      code: 'custom',
      message: 'DUTCHING + SINGLE requiere dutchingOptionsCount (2 o 3).',
      path: ['dutchingOptionsCount'],
    });
  }

  if (value.strategyType === 'DUTCHING' && value.lineMode !== 'SINGLE' && value.dutchingOptionsCount) {
    ctx.addIssue({
      code: 'custom',
      message: 'dutchingOptionsCount no aplica a combinadas.',
      path: ['dutchingOptionsCount'],
    });
  }

  if (value.hedgeAdjustmentType && value.lineMode !== 'SINGLE') {
    ctx.addIssue({
      code: 'custom',
      message: 'hedgeAdjustmentType solo aplica a apuestas simples.',
      path: ['hedgeAdjustmentType'],
    });
  }

  if (value.hedgeAdjustmentType === 'UNMATCHED' && value.strategyType !== 'MATCHED_BETTING') {
    ctx.addIssue({
      code: 'custom',
      message: 'UNMATCHED solo aplica a MATCHED_BETTING.',
      path: ['hedgeAdjustmentType'],
    });
  }
}

function validateUpdateCalculationTarget(
  value: z.infer<typeof UpdateCalculationTargetSchema>,
  ctx: z.RefinementCtx,
) {
  const populatedFields =
    Number(value.participationId !== undefined) + Number(value.participationKey !== undefined);

  if (populatedFields !== 1) {
    ctx.addIssue({
      code: 'custom',
      message: 'UpdateCalculationTarget requiere exactamente uno de participationId o participationKey.',
      path: [],
    });
  }
}

function validatePromotionParticipation(
  value:
    | z.infer<typeof QualifyTrackingParticipationInputSchemaBase>
    | z.infer<typeof RewardUsageParticipationInputSchemaBase>,
  ctx: z.RefinementCtx,
) {
  if (value.kind === 'QUALIFY_TRACKING' && !value.rewardIds.includes(value.calculationRewardId)) {
    ctx.addIssue({
      code: 'custom',
      message: 'calculationRewardId debe pertenecer a rewardIds.',
      path: ['calculationRewardId'],
    });
  }

  if (value.kind === 'REWARD_USAGE' && value.rewardType === 'CASINO_SPINS') {
    ctx.addIssue({
      code: 'custom',
      message: 'CASINO_SPINS no es un rewardType valido para REWARD_USAGE en bets.',
      path: ['rewardType'],
    });
  }
}

export function deriveScenarioPromoAction(
  participation?: Pick<PromotionParticipationInput, 'kind' | 'rewardType'>,
): ScenarioPromoAction {
  if (!participation) {
    return 'NO_PROMO';
  }

  if (participation.kind === 'QUALIFY_TRACKING' && participation.rewardType === 'FREEBET') {
    return 'GENERATE_FREEBET';
  }

  if (
    participation.kind === 'REWARD_USAGE' &&
    (participation.rewardType === 'FREEBET' ||
      participation.rewardType === 'CASHBACK_FREEBET')
  ) {
    return 'USE_FREEBET';
  }

  return 'NO_PROMO';
}

function validateBatch(
  batch: RegisterBetsBatch | UpdateBetsBatch,
  ctx: z.RefinementCtx,
  mode: 'create' | 'update',
) {
  validateEventCardinality(batch, ctx);
  validateLegOrders(batch.legs, ctx);
  validateParticipationKeys(batch.legs, ctx);
  validateTrackingContributionUniqueness(batch.legs, ctx);
  validateSelections(batch, ctx);

  const hasParticipations = batch.legs.some((leg) => leg.participations.length > 0);

  if (batch.strategy.kind === 'NONE') {
    validateNoneStrategyBatch(batch, ctx);
    return;
  }

  if (mode === 'create' && batch.strategy.hedgeAdjustmentType) {
    ctx.addIssue({
      code: 'custom',
      message: 'hedgeAdjustmentType solo se admite en updateBatch.',
      path: ['strategy', 'hedgeAdjustmentType'],
    });
  }

  if (!batch.calculation.scenarioId) {
    ctx.addIssue({
      code: 'custom',
      message: 'scenarioId es obligatorio cuando strategy.kind=HEDGE.',
      path: ['calculation', 'scenarioId'],
    });
  }

  if (hasParticipations && !batch.calculation.target) {
    ctx.addIssue({
      code: 'custom',
      message: 'Con participaciones promocionales se requiere calculation.target.',
      path: ['calculation', 'target'],
    });
  }

  if (!hasParticipations && batch.calculation.target) {
    ctx.addIssue({
      code: 'custom',
      message: 'No puede existir calculation.target si el batch no tiene participaciones.',
      path: ['calculation', 'target'],
    });
  }

  validateHedgeLegShape(batch, ctx, mode);
  validateScenarioCoherence(batch, ctx);
}

function validateEventCardinality(
  batch: RegisterBetsBatch | UpdateBetsBatch,
  ctx: z.RefinementCtx,
) {
  const expectedEvents = getExpectedEventCount(batch.strategy);

  if (batch.events.length !== expectedEvents) {
    ctx.addIssue({
      code: 'custom',
      message: `events debe contener exactamente ${expectedEvents} elemento(s) para la estrategia actual.`,
      path: ['events'],
    });
  }

  if (
    batch.strategy.kind === 'HEDGE' &&
    batch.strategy.strategyType === 'DUTCHING' &&
    batch.strategy.lineMode === 'SINGLE'
  ) {
    const eventOptions = batch.events[0]?.eventOptions;

    if (eventOptions === 'MULTIPLE_OPTIONS') {
      ctx.addIssue({
        code: 'custom',
        message: 'DUTCHING + SINGLE no soporta MULTIPLE_OPTIONS.',
        path: ['events', 0, 'eventOptions'],
      });
    }

    const derivedOptionsCount =
      eventOptions === 'TWO_OPTIONS' ? 2 : eventOptions === 'THREE_OPTIONS' ? 3 : undefined;

    if (
      derivedOptionsCount !== undefined &&
      batch.strategy.dutchingOptionsCount !== derivedOptionsCount
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'dutchingOptionsCount debe coincidir con eventOptions del evento.',
        path: ['strategy', 'dutchingOptionsCount'],
      });
    }
  }
}

function validateLegOrders(
  legs: ReadonlyArray<BetLegInput | UpdateBetLegInput>,
  ctx: z.RefinementCtx,
) {
  const seenLegOrders = new Map<number, number>();

  legs.forEach((leg, legIndex) => {
    const previousIndex = seenLegOrders.get(leg.legOrder);

    if (previousIndex !== undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'No se puede repetir legOrder dentro del mismo batch.',
        path: ['legs', legIndex, 'legOrder'],
      });
    } else {
      seenLegOrders.set(leg.legOrder, legIndex);
    }
  });
}

function validateParticipationKeys(
  legs: ReadonlyArray<BetLegInput | UpdateBetLegInput>,
  ctx: z.RefinementCtx,
) {
  const seenKeys = new Map<string, { legIndex: number; participationIndex: number }>();

  legs.forEach((leg, legIndex) => {
    leg.participations.forEach((participation, participationIndex) => {
      const previous = seenKeys.get(participation.participationKey);

      if (previous) {
        ctx.addIssue({
          code: 'custom',
          message: 'participationKey debe ser unico dentro del batch.',
          path: ['legs', legIndex, 'participations', participationIndex, 'participationKey'],
        });
      } else {
        seenKeys.set(participation.participationKey, { legIndex, participationIndex });
      }
    });
  });
}

function validateTrackingContributionUniqueness(
  legs: ReadonlyArray<BetLegInput | UpdateBetLegInput>,
  ctx: z.RefinementCtx,
) {
  const objectiveMap = new Map<string, number>();

  legs.forEach((leg, legIndex) => {
    leg.participations.forEach((participation, participationIndex) => {
      const objectiveKey =
        participation.kind === 'QUALIFY_TRACKING'
          ? `QUALIFY_TRACKING:${participation.qualifyConditionId}`
          : `REWARD_USAGE:${participation.usageTrackingId}`;

      const nextCount = objectiveMap.get(objectiveKey) ?? 0;
      objectiveMap.set(objectiveKey, nextCount + (participation.contributesToTracking ? 1 : 0));

      if (
        participation.kind === 'QUALIFY_TRACKING' &&
        !participation.rewardIds.includes(participation.calculationRewardId)
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'calculationRewardId debe pertenecer a rewardIds.',
          path: ['legs', legIndex, 'participations', participationIndex, 'calculationRewardId'],
        });
      }
    });
  });

  objectiveMap.forEach((contributingCount, objectiveKey) => {
    if (contributingCount !== 1) {
      ctx.addIssue({
        code: 'custom',
        message: `Cada objetivo de tracking debe tener exactamente una participacion con contributesToTracking=true. Objetivo afectado: ${objectiveKey}.`,
        path: ['legs'],
      });
    }
  });
}

function validateSelections(
  batch: RegisterBetsBatch | UpdateBetsBatch,
  ctx: z.RefinementCtx,
) {
  const isCombined = batch.strategy.kind === 'HEDGE' && batch.strategy.lineMode !== 'SINGLE';

  batch.legs.forEach((leg, legIndex) => {
    const eventIndexes = new Set<number>();

    leg.selections.forEach((selection, selectionIndex) => {
      if (selection.eventIndex >= batch.events.length) {
        ctx.addIssue({
          code: 'custom',
          message: 'eventIndex fuera de rango para events[].',
          path: ['legs', legIndex, 'selections', selectionIndex, 'eventIndex'],
        });
      }

      if (eventIndexes.has(selection.eventIndex)) {
        ctx.addIssue({
          code: 'custom',
          message: 'No se puede repetir eventIndex dentro de la misma leg.',
          path: ['legs', legIndex, 'selections', selectionIndex, 'eventIndex'],
        });
      } else {
        eventIndexes.add(selection.eventIndex);
      }
    });

    if (!isCombined) {
      if (leg.selections.length !== 1) {
        ctx.addIssue({
          code: 'custom',
          message: 'Las apuestas SINGLE o strategy.kind=NONE deben tener exactamente una seleccion.',
          path: ['legs', legIndex, 'selections'],
        });
      }

      leg.selections.forEach((selection, selectionIndex) => {
        if (selection.odds !== undefined) {
          ctx.addIssue({
            code: 'custom',
            message: 'odds por seleccion solo aplica a la MAIN leg de combinadas.',
            path: ['legs', legIndex, 'selections', selectionIndex, 'odds'],
          });
        }
      });

      return;
    }

    if (leg.legRole === 'MAIN') {
      if (leg.selections.length !== batch.events.length) {
        ctx.addIssue({
          code: 'custom',
          message: 'La MAIN leg de una combinada debe cubrir todos los eventos del batch.',
          path: ['legs', legIndex, 'selections'],
        });
      }

      leg.selections.forEach((selection, selectionIndex) => {
        if (selection.odds === undefined) {
          ctx.addIssue({
            code: 'custom',
            message: 'Cada seleccion de la MAIN leg combinada requiere odds individual.',
            path: ['legs', legIndex, 'selections', selectionIndex, 'odds'],
          });
        }
      });
    } else {
      if (leg.selections.length !== 1) {
        ctx.addIssue({
          code: 'custom',
          message: 'Las hedge legs de una combinada deben tener exactamente una seleccion.',
          path: ['legs', legIndex, 'selections'],
        });
      }

      leg.selections.forEach((selection, selectionIndex) => {
        if (selection.odds !== undefined) {
          ctx.addIssue({
            code: 'custom',
            message: 'Las hedge legs no deben repetir odds individual por seleccion.',
            path: ['legs', legIndex, 'selections', selectionIndex, 'odds'],
          });
        }
      });
    }
  });
}

function validateNoneStrategyBatch(
  batch: RegisterBetsBatch | UpdateBetsBatch,
  ctx: z.RefinementCtx,
) {
  if (batch.legs.length !== 1) {
    ctx.addIssue({
      code: 'custom',
      message: 'strategy.kind=NONE solo admite una leg.',
      path: ['legs'],
    });
  }

  batch.legs.forEach((leg, legIndex) => {
    if (leg.legRole !== undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'strategy.kind=NONE no admite legRole.',
        path: ['legs', legIndex, 'legRole'],
      });
    }
  });

  if (batch.calculation.scenarioId !== undefined) {
    ctx.addIssue({
      code: 'custom',
      message: 'strategy.kind=NONE no usa scenarioId.',
      path: ['calculation', 'scenarioId'],
    });
  }

  if (batch.calculation.target !== undefined) {
    ctx.addIssue({
      code: 'custom',
      message: 'strategy.kind=NONE no usa calculation.target.',
      path: ['calculation', 'target'],
    });
  }
}

function validateHedgeLegShape(
  batch: RegisterBetsBatch | UpdateBetsBatch,
  ctx: z.RefinementCtx,
  mode: 'create' | 'update',
) {
  if (batch.strategy.kind !== 'HEDGE') {
    return;
  }

  batch.legs.forEach((leg, legIndex) => {
    if (!leg.legRole) {
      ctx.addIssue({
        code: 'custom',
        message: 'Con strategy.kind=HEDGE cada leg debe informar legRole.',
        path: ['legs', legIndex, 'legRole'],
      });
    }
  });

  const expectedLegRoles = getExpectedLegRoles(batch.strategy, mode);

  if (!expectedLegRoles) {
    return;
  }

  if (batch.legs.length !== expectedLegRoles.length) {
    ctx.addIssue({
      code: 'custom',
      message: `La estrategia actual requiere ${expectedLegRoles.length} legs (${expectedLegRoles.join(', ')}).`,
      path: ['legs'],
    });
  }

  const actualLegRoles = batch.legs
    .map((leg) => leg.legRole)
    .filter((legRole): legRole is z.infer<typeof LegRoleSchema> => legRole !== undefined)
    .sort();
  const normalizedExpectedLegRoles = [...expectedLegRoles].sort();

  if (normalizedExpectedLegRoles.join('|') !== actualLegRoles.join('|')) {
    ctx.addIssue({
      code: 'custom',
      message: `Las legs deben usar exactamente los roles ${expectedLegRoles.join(', ')}.`,
      path: ['legs'],
    });
  }
}

function validateScenarioCoherence(
  batch: RegisterBetsBatch | UpdateBetsBatch,
  ctx: z.RefinementCtx,
) {
  if (batch.strategy.kind !== 'HEDGE' || !batch.calculation.scenarioId) {
    return;
  }

  const compatibleScenarioExists = hasCompatibleScenario(batch.strategy);

  if (!compatibleScenarioExists) {
    ctx.addIssue({
      code: 'custom',
      message: 'La combinacion actual de estrategia no corresponde a ningun scenarioId soportado por el motor.',
      path: ['calculation', 'scenarioId'],
    });
    return;
  }

  const targetParticipation = resolveTargetParticipation(batch);
  const promoAction =
    targetParticipation || !batch.legs.some((leg) => leg.participations.length > 0)
      ? deriveScenarioPromoAction(targetParticipation)
      : undefined;

  const exactScenarioId =
    promoAction === undefined
      ? undefined
      : getScenarioId({
          strategyType: batch.strategy.strategyType,
          lineMode: batch.strategy.lineMode,
          mode: batch.strategy.mode,
          promoAction,
          dutchingOptionsCount: batch.strategy.dutchingOptionsCount,
          hedgeAdjustmentType: batch.strategy.hedgeAdjustmentType,
        });

  if (promoAction !== undefined && !exactScenarioId) {
    ctx.addIssue({
      code: 'custom',
      message: 'La configuracion actual no tiene una formula de calculo soportada en el catalogo de 41 escenarios.',
      path: ['calculation', 'scenarioId'],
    });
    return;
  }

  if (exactScenarioId && batch.calculation.scenarioId !== exactScenarioId) {
    ctx.addIssue({
      code: 'custom',
      message: `scenarioId incoherente. Se esperaba ${exactScenarioId} para la estrategia/target actual.`,
      path: ['calculation', 'scenarioId'],
    });
  }

  if (!isScenarioCompatibleWithStrategy(batch.calculation.scenarioId, batch.strategy, promoAction)) {
    ctx.addIssue({
      code: 'custom',
      message: 'scenarioId no es compatible con la configuracion de strategy.',
      path: ['calculation', 'scenarioId'],
    });
  }

  if (batch.calculation.target?.participationKey) {
    const targetFound = Boolean(targetParticipation);

    if (!targetFound) {
      ctx.addIssue({
        code: 'custom',
        message: 'calculation.target.participationKey no resuelve a ninguna participacion del payload.',
        path: ['calculation', 'target', 'participationKey'],
      });
    }
  }

  if (exactScenarioId) {
    const legShapeValidation = validateLegShapeByScenario(exactScenarioId, batch.legs);

    legShapeValidation.issues.forEach((issue) => {
      ctx.addIssue({
        code: 'custom',
        message: issue,
        path: ['legs'],
      });
    });
  }
}

function resolveTargetParticipation(
  batch: RegisterBetsBatch | UpdateBetsBatch,
): PromotionParticipationInput | undefined {
  const target = batch.calculation.target;

  if (!target || !('participationKey' in target) || !target.participationKey) {
    return undefined;
  }

  return batch.legs
    .flatMap((leg) => leg.participations)
    .find((participation) => participation.participationKey === target.participationKey);
}

function getExpectedLegRoles(
  strategy: HedgeStrategyContext,
  mode: 'create' | 'update',
): readonly (typeof DefaultLegRoleOrder)[number][] | undefined {
  const baseLegCount = getBaseLegCount(strategy);

  if (!baseLegCount) {
    return undefined;
  }

  const totalLegCount = baseLegCount + (mode === 'update' && strategy.hedgeAdjustmentType ? 1 : 0);
  return DefaultLegRoleOrder.slice(0, totalLegCount);
}

function getBaseLegCount(strategy: HedgeStrategyContext): number | undefined {
  if (strategy.strategyType === 'MATCHED_BETTING') {
    return strategy.lineMode === 'SINGLE'
      ? 2
      : strategy.lineMode === 'COMBINED_2'
        ? 3
        : 4;
  }

  if (strategy.lineMode === 'SINGLE') {
    return strategy.dutchingOptionsCount;
  }

  return strategy.lineMode === 'COMBINED_2' ? 3 : 4;
}

export function getExpectedEventCount(strategy: StrategyContext): number {
  if (strategy.kind === 'NONE' || strategy.lineMode === 'SINGLE') {
    return 1;
  }

  return strategy.lineMode === 'COMBINED_2' ? 2 : 3;
}

export function getExpectedLegRolesForStrategy(
  strategy: HedgeStrategyContext,
  operation: 'create' | 'update' = 'create',
): readonly (typeof DefaultLegRoleOrder)[number][] {
  return getExpectedLegRoles(strategy, operation) ?? [];
}

function hasCompatibleScenario(strategy: HedgeStrategyContext): boolean {
  return SupportedPromoActions.some((promoAction) =>
    Boolean(
      getScenarioId({
        strategyType: strategy.strategyType,
        lineMode: strategy.lineMode,
        mode: strategy.mode,
        promoAction,
        dutchingOptionsCount: strategy.dutchingOptionsCount,
        hedgeAdjustmentType: strategy.hedgeAdjustmentType,
      }),
    ),
  );
}

function isScenarioCompatibleWithStrategy(
  scenarioId: ScenarioIdValue,
  strategy: HedgeStrategyContext,
  promoAction?: ScenarioPromoAction,
): boolean {
  const descriptor = getScenarioId({
    strategyType: strategy.strategyType,
    lineMode: strategy.lineMode,
    mode: strategy.mode,
    promoAction: promoAction ?? 'NO_PROMO',
    dutchingOptionsCount: strategy.dutchingOptionsCount,
    hedgeAdjustmentType: strategy.hedgeAdjustmentType,
  });

  if (promoAction !== undefined) {
    return descriptor === scenarioId;
  }

  const expectedScenarioForAnyPromo = SupportedPromoActions.map((candidatePromoAction) =>
    getScenarioId({
      strategyType: strategy.strategyType,
      lineMode: strategy.lineMode,
      mode: strategy.mode,
      promoAction: candidatePromoAction,
      dutchingOptionsCount: strategy.dutchingOptionsCount,
      hedgeAdjustmentType: strategy.hedgeAdjustmentType,
    }),
  );

  return expectedScenarioForAnyPromo.includes(scenarioId);
}

// Re-export relevant enum schemas for consumers that use bet.schema as entrypoint.
export {
  BetLineModeSchema,
  BetParticipationKindSchema,
  BetStatusSchema,
  HedgeAdjustmentTypeSchema,
  HedgeModeSchema,
  LegRoleSchema,
  OptionsSchema,
  RewardTypeSchema,
  ScenarioIdSchema,
  StrategyTypeSchema,
};

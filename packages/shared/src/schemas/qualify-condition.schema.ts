/**
 * Qualify Condition Schemas
 * Arquitectura modular: Base + Conditions específicas por tipo
 */

import { z } from 'zod';

import { QualifyConditionStatusSchema, CashbackCalculationMethodSchema } from './enums';
import { requiredInteger, requiredNumber } from './utils';
import { TimeframeSchema } from './timeframe.schema';
import { PaginationInputSchema } from './pagination.schema';
import {
  OddsRestrictionSchema,
  StakeRestrictionSchema,
  MultipleBetConditionSchema,
  RequiredBetOutcomeSchema,
} from './bet-conditions.schema';
import {
  DepositQualifyTrackingSchema,
  BetQualifyTrackingSchema,
  LossesCashbackQualifyTrackingSchema,
} from './qualify-tracking.schema';

// =============================================
// REUSABLE TIMESTAMP SCHEMAS
// =============================================

/**
 * Timestamps de auditoría (comunes a TODAS las entidades)
 */
const AuditTimestampsSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Timestamps de estado para QualifyCondition
 * Estos representan eventos que pueden usarse como anchors en timeframes relativos
 */
const QualifyConditionStateTimestampsSchema = z.object({
  startedAt: z.date().nullable(),
  qualifiedAt: z.date().nullable(),
  failedAt: z.date().nullable(),
  expiredAt: z.date().nullable(),
});

/**
 * Campos comunes de BD para TODAS las QualifyCondition entities
 */
const QualifyConditionEntityCommonFieldsSchema = z.object({
  id: z.string(),
  status: QualifyConditionStatusSchema,
  promotionId: z.string(),
  canDelete: z.boolean(),
  balance: z.number(),
  timeframeStart: z.date().nullable().optional(),
  timeframeEnd: z.date().nullable().optional(),
});

const QualifyConditionLinkedRewardSchema = z.object({
  id: z.string(),
  type: z.enum([
    'FREEBET',
    'CASHBACK_FREEBET',
    'BET_BONUS_ROLLOVER',
    'BET_BONUS_NO_ROLLOVER',
    'ENHANCED_ODDS',
    'CASINO_SPINS',
  ]),
  status: z.enum([
    'QUALIFYING',
    'PENDING_TO_CLAIM',
    'CLAIMED',
    'RECEIVED',
    'IN_USE',
    'USED',
    'EXPIRED',
  ]),
  phaseId: z.string(),
  phaseIndex: z.number().int().min(0).optional(),
  phaseName: z.string().optional(),
  phaseStatus: z.enum(['NOT_STARTED', 'ACTIVE', 'COMPLETED', 'EXPIRED']),
  promotionStatus: z.enum(['NOT_STARTED', 'ACTIVE', 'COMPLETED', 'EXPIRED']),
});

const QualifyConditionTrackingStatsSchema = z.object({
  totalParticipations: z.number(),
  betParticipations: z.number(),
  depositParticipations: z.number(),
});

const QualifyConditionTrackingSummarySchema = z.object({
  current: z.number().int().min(0).optional(),
  target: z.number().int().min(0).optional(),
  label: z.string().optional(),
});

// =============================================
// BASE SCHEMA - Campos comunes a todos los tipos
// =============================================

/**
 * Schema base con campos comunes a todas las QualifyConditions
 * (para formularios - sin id, timestamps, etc.)
 * Usa .nullish() para campos opcionales que vienen de Prisma (null) o formularios (undefined)
 *
 * NOTA: contributesToRewardValue NO está aquí - solo existe dentro de conditions como discriminador
 */
const BaseQualifyConditionSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().uuid().optional(),
  description: z.string().nullish(),
  status: QualifyConditionStatusSchema.optional(),
  statusDate: z.date(), // Nueva propiedad para tracking histórico
  timeframe: TimeframeSchema,
}).refine((value) => Boolean(value.id || value.clientId), {
  message: 'QualifyCondition requires id or clientId',
  path: ['id'],
});

// =============================================
// CONDITIONS SCHEMAS - Campos específicos por tipo
// =============================================

/**
 * Schema BASE para DEPOSIT Qualify Conditions
 * Campos comunes independientemente del tipo de valor
 */
const BaseDepositConditionsSchema = z.object({
  depositCode: z.string().optional(),
  firstDepositOnly: z.boolean().optional(),
  otherRestrictions: z.string().optional(),
});

/**
 * DEPOSIT Qualify Condition - Valor FIXED
 * Ejemplo: "Deposita 50€ exactos y recibe una freebet de 10€"
 */
export const DepositConditionsFixedValueSchema = BaseDepositConditionsSchema.extend({
  contributesToRewardValue: z.literal(false),
  targetAmount: requiredNumber(0), // Depósito exacto requerido
});

/**
 * DEPOSIT Qualify Condition - Valor CALCULATED
 * Ejemplo: "Deposita mínimo 20€, recibe 100% de bonus, máximo 50€"
 */
export const DepositConditionsCalculatedValueSchema = BaseDepositConditionsSchema.extend({
  contributesToRewardValue: z.literal(true),
  minAmount: requiredNumber(0),
  maxAmount: z.number().min(0).optional(),
  bonusPercentage: requiredNumber(0),
  maxBonusAmount: requiredNumber(0),
});

/**
 * Campos específicos de DEPOSIT (van dentro de campo JSON "conditions" en Prisma)
 * DISCRIMINATED UNION: Diferentes campos según si contribuye al valor de la reward
 */
export const DepositConditionsSchema = z.discriminatedUnion('contributesToRewardValue', [
  DepositConditionsFixedValueSchema,
  DepositConditionsCalculatedValueSchema,
]);

/**
 * Schema BASE para BET Qualify Conditions
 * Campos comunes independientemente del tipo de valor
 */
const BaseBetConditionsSchema = z.object({
  // Campos propios de Qualify
  allowRetries: z.boolean(),
  maxAttempts: z.number().min(1).optional(),

  // Restricciones de cuotas (común a ambos tipos)
  oddsRestriction: OddsRestrictionSchema.optional(),

  // Resultado requerido
  requiredBetOutcome: RequiredBetOutcomeSchema,

  // Apuestas combinadas
  allowMultipleBets: z.boolean().optional(),
  multipleBetCondition: MultipleBetConditionSchema.optional(),

  // Opciones de comportamiento
  allowLiveOddsChanges: z.boolean().optional(),
  onlyFirstBetCounts: z.boolean().optional(),

  // Restricciones de texto libre
  betTypeRestrictions: z.string().optional(),
  selectionRestrictions: z.string().optional(),
  otherRestrictions: z.string().optional(),
});

/**
 * BET Qualify Condition - Valor FIXED
 * Ejemplo: "Apuesta 50€ y recibe una freebet de 10€"
 */
export const BetConditionsFixedValueSchema = BaseBetConditionsSchema.extend({
  contributesToRewardValue: z.literal(false),
  targetStake: requiredInteger(0),
});

/**
 * BET Qualify Condition - Valor CALCULATED
 * Ejemplo: "Apuesta mínimo 10€, recibe 50% de cashback si pierdes, máximo 50€"
 */
export const BetConditionsCalculatedValueSchema = BaseBetConditionsSchema.extend({
  contributesToRewardValue: z.literal(true),

  // Restricciones de stake (rango)
  stakeRestriction: z.object({
    minStake: requiredInteger(0),
    maxStake: z
      .number()
      .int('El stake máximo debe ser un número entero')
      .min(0)
      .optional(),
  }),

  // Cálculo del valor de la reward
  returnPercentage: requiredNumber(0),
  maxRewardAmount: requiredNumber(0),
});

/**
 * Campos específicos de BET (van dentro de campo JSON "conditions" en Prisma)
 * DISCRIMINATED UNION: Diferentes campos según si contribuye al valor de la reward
 */
export const BetConditionsSpecificSchema = z.discriminatedUnion('contributesToRewardValue', [
  BetConditionsFixedValueSchema,
  BetConditionsCalculatedValueSchema,
]);

/**
 * Campos específicos de LOSSES_CASHBACK (van dentro de campo JSON "conditions" en Prisma)
 * APLANADO: Incluye campos de BetConditionsSchema directamente (opcionales)
 */
export const LossesCashbackConditionsSchema = z.object({
  cashbackPercentage: z
    .number()
    .int('El porcentaje de cashback debe ser un numero entero')
    .min(0, 'El porcentaje de cashback no puede ser menor que 0')
    .max(100, 'El porcentaje de cashback no puede ser mayor que 100')
    .optional()
    .refine((val): val is number => val !== undefined, {
      message: 'Este campo es obligatorio',
    })
    .transform((val) => val),
  maxCashbackAmount: requiredNumber(0),
  calculationMethod: CashbackCalculationMethodSchema,
  calculationPeriod: z.string().optional(),
  returnedBetsCountForCashback: z.boolean().optional(),
  cashoutBetsCountForCashback: z.boolean().optional(),
  countOnlySettledBets: z.boolean().optional(),

  // Campos aplanados de BetConditionsSchema (Opcionales para Cashback)
  oddsRestriction: OddsRestrictionSchema.optional(),
  stakeRestriction: StakeRestrictionSchema.optional(),
  requiredBetOutcome: RequiredBetOutcomeSchema.optional(),
  allowMultipleBets: z.boolean().optional(),
  multipleBetCondition: MultipleBetConditionSchema.optional(),
  allowLiveOddsChanges: z.boolean().optional(),
  betTypeRestrictions: z.string().optional(),
  selectionRestrictions: z.string().optional(),
  onlyFirstBetCounts: z.boolean().optional(),
  otherRestrictions: z.string().optional(),
});

// =============================================
// QUALIFY CONDITION SCHEMAS (INPUT) - Para formularios y CREATE/UPDATE
// =============================================

/**
 * Schema de INPUT - Sin tracking (calculado por backend)
 */
export const DepositQualifyConditionSchema = BaseQualifyConditionSchema.safeExtend({
  type: z.literal('DEPOSIT'),
  conditions: DepositConditionsSchema,
});

/**
 * Schema de INPUT - Sin tracking (calculado por backend)
 */
export const BetQualifyConditionSchema = BaseQualifyConditionSchema.safeExtend({
  type: z.literal('BET'),
  conditions: BetConditionsSpecificSchema,
});

/**
 * Schema de INPUT - Sin tracking (calculado por backend)
 */
export const LossesCashbackQualifyConditionSchema = BaseQualifyConditionSchema.safeExtend({
  type: z.literal('LOSSES_CASHBACK'),
  conditions: LossesCashbackConditionsSchema,
});

// =============================================
// ENTITY SCHEMAS (OUTPUT) - Para outputs de API con tracking calculado por backend
// =============================================

/**
 * Schema de OUTPUT - Con tracking calculado por backend
 */
export const DepositQualifyConditionEntitySchema = DepositQualifyConditionSchema.safeExtend({
  tracking: DepositQualifyTrackingSchema.nullable(), // ✅ Tracking solo en OUTPUT
  linkedRewards: z.array(QualifyConditionLinkedRewardSchema).default([]),
  trackingStats: QualifyConditionTrackingStatsSchema,
  promotionName: z.string().min(1).optional(),
  trackingSummary: QualifyConditionTrackingSummarySchema.optional(),
  ...QualifyConditionEntityCommonFieldsSchema.shape,
  ...QualifyConditionStateTimestampsSchema.shape,
  ...AuditTimestampsSchema.shape,
});

/**
 * Schema de OUTPUT - Con tracking calculado por backend
 */
export const BetQualifyConditionEntitySchema = BetQualifyConditionSchema.safeExtend({
  tracking: BetQualifyTrackingSchema.nullable(), // ✅ Tracking solo en OUTPUT
  linkedRewards: z.array(QualifyConditionLinkedRewardSchema).default([]),
  trackingStats: QualifyConditionTrackingStatsSchema,
  promotionName: z.string().min(1).optional(),
  trackingSummary: QualifyConditionTrackingSummarySchema.optional(),
  ...QualifyConditionEntityCommonFieldsSchema.shape,
  ...QualifyConditionStateTimestampsSchema.shape,
  ...AuditTimestampsSchema.shape,
});

/**
 * Schema de OUTPUT - Con tracking calculado por backend
 */
export const LossesCashbackQualifyConditionEntitySchema = LossesCashbackQualifyConditionSchema.safeExtend({
  tracking: LossesCashbackQualifyTrackingSchema.nullable(), // ✅ Tracking solo en OUTPUT
  linkedRewards: z.array(QualifyConditionLinkedRewardSchema).default([]),
  trackingStats: QualifyConditionTrackingStatsSchema,
  promotionName: z.string().min(1).optional(),
  trackingSummary: QualifyConditionTrackingSummarySchema.optional(),
  ...QualifyConditionEntityCommonFieldsSchema.shape,
  ...QualifyConditionStateTimestampsSchema.shape,
  ...AuditTimestampsSchema.shape,
});

// =============================================
// DISCRIMINATED UNIONS
// =============================================

export const QualifyConditionSchema = z.discriminatedUnion('type', [
  DepositQualifyConditionSchema,
  BetQualifyConditionSchema,
  LossesCashbackQualifyConditionSchema,
]);

export const QualifyConditionEntitySchema = z.union([
  DepositQualifyConditionEntitySchema,
  BetQualifyConditionEntitySchema,
  LossesCashbackQualifyConditionEntitySchema,
]);

export const UpdateQualifyConditionInputSchema = z.object({
  id: z.string(),
  data: QualifyConditionSchema,
});

export const CreateQualifyConditionForRewardInputSchema = z.object({
  rewardId: z.string().min(1),
  data: QualifyConditionSchema,
});

export const QualifyConditionListInputSchema = PaginationInputSchema.extend({
  status: QualifyConditionStatusSchema.optional(),
  type: z.enum(['DEPOSIT', 'BET', 'LOSSES_CASHBACK']).optional(),
  promotionId: z.string().optional(),
});

// =============================================
// INFERRED TYPES
// =============================================

// DEPOSIT Qualify Condition - Tipos discriminados
export type DepositConditionsFixedValue = z.infer<typeof DepositConditionsFixedValueSchema>;
export type DepositConditionsCalculatedValue = z.infer<typeof DepositConditionsCalculatedValueSchema>;
export type DepositConditionsSpecific = z.infer<typeof DepositConditionsSchema>;
export type DepositQualifyCondition = z.infer<typeof DepositQualifyConditionSchema>;

// BET Qualify Condition - Tipos discriminados
export type BetConditionsFixedValue = z.infer<typeof BetConditionsFixedValueSchema>;
export type BetConditionsCalculatedValue = z.infer<typeof BetConditionsCalculatedValueSchema>;
export type BetConditionsSpecific = z.infer<typeof BetConditionsSpecificSchema>;
export type BetQualifyCondition = z.infer<typeof BetQualifyConditionSchema>;

export type LossesCashbackQualifyCondition = z.infer<typeof LossesCashbackQualifyConditionSchema>;
export type QualifyCondition = z.infer<typeof QualifyConditionSchema>;

export type DepositQualifyConditionEntity = z.infer<typeof DepositQualifyConditionEntitySchema>;
export type BetQualifyConditionEntity = z.infer<typeof BetQualifyConditionEntitySchema>;
export type LossesCashbackQualifyConditionEntity = z.infer<typeof LossesCashbackQualifyConditionEntitySchema>;
export type QualifyConditionEntity = z.infer<typeof QualifyConditionEntitySchema>;
export type QualifyConditionLinkedReward = z.infer<typeof QualifyConditionLinkedRewardSchema>;
export type QualifyConditionTrackingStats = z.infer<typeof QualifyConditionTrackingStatsSchema>;
export type QualifyConditionTrackingSummary = z.infer<
  typeof QualifyConditionTrackingSummarySchema
>;
export type CreateQualifyConditionForRewardInput = z.infer<
  typeof CreateQualifyConditionForRewardInputSchema
>;
export type UpdateQualifyConditionInput = z.infer<typeof UpdateQualifyConditionInputSchema>;
export type QualifyConditionListInput = z.infer<typeof QualifyConditionListInputSchema>;


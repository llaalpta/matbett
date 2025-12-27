/**
 * Qualify Condition Schemas
 * Arquitectura modular: Base + Conditions específicas por tipo
 */

import { z } from 'zod';

import { QualifyConditionStatusSchema, CashbackCalculationMethodSchema } from './enums';
import { requiredNumber } from './utils';
import { TimeframeSchema } from './timeframe.schema';
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
  phaseId: z.string(),
  balance: z.number(),
  // ❌ contributesToRewardValue removido - solo existe dentro de conditions como discriminador
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
  description: z.string().nullish(),
  otherRestrictions: z.string().nullish(),
  dependsOnQualifyConditionId: z.string().nullish(),
  status: QualifyConditionStatusSchema.optional(),
  statusDate: z.date().nullable().optional(), // Nueva propiedad para tracking histórico
  timeframe: TimeframeSchema,
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
});

/**
 * DEPOSIT Qualify Condition - Valor FIXED
 * Ejemplo: "Deposita 50€ exactos y recibe una freebet de 10€"
 */
export const DepositConditionsFixedValueSchema = BaseDepositConditionsSchema.extend({
  contributesToRewardValue: z.literal(false),
  targetAmount: requiredNumber(0), // Depósito exacto requerido
  // ❌ NO tiene minAmount, maxAmount, bonusPercentage, maxBonusAmount
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
  // ❌ NO tiene targetAmount
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
});

/**
 * BET Qualify Condition - Valor FIXED
 * Ejemplo: "Apuesta 50€ y recibe una freebet de 10€"
 */
export const BetConditionsFixedValueSchema = BaseBetConditionsSchema.extend({
  contributesToRewardValue: z.literal(false),
  targetStake: requiredNumber(0),
  // ❌ NO tiene stakeRestriction, returnPercentage, maxRewardAmount
});

/**
 * BET Qualify Condition - Valor CALCULATED
 * Ejemplo: "Apuesta mínimo 10€, recibe 50% de cashback si pierdes, máximo 50€"
 */
export const BetConditionsCalculatedValueSchema = BaseBetConditionsSchema.extend({
  contributesToRewardValue: z.literal(true),

  // Restricciones de stake (rango)
  stakeRestriction: z.object({
    minStake: requiredNumber(0),
    maxStake: z.number().min(0).optional(),
  }),

  // Cálculo del valor de la reward
  returnPercentage: requiredNumber(0),
  maxRewardAmount: requiredNumber(0),
  // ❌ NO tiene targetStake
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
  cashbackPercentage: requiredNumber(0),
  maxCashbackAmount: requiredNumber(0),
  calculationMethod: CashbackCalculationMethodSchema,
  calculationPeriod: z.string().optional(),
  
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
});

// =============================================
// QUALIFY CONDITION SCHEMAS (INPUT) - Para formularios y CREATE/UPDATE
// =============================================

/**
 * Schema de INPUT - Sin tracking (calculado por backend)
 */
export const DepositQualifyConditionSchema = BaseQualifyConditionSchema.extend({
  type: z.literal('DEPOSIT'),
  conditions: DepositConditionsSchema,
  // ❌ Sin tracking - solo en EntitySchema
});

/**
 * Schema de INPUT - Sin tracking (calculado por backend)
 */
export const BetQualifyConditionSchema = BaseQualifyConditionSchema.extend({
  type: z.literal('BET'),
  conditions: BetConditionsSpecificSchema,
  // ❌ Sin tracking - solo en EntitySchema
});

/**
 * Schema de INPUT - Sin tracking (calculado por backend)
 */
export const LossesCashbackQualifyConditionSchema = BaseQualifyConditionSchema.extend({
  type: z.literal('LOSSES_CASHBACK'),
  conditions: LossesCashbackConditionsSchema,
  // ❌ Sin tracking - solo en EntitySchema
});

// =============================================
// ENTITY SCHEMAS (OUTPUT) - Para outputs de API con tracking calculado por backend
// =============================================

/**
 * Schema de OUTPUT - Con tracking calculado por backend
 */
export const DepositQualifyConditionEntitySchema = DepositQualifyConditionSchema.extend({
  tracking: DepositQualifyTrackingSchema.nullable(), // ✅ Tracking solo en OUTPUT
  ...QualifyConditionEntityCommonFieldsSchema.shape,
  ...QualifyConditionStateTimestampsSchema.shape,
  ...AuditTimestampsSchema.shape,
});

/**
 * Schema de OUTPUT - Con tracking calculado por backend
 */
export const BetQualifyConditionEntitySchema = BetQualifyConditionSchema.extend({
  tracking: BetQualifyTrackingSchema.nullable(), // ✅ Tracking solo en OUTPUT
  ...QualifyConditionEntityCommonFieldsSchema.shape,
  ...QualifyConditionStateTimestampsSchema.shape,
  ...AuditTimestampsSchema.shape,
});

/**
 * Schema de OUTPUT - Con tracking calculado por backend
 */
export const LossesCashbackQualifyConditionEntitySchema = LossesCashbackQualifyConditionSchema.extend({
  tracking: LossesCashbackQualifyTrackingSchema.nullable(), // ✅ Tracking solo en OUTPUT
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

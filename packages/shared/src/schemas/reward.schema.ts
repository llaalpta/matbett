/**
 * Reward Schemas
 */

import { z } from 'zod';

import {
  ActivationMethodSchema,
  ClaimMethodSchema,
  RewardStatusSchema,
  RewardValueTypeSchema,
} from './enums';
import { requiredNumber } from './utils';
import { QualifyConditionSchema, QualifyConditionEntitySchema } from './qualify-condition.schema';
import {
  FreeBetUsageConditionsSchema,
  BonusRolloverUsageConditionsSchema,
  BonusNoRolloverUsageConditionsSchema,
  CashbackUsageConditionsSchema,
  EnhancedOddsUsageConditionsSchema,
  CasinoSpinsUsageConditionsSchema,
} from './usage-conditions.schema';
import {
  FreeBetUsageTrackingSchema,
  BonusRolloverUsageTrackingSchema,
  BonusNoRolloverUsageTrackingSchema,
  CashbackUsageTrackingSchema,
  EnhancedOddsUsageTrackingSchema,
  CasinoSpinsUsageTrackingSchema,
} from './usage-tracking.schema';
import { FreeBetTypeSpecificFieldsSchema } from './type-specific-fields.schema';

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
 * Timestamps de estado para Rewards
 * Estos representan eventos que pueden usarse como anchors en timeframes relativos
 */
const RewardStateTimestampsSchema = z.object({
  qualifyConditionsFulfilledAt: z.date().nullable(),
  claimedAt: z.date().nullable(),
  receivedAt: z.date().nullable(),
  useStartedAt: z.date().nullable(),
  useCompletedAt: z.date().nullable(),
  expiredAt: z.date().nullable(),
});

// =============================================
// BASE SCHEMA (INPUT) - Campos comunes a todos los rewards
// =============================================

/**
 * Schema base para INPUT - Campos comunes a todos los Rewards
 * Usado en formularios y CREATE/UPDATE - SIN usageTracking (calculado por backend)
 *
 * NOTA: El timeframe de la reward se determina por:
 * - Si tiene qualifyConditions: cada condición tiene su propio timeframe para calificar
 * - Si NO tiene qualifyConditions: hereda implícitamente el timeframe de PROMOTION/PHASE
 * - En ambos casos: usageConditions.timeframe determina el periodo de uso
 */
const BaseRewardSchema = z.object({
  id: z.string().optional(),
  value: requiredNumber(0),
  valueType: RewardValueTypeSchema,
  activationMethod: ActivationMethodSchema,
  claimMethod: ClaimMethodSchema,
  claimRestrictions: z.string().nullish(),
  status: RewardStatusSchema.optional(),
  statusDate: z.date().nullable().optional(), // Nueva propiedad para tracking histórico
  // ❌ timeframe eliminado - Ver nota arriba sobre arquitectura de timeframes
  qualifyConditions: z.array(QualifyConditionSchema).min(0),
});

/**
 * Campos comunes de BD para TODAS las Reward entities
 */
const RewardEntityCommonFieldsSchema = z.object({
  id: z.string(),
  status: RewardStatusSchema,
  phaseId: z.string(),
  promotionId: z.string().optional(), // ID de la promoción (solo cuando se consulta standalone, no en contexto anidado)
  totalBalance: z.number(),
});

// =============================================
// VALIDATION HELPERS
// =============================================

/**
 * Valida coherencia entre reward.valueType y qualifyConditions.contributesToRewardValue
 * Se aplica a todos los tipos de Reward con .superRefine()
 */
function validateRewardValueTypeCoherence(
  data: { valueType: string; qualifyConditions: any[] },
  ctx: z.RefinementCtx
) {
  const calculatingConditions = data.qualifyConditions.filter(
    qc => (qc.type === 'DEPOSIT' || qc.type === 'BET') &&
          qc.conditions.contributesToRewardValue === true
  );

  if (data.valueType === 'FIXED') {
    // FIXED: ninguna condition debe tener contributesToRewardValue: true
    if (calculatingConditions.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Las rewards de valor FIJO no pueden tener condiciones que calculen el valor',
        path: ['qualifyConditions'],
      });
    }
  }

  if (data.valueType === 'CALCULATED_FROM_CONDITIONS') {
    // CALCULATED: exactamente 1 condition debe tener contributesToRewardValue: true
    if (calculatingConditions.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Las rewards CALCULADAS deben tener exactamente una condición que defina el cálculo',
        path: ['qualifyConditions'],
      });
    } else if (calculatingConditions.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Las rewards CALCULADAS solo pueden tener UNA condición que defina el cálculo',
        path: ['qualifyConditions'],
      });
    }
  }
}

// =============================================
// REWARD SCHEMAS (INPUT) - Para formularios y CREATE/UPDATE
// =============================================

/**
 * Schema de INPUT - Sin usageTracking (calculado por backend)
 * NOTA: No aplicamos .superRefine() aquí porque estos schemas se extienden para crear EntitySchemas
 */
const FreeBetRewardSchemaBase = BaseRewardSchema.extend({
  type: z.literal('FREEBET'),
  typeSpecificFields: FreeBetTypeSpecificFieldsSchema, // SNR movido aquí
  usageConditions: FreeBetUsageConditionsSchema,
  // ❌ Sin usageTracking - solo en EntitySchema
});

/**
 * Schema de INPUT - Sin usageTracking (calculado por backend)
 */
const CashbackFreeBetRewardSchemaBase = BaseRewardSchema.extend({
  type: z.literal('CASHBACK_FREEBET'),
  typeSpecificFields: z.null().optional(), // Sin campos específicos
  usageConditions: CashbackUsageConditionsSchema,
  // ❌ Sin usageTracking - solo en EntitySchema
});

/**
 * Schema de INPUT - Sin usageTracking (calculado por backend)
 */
const BonusRolloverRewardSchemaBase = BaseRewardSchema.extend({
  type: z.literal('BET_BONUS_ROLLOVER'),
  typeSpecificFields: z.null().optional(), // Sin campos específicos
  usageConditions: BonusRolloverUsageConditionsSchema,
  // ❌ Sin usageTracking - solo en EntitySchema
});

/**
 * Schema de INPUT - Sin usageTracking (calculado por backend)
 */
const BonusNoRolloverRewardSchemaBase = BaseRewardSchema.extend({
  type: z.literal('BET_BONUS_NO_ROLLOVER'),
  typeSpecificFields: z.null().optional(), // Sin campos específicos
  usageConditions: BonusNoRolloverUsageConditionsSchema,
  // ❌ Sin usageTracking - solo en EntitySchema
});

/**
 * Schema de INPUT - Sin usageTracking (calculado por backend)
 */
const EnhancedOddsRewardSchemaBase = BaseRewardSchema.extend({
  type: z.literal('ENHANCED_ODDS'),
  typeSpecificFields: z.null().optional(), // Sin campos específicos
  usageConditions: EnhancedOddsUsageConditionsSchema,
  // ❌ Sin usageTracking - solo en EntitySchema
});

/**
 * Schema de INPUT - Sin usageTracking (calculado por backend)
 */
const CasinoSpinsRewardSchemaBase = BaseRewardSchema.extend({
  type: z.literal('CASINO_SPINS'),
  typeSpecificFields: z.null().optional(), // Sin campos específicos
  usageConditions: CasinoSpinsUsageConditionsSchema,
  // ❌ Sin usageTracking - solo en EntitySchema
});

// Aplicar validación a los schemas INPUT (con .superRefine())
export const FreeBetRewardSchema = FreeBetRewardSchemaBase.superRefine(validateRewardValueTypeCoherence);
export const CashbackFreeBetRewardSchema = CashbackFreeBetRewardSchemaBase.superRefine(validateRewardValueTypeCoherence);
export const BonusRolloverRewardSchema = BonusRolloverRewardSchemaBase.superRefine(validateRewardValueTypeCoherence);
export const BonusNoRolloverRewardSchema = BonusNoRolloverRewardSchemaBase.superRefine(validateRewardValueTypeCoherence);
export const EnhancedOddsRewardSchema = EnhancedOddsRewardSchemaBase.superRefine(validateRewardValueTypeCoherence);
export const CasinoSpinsRewardSchema = CasinoSpinsRewardSchemaBase.superRefine(validateRewardValueTypeCoherence);

// =============================================
// REWARD ENTITY SCHEMAS (OUTPUT) - Para outputs de API con usageTracking calculado
// =============================================

/**
 * Schema de OUTPUT - Con usageTracking calculado por backend
 */
export const FreeBetRewardEntitySchema = FreeBetRewardSchemaBase.extend({
  qualifyConditions: z.array(QualifyConditionEntitySchema).min(0), // ✅ Sobrescribir con EntitySchema (incluye tracking)
  usageTracking: FreeBetUsageTrackingSchema.nullable(), // ✅ Tracking solo en OUTPUT
  ...RewardEntityCommonFieldsSchema.shape,
  ...RewardStateTimestampsSchema.shape,
  ...AuditTimestampsSchema.shape,
}).superRefine(validateRewardValueTypeCoherence);

/**
 * Schema de OUTPUT - Con usageTracking calculado por backend
 */
export const CashbackFreeBetRewardEntitySchema = CashbackFreeBetRewardSchemaBase.extend({
  qualifyConditions: z.array(QualifyConditionEntitySchema).min(0), // ✅ Sobrescribir con EntitySchema (incluye tracking)
  usageTracking: CashbackUsageTrackingSchema.nullable(), // ✅ Tracking solo en OUTPUT
  ...RewardEntityCommonFieldsSchema.shape,
  ...RewardStateTimestampsSchema.shape,
  ...AuditTimestampsSchema.shape,
}).superRefine(validateRewardValueTypeCoherence);

/**
 * Schema de OUTPUT - Con usageTracking calculado por backend
 */
export const BonusRolloverRewardEntitySchema = BonusRolloverRewardSchemaBase.extend({
  qualifyConditions: z.array(QualifyConditionEntitySchema).min(0), // ✅ Sobrescribir con EntitySchema (incluye tracking)
  usageTracking: BonusRolloverUsageTrackingSchema.nullable(), // ✅ Tracking solo en OUTPUT
  ...RewardEntityCommonFieldsSchema.shape,
  ...RewardStateTimestampsSchema.shape,
  ...AuditTimestampsSchema.shape,
}).superRefine(validateRewardValueTypeCoherence);

/**
 * Schema de OUTPUT - Con usageTracking calculado por backend
 */
export const BonusNoRolloverRewardEntitySchema = BonusNoRolloverRewardSchemaBase.extend({
  qualifyConditions: z.array(QualifyConditionEntitySchema).min(0), // ✅ Sobrescribir con EntitySchema (incluye tracking)
  usageTracking: BonusNoRolloverUsageTrackingSchema.nullable(), // ✅ Tracking solo en OUTPUT
  ...RewardEntityCommonFieldsSchema.shape,
  ...RewardStateTimestampsSchema.shape,
  ...AuditTimestampsSchema.shape,
}).superRefine(validateRewardValueTypeCoherence);

/**
 * Schema de OUTPUT - Con usageTracking calculado por backend
 */
export const EnhancedOddsRewardEntitySchema = EnhancedOddsRewardSchemaBase.extend({
  qualifyConditions: z.array(QualifyConditionEntitySchema).min(0), // ✅ Sobrescribir con EntitySchema (incluye tracking)
  usageTracking: EnhancedOddsUsageTrackingSchema.nullable(), // ✅ Tracking solo en OUTPUT
  ...RewardEntityCommonFieldsSchema.shape,
  ...RewardStateTimestampsSchema.shape,
  ...AuditTimestampsSchema.shape,
}).superRefine(validateRewardValueTypeCoherence);

/**
 * Schema de OUTPUT - Con usageTracking calculado por backend
 */
export const CasinoSpinsRewardEntitySchema = CasinoSpinsRewardSchemaBase.extend({
  qualifyConditions: z.array(QualifyConditionEntitySchema).min(0), // ✅ Sobrescribir con EntitySchema (incluye tracking)
  usageTracking: CasinoSpinsUsageTrackingSchema.nullable(), // ✅ Tracking solo en OUTPUT
  ...RewardEntityCommonFieldsSchema.shape,
  ...RewardStateTimestampsSchema.shape,
  ...AuditTimestampsSchema.shape,
}).superRefine(validateRewardValueTypeCoherence);

// =============================================
// REWARD (DISCRIMINATED UNION)
// =============================================

export const RewardSchema = z.discriminatedUnion('type', [
  FreeBetRewardSchema,
  CashbackFreeBetRewardSchema,
  BonusRolloverRewardSchema,
  BonusNoRolloverRewardSchema,
  EnhancedOddsRewardSchema,
  CasinoSpinsRewardSchema,
]);

export const RewardEntitySchema = z.union([
  FreeBetRewardEntitySchema,
  CashbackFreeBetRewardEntitySchema,
  BonusRolloverRewardEntitySchema,
  BonusNoRolloverRewardEntitySchema,
  EnhancedOddsRewardEntitySchema,
  CasinoSpinsRewardEntitySchema,
]);

// =============================================
// INPUT SCHEMAS (para tRPC)
// =============================================

/**
 * Schema de input para actualizar recompensa
 */
export const UpdateRewardInputSchema = z.object({
  id: z.string(),
  // Modificación para manejar parciales de una unión discriminada
  data: z.discriminatedUnion('type', [
    FreeBetRewardSchema.partial().extend({ type: z.literal('FREEBET') }),
    CashbackFreeBetRewardSchema.partial().extend({ type: z.literal('CASHBACK_FREEBET') }),
    BonusRolloverRewardSchema.partial().extend({ type: z.literal('BET_BONUS_ROLLOVER') }),
    BonusNoRolloverRewardSchema.partial().extend({ type: z.literal('BET_BONUS_NO_ROLLOVER') }),
    EnhancedOddsRewardSchema.partial().extend({ type: z.literal('ENHANCED_ODDS') }),
    CasinoSpinsRewardSchema.partial().extend({ type: z.literal('CASINO_SPINS') }),
  ]),
});

// =============================================
// INFERRED TYPES
// =============================================

export type FreeBetReward = z.infer<typeof FreeBetRewardSchema>;
export type CashbackFreeBetReward = z.infer<typeof CashbackFreeBetRewardSchema>;
export type BonusRolloverReward = z.infer<typeof BonusRolloverRewardSchema>;
export type BonusNoRolloverReward = z.infer<typeof BonusNoRolloverRewardSchema>;
export type EnhancedOddsReward = z.infer<typeof EnhancedOddsRewardSchema>;
export type CasinoSpinsReward = z.infer<typeof CasinoSpinsRewardSchema>;
export type Reward = z.infer<typeof RewardSchema>;

export type FreeBetRewardEntity = z.infer<typeof FreeBetRewardEntitySchema>;
export type CashbackFreeBetRewardEntity = z.infer<typeof CashbackFreeBetRewardEntitySchema>;
export type BonusRolloverRewardEntity = z.infer<typeof BonusRolloverRewardEntitySchema>;
export type BonusNoRolloverRewardEntity = z.infer<typeof BonusNoRolloverRewardEntitySchema>;
export type EnhancedOddsRewardEntity = z.infer<typeof EnhancedOddsRewardEntitySchema>;
export type CasinoSpinsRewardEntity = z.infer<typeof CasinoSpinsRewardEntitySchema>;
export type RewardEntity = z.infer<typeof RewardEntitySchema>;
export type UpdateRewardInput = z.infer<typeof UpdateRewardInputSchema>;
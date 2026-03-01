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
  clientId: z.string().uuid().optional(),
  value: requiredNumber(0),
  valueType: RewardValueTypeSchema,
  activationMethod: ActivationMethodSchema,
  claimMethod: ClaimMethodSchema,
  activationRestrictions: z.string().nullish(),
  claimRestrictions: z.string().nullish(),
  withdrawalRestrictions: z.string().nullish(),
  status: RewardStatusSchema.optional(),
  statusDate: z.date(), // Nueva propiedad para tracking histórico
  qualifyConditions: z.array(QualifyConditionSchema).min(0),
}).refine((value) => Boolean(value.id || value.clientId), {
  message: 'Reward requires id or clientId',
  path: ['id'],
});

/**
 * Campos comunes de BD para TODAS las Reward entities
 */
const RewardEntityCommonFieldsSchema = z.object({
  id: z.string(),
  status: RewardStatusSchema,
  phaseId: z.string(),
  promotionId: z.string().optional(), // ID de la promocion (solo cuando se consulta standalone, no en contexto anidado)
  canDelete: z.boolean(),
  totalBalance: z.number(),
});

// =============================================
// VALIDATION HELPERS
// =============================================

type RewardValueType = z.infer<typeof RewardValueTypeSchema>;
type QualifyConditionInput = z.infer<typeof QualifyConditionSchema>;

/**
 * Valida coherencia entre reward.valueType y qualifyConditions.contributesToRewardValue
 * Se aplica a todos los tipos de Reward con .superRefine()
 */
function validateRewardValueTypeCoherence(
  data: {
    value: number | undefined;
    valueType: RewardValueType;
    qualifyConditions: QualifyConditionInput[];
  },
  ctx: z.RefinementCtx
) {
  const calculatingConditions = data.qualifyConditions.filter(
    qc => (qc.type === 'DEPOSIT' || qc.type === 'BET') &&
          qc.conditions.contributesToRewardValue === true
  );

  if (data.valueType === 'FIXED') {
    if (typeof data.value === 'number' && !Number.isInteger(data.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Para valor fijo, la recompensa debe ser un número entero',
        path: ['value'],
      });
    }

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
const FreeBetRewardSchemaBase = BaseRewardSchema.safeExtend({
  type: z.literal('FREEBET'),
  typeSpecificFields: FreeBetTypeSpecificFieldsSchema, // SNR movido aquí
  usageConditions: FreeBetUsageConditionsSchema,
});

/**
 * Schema de INPUT - Sin usageTracking (calculado por backend)
 */
const CashbackFreeBetRewardSchemaBase = BaseRewardSchema.safeExtend({
  type: z.literal('CASHBACK_FREEBET'),
  typeSpecificFields: z.null().optional(), // Sin campos específicos
  usageConditions: CashbackUsageConditionsSchema,
});

/**
 * Schema de INPUT - Sin usageTracking (calculado por backend)
 */
const BonusRolloverRewardSchemaBase = BaseRewardSchema.safeExtend({
  type: z.literal('BET_BONUS_ROLLOVER'),
  typeSpecificFields: z.null().optional(), // Sin campos específicos
  usageConditions: BonusRolloverUsageConditionsSchema,
});

/**
 * Schema de INPUT - Sin usageTracking (calculado por backend)
 */
const BonusNoRolloverRewardSchemaBase = BaseRewardSchema.safeExtend({
  type: z.literal('BET_BONUS_NO_ROLLOVER'),
  typeSpecificFields: z.null().optional(), // Sin campos específicos
  usageConditions: BonusNoRolloverUsageConditionsSchema,
});

/**
 * Schema de INPUT - Sin usageTracking (calculado por backend)
 */
const EnhancedOddsRewardSchemaBase = BaseRewardSchema.safeExtend({
  type: z.literal('ENHANCED_ODDS'),
  typeSpecificFields: z.null().optional(), // Sin campos específicos
  usageConditions: EnhancedOddsUsageConditionsSchema,
});

/**
 * Schema de INPUT - Sin usageTracking (calculado por backend)
 */
const CasinoSpinsRewardSchemaBase = BaseRewardSchema.safeExtend({
  type: z.literal('CASINO_SPINS'),
  typeSpecificFields: z.null().optional(), // Sin campos específicos
  usageConditions: CasinoSpinsUsageConditionsSchema,
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
export const FreeBetRewardEntitySchema = FreeBetRewardSchemaBase.safeExtend({
  qualifyConditions: z.array(QualifyConditionEntitySchema).min(0), // ✅ Sobrescribir con EntitySchema (incluye tracking)
  usageTracking: FreeBetUsageTrackingSchema.nullable(), // ✅ Tracking solo en OUTPUT
  ...RewardEntityCommonFieldsSchema.shape,
  ...RewardStateTimestampsSchema.shape,
  ...AuditTimestampsSchema.shape,
}).superRefine(validateRewardValueTypeCoherence);

/**
 * Schema de OUTPUT - Con usageTracking calculado por backend
 */
export const CashbackFreeBetRewardEntitySchema = CashbackFreeBetRewardSchemaBase.safeExtend({
  qualifyConditions: z.array(QualifyConditionEntitySchema).min(0), // ✅ Sobrescribir con EntitySchema (incluye tracking)
  usageTracking: CashbackUsageTrackingSchema.nullable(), // ✅ Tracking solo en OUTPUT
  ...RewardEntityCommonFieldsSchema.shape,
  ...RewardStateTimestampsSchema.shape,
  ...AuditTimestampsSchema.shape,
}).superRefine(validateRewardValueTypeCoherence);

/**
 * Schema de OUTPUT - Con usageTracking calculado por backend
 */
export const BonusRolloverRewardEntitySchema = BonusRolloverRewardSchemaBase.safeExtend({
  qualifyConditions: z.array(QualifyConditionEntitySchema).min(0), // ✅ Sobrescribir con EntitySchema (incluye tracking)
  usageTracking: BonusRolloverUsageTrackingSchema.nullable(), // ✅ Tracking solo en OUTPUT
  ...RewardEntityCommonFieldsSchema.shape,
  ...RewardStateTimestampsSchema.shape,
  ...AuditTimestampsSchema.shape,
}).superRefine(validateRewardValueTypeCoherence);

/**
 * Schema de OUTPUT - Con usageTracking calculado por backend
 */
export const BonusNoRolloverRewardEntitySchema = BonusNoRolloverRewardSchemaBase.safeExtend({
  qualifyConditions: z.array(QualifyConditionEntitySchema).min(0), // ✅ Sobrescribir con EntitySchema (incluye tracking)
  usageTracking: BonusNoRolloverUsageTrackingSchema.nullable(), // ✅ Tracking solo en OUTPUT
  ...RewardEntityCommonFieldsSchema.shape,
  ...RewardStateTimestampsSchema.shape,
  ...AuditTimestampsSchema.shape,
}).superRefine(validateRewardValueTypeCoherence);

/**
 * Schema de OUTPUT - Con usageTracking calculado por backend
 */
export const EnhancedOddsRewardEntitySchema = EnhancedOddsRewardSchemaBase.safeExtend({
  qualifyConditions: z.array(QualifyConditionEntitySchema).min(0), // ✅ Sobrescribir con EntitySchema (incluye tracking)
  usageTracking: EnhancedOddsUsageTrackingSchema.nullable(), // ✅ Tracking solo en OUTPUT
  ...RewardEntityCommonFieldsSchema.shape,
  ...RewardStateTimestampsSchema.shape,
  ...AuditTimestampsSchema.shape,
}).superRefine(validateRewardValueTypeCoherence);

/**
 * Schema de OUTPUT - Con usageTracking calculado por backend
 */
export const CasinoSpinsRewardEntitySchema = CasinoSpinsRewardSchemaBase.safeExtend({
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
  data: RewardSchema,
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


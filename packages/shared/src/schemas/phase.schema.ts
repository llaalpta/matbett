/**
 * Phase Schema
 */

import { z } from 'zod';

import { PhaseStatusSchema, ActivationMethodSchema } from './enums';
import { TimeframeSchema } from './timeframe.schema';
import { QualifyConditionSchema, QualifyConditionEntitySchema } from './qualify-condition.schema';
import { RewardSchema, RewardEntitySchema } from './reward.schema';

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
 * Timestamps de estado para Phase
 * Estos representan eventos que pueden usarse como anchors en timeframes relativos
 */
const PhaseStateTimestampsSchema = z.object({
  activatedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  expiredAt: z.date().nullable(),
});

// =============================================
// PHASE SCHEMA (INPUT) - Para formularios y CREATE/UPDATE
// =============================================

/**
 * Schema de INPUT - Sin tracking en rewards ni qualifyConditions
 */
export const PhaseSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  status: PhaseStatusSchema.optional(),
  activationMethod: ActivationMethodSchema,
  timeframe: TimeframeSchema,
  availableQualifyConditions: z.array(QualifyConditionSchema),
  rewards: z.array(RewardSchema).min(1),
});

// =============================================
// PHASE ENTITY SCHEMA (OUTPUT) - Con tracking en nested entities
// =============================================

/**
 * Schema de OUTPUT - Con EntitySchemas que incluyen tracking
 */
export const PhaseEntitySchema = PhaseSchema
  .extend({
    id: z.string(),
    status: PhaseStatusSchema,
    promotionId: z.string(),
    totalBalance: z.number(),
    // Sobrescribir con EntitySchemas (que incluyen tracking)
    availableQualifyConditions: z.array(QualifyConditionEntitySchema),
    rewards: z.array(RewardEntitySchema).min(1),
    ...PhaseStateTimestampsSchema.shape,
    ...AuditTimestampsSchema.shape,
  });

// =============================================
// INFERRED TYPES
// =============================================

export type Phase = z.infer<typeof PhaseSchema>;
export type PhaseEntity = z.infer<typeof PhaseEntitySchema>;

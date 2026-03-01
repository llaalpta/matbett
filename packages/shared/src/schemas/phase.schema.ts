/**
 * Phase Schema
 */

import { z } from 'zod';

import { PhaseStatusSchema, ActivationMethodSchema } from './enums';
import { TimeframeSchema } from './timeframe.schema';
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
  clientId: z.string().uuid().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  status: PhaseStatusSchema.optional(),
  
  // Fecha genérica asociada al estado actual
  statusDate: z.date(),

  activationMethod: ActivationMethodSchema,
  timeframe: TimeframeSchema,
  rewards: z.array(RewardSchema).min(1),
}).refine((value) => Boolean(value.id || value.clientId), {
  message: 'Phase requires id or clientId',
  path: ['id'],
});

// =============================================
// PHASE ENTITY SCHEMA (OUTPUT) - Con tracking en nested entities
// =============================================

/**
 * Schema de OUTPUT - Con EntitySchemas que incluyen tracking
 */
export const PhaseEntitySchema = PhaseSchema
  .safeExtend({
    id: z.string(),
    status: PhaseStatusSchema,
    promotionId: z.string(),
    canDelete: z.boolean(),
    totalBalance: z.number(),
    // Sobrescribir con EntitySchemas (que incluyen tracking)
    rewards: z.array(RewardEntitySchema).min(1),
    ...PhaseStateTimestampsSchema.shape,
    ...AuditTimestampsSchema.shape,
  });

// =============================================
// INFERRED TYPES
// =============================================

export type Phase = z.infer<typeof PhaseSchema>;
export type PhaseEntity = z.infer<typeof PhaseEntitySchema>;

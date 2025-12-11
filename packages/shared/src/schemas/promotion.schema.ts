/**
 * Promotion Schema
 */

import { z } from 'zod';

import {
  BookmakerSchema,
  PromotionStatusSchema,
  PromotionCardinalitySchema,
  ActivationMethodSchema,
} from './enums';
import { AbsoluteTimeframeSchema, AvailableTimeframesSchema } from './timeframe.schema';
import { PhaseSchema, PhaseEntitySchema } from './phase.schema';
import { FilterValueSchema } from './pagination.schema'; // Importar filtro seguro

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
 * Timestamps de estado para Promotion
 * Estos representan eventos que pueden usarse como anchors en timeframes relativos
 */
const PromotionStateTimestampsSchema = z.object({
  activatedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  expiredAt: z.date().nullable(),
});

// =============================================
// PROMOTION SCHEMA (INPUT) - Para formularios y CREATE/UPDATE
// =============================================

/**
 * Schema de INPUT - Sin tracking en nested entities
 */
export const PromotionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().nullish(),
  bookmaker: BookmakerSchema.nullish(),
  status: PromotionStatusSchema.optional(),
  phases: z.array(PhaseSchema).min(1),
  timeframe: AbsoluteTimeframeSchema,
  cardinality: PromotionCardinalitySchema,
  activationMethod: ActivationMethodSchema.optional(),
});

// =============================================
// PROMOTION ENTITY SCHEMA (OUTPUT) - Con tracking en nested entities
// =============================================

/**
 * Schema de OUTPUT - Con PhaseEntitySchema que incluye tracking en rewards/qualifyConditions
 * Usado para outputs del backend (lo que devuelven los endpoints)
 */
export const PromotionEntitySchema = PromotionSchema
  .extend({
    id: z.string(),
    status: PromotionStatusSchema,
    userId: z.string(),
    totalBalance: z.number(),
    // Sobrescribir con PhaseEntitySchema (que incluye tracking en nested entities)
    phases: z.array(PhaseEntitySchema).min(1),
    // Campo calculado en backend (no persistido en DB promotion table), usado para UI de timeframes
    availableTimeframes: AvailableTimeframesSchema.optional(),
    ...PromotionStateTimestampsSchema.shape,
    ...AuditTimestampsSchema.shape,
  });

// =============================================
// INPUT SCHEMAS (para tRPC)
// =============================================

/**
 * Schema de input para listar promociones con paginación
 */
export const PromotionListInputSchema = z.object({
  // Paginación (de PaginationInputSchema)
  pageIndex: z.number().min(0).default(0),
  pageSize: z.number().min(1).max(100).default(20),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).optional(),
  columnFilters: z.array(z.object({ id: z.string(), value: FilterValueSchema })).optional(),
  globalFilter: z.string().optional(),
  // Filtros específicos para promociones
  status: z.string().optional(),
  bookmaker: z.string().optional(),
});

/**
 * Schema de input para actualizar promoción
 */
export const UpdatePromotionInputSchema = z.object({
  id: z.string(),
  data: PromotionSchema.partial(),
});

// =============================================
// INFERRED TYPES
// =============================================

export type Promotion = z.infer<typeof PromotionSchema>;
export type PromotionEntity = z.infer<typeof PromotionEntitySchema>;
export type PromotionListInput = z.infer<typeof PromotionListInputSchema>;
export type UpdatePromotionInput = z.infer<typeof UpdatePromotionInputSchema>;

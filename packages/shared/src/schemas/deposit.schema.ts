/**
 * Deposit Schema
 */

import { z } from 'zod';
import { BookmakerSchema } from './enums';
import { PaginationInputSchema, FilterValueSchema } from './pagination.schema';

// =============================================
// BASE SCHEMA
// =============================================

export const DepositSchema = z.object({
  bookmaker: BookmakerSchema,
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  date: z.date(),
  code: z.string().nullish(),
  qualifyConditionId: z.string().nullish(),
});

// =============================================
// ENTITY SCHEMA
// =============================================

/**
 * Contexto de promoción específico para depósitos
 * Indica a qué promoción/fase/reward está asociado este depósito
 */
export const DepositPromotionContextSchema = z.object({
  promotionId: z.string(),
  phaseId: z.string().optional(),
  rewardId: z.string().optional(),
  qualifyConditionId: z.string().optional(),
});

/**
 * Schema completo de Deposit incluyendo campos de BD y contexto
 */
export const DepositEntitySchema = DepositSchema.extend({
  id: z.string(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  promotionContext: DepositPromotionContextSchema.optional(),
});

// =============================================
// INPUT SCHEMAS
// =============================================

/**
 * Schema para listar depósitos con paginación y filtros
 */
export const DepositListInputSchema = PaginationInputSchema.extend({
  // Filtros específicos
  bookmaker: z.string().optional(),
  // Filtros genéricos de columna (para compatibilidad con TanStack Table)
  columnFilters: z.array(z.object({ id: z.string(), value: FilterValueSchema })).optional(),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).optional(),
});

export const UpdateDepositInputSchema = z.object({
  id: z.string(),
  data: DepositSchema.partial(),
});

// =============================================
// INFERRED TYPES
// =============================================

export type Deposit = z.infer<typeof DepositSchema>;
export type DepositEntity = z.infer<typeof DepositEntitySchema>;
export type DepositListInput = z.infer<typeof DepositListInputSchema>;
export type UpdateDepositInput = z.infer<typeof UpdateDepositInputSchema>;
export type DepositPromotionContext = z.infer<typeof DepositPromotionContextSchema>;
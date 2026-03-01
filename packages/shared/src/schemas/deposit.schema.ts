/**
 * Deposit Schema
 */

import { z } from 'zod';
import {
  BookmakerAccountTypeSchema,
  DepositParticipationRoleSchema,
  RewardTypeSchema,
} from './enums';
import { PaginationInputSchema, FilterValueSchema } from './pagination.schema';

// =============================================
// BASE SCHEMA
// =============================================

const DepositCoreSchema = z.object({
  bookmakerAccountId: z.string().min(1, 'Selecciona una cuenta para el depósito'),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  date: z.date(),
  code: z.string().nullish(),
});

export const DepositParticipationSchema = z.object({
  id: z.string().optional(),
  role: DepositParticipationRoleSchema,
  promotionId: z.string(),
  promotionName: z.string().optional(),
  phaseId: z.string().optional(),
  phaseName: z.string().optional(),
  rewardId: z.string().optional(),
  rewardType: RewardTypeSchema.optional(),
  qualifyConditionId: z.string(),
  countsAsQualification: z.boolean().optional(),
});

export const DepositSchema = DepositCoreSchema.extend({
  participations: z.array(DepositParticipationSchema).optional(),
});

// =============================================
// ENTITY SCHEMA
// =============================================

/**
 * Schema completo de Deposit incluyendo campos de BD y participaciones contextuales.
 */
export const DepositEntitySchema = DepositSchema.extend({
  bookmakerAccountId: z.string().optional(),
  bookmaker: z.string().min(1),
  bookmakerAccountIdentifier: z.string().min(1).optional(),
  bookmakerAccountType: BookmakerAccountTypeSchema.optional(),
  id: z.string(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  participations: z.array(DepositParticipationSchema).default([]),
});

// =============================================
// INPUT SCHEMAS
// =============================================

/**
 * Schema para listar depósitos con paginación y filtros
 */
export const DepositListInputSchema = PaginationInputSchema.extend({
  // Filtros específicos
  bookmakerAccountId: z.string().optional(),
  qualifyConditionId: z.string().optional(),
  // Filtros genéricos de columna (para compatibilidad con TanStack Table)
  columnFilters: z.array(z.object({ id: z.string(), value: FilterValueSchema })).optional(),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).optional(),
});

export const UpdateDepositInputSchema = z.object({
  id: z.string(),
  data: DepositCoreSchema.partial(),
});

export const DeleteDepositResultSchema = z.object({
  success: z.literal(true),
  promotionId: z.string().optional(),
});

// =============================================
// INFERRED TYPES
// =============================================

export type Deposit = z.infer<typeof DepositSchema>;
export type DepositCore = z.infer<typeof DepositCoreSchema>;
export type DepositParticipation = z.infer<typeof DepositParticipationSchema>;
export type DepositEntity = z.infer<typeof DepositEntitySchema>;
export type DepositListInput = z.infer<typeof DepositListInputSchema>;
export type UpdateDepositInput = z.infer<typeof UpdateDepositInputSchema>;
export type DeleteDepositResult = z.infer<typeof DeleteDepositResultSchema>;

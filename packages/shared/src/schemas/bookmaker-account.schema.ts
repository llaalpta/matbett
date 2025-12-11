import { z } from 'zod';
import { BookmakerSchema } from './enums';
import { PaginationInputSchema, FilterValueSchema } from './pagination.schema';

// =============================================
// BOOKMAKER ACCOUNT SCHEMA
// =============================================

export const BookmakerAccountSchema = z.object({
  bookmaker: BookmakerSchema,
  accountIdentifier: z.string().min(1, 'El identificador de cuenta no puede estar vacío'),
  realBalance: z.number().default(0),
  bonusBalance: z.number().default(0),
  freebetBalance: z.number().default(0),
});

// =============================================
// ENTITY SCHEMA (con campos de BD)
// =============================================

/**
 * Schema completo de BookmakerAccount incluyendo campos de BD
 * Usado para outputs del backend (lo que devuelven los endpoints)
 */
export const BookmakerAccountEntitySchema = BookmakerAccountSchema.extend({
  id: z.string(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// =============================================
// INPUT SCHEMAS (para tRPC)
// =============================================

/**
 * Schema para listar cuentas de bookmaker con paginación y filtros
 */
export const BookmakerAccountListInputSchema = PaginationInputSchema.extend({
  // Filtros genéricos de columna (para compatibilidad con TanStack Table)
  columnFilters: z.array(z.object({ id: z.string(), value: FilterValueSchema })).optional(),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).optional(),
});

/**
 * Schema de input para actualizar cuenta de bookmaker
 */
export const UpdateBookmakerAccountInputSchema = z.object({
  id: z.string(),
  data: BookmakerAccountSchema.partial(),
});

// =============================================
// INFERRED TYPES
// =============================================

export type BookmakerAccount = z.infer<typeof BookmakerAccountSchema>;
export type BookmakerAccountEntity = z.infer<typeof BookmakerAccountEntitySchema>;
export type BookmakerAccountListInput = z.infer<typeof BookmakerAccountListInputSchema>;
export type UpdateBookmakerAccountInput = z.infer<typeof UpdateBookmakerAccountInputSchema>;

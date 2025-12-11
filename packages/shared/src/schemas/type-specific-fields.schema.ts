/**
 * Type-Specific Fields Schemas
 *
 * Campos específicos por tipo de reward que NO pertenecen a usageConditions.
 * Estos campos son propiedades inherentes de la reward, no de su uso.
 *
 * Patrón: Campo JSON en Prisma parseado según el tipo de reward.
 */

import { z } from 'zod';

// =============================================
// TYPE-SPECIFIC FIELDS POR TIPO DE REWARD
// =============================================

/**
 * Campos específicos de FREEBET reward
 *
 * stakeNotReturned (SNR): Define si al usar la freebet se devuelve el stake o solo las ganancias netas.
 * - true: Solo ganancias netas (stake NO se devuelve) - Ej: Apuesta €10, gana €30, recibes €20
 * - false: Stake devuelto (ganancias brutas) - Ej: Apuesta €10, gana €30, recibes €30
 */
export const FreeBetTypeSpecificFieldsSchema = z.object({
  stakeNotReturned: z.boolean(),
});

// =============================================
// UNION TYPE
// =============================================

/**
 * Union type para campos específicos por tipo de reward
 * null = tipos sin campos específicos (CASHBACK_FREEBET, BET_BONUS_*, ENHANCED_ODDS, CASINO_SPINS)
 */
export const TypeSpecificFieldsSchema = z.union([
  FreeBetTypeSpecificFieldsSchema,
  z.null(),
]);

// =============================================
// INFERRED TYPES
// =============================================

export type FreeBetTypeSpecificFields = z.infer<typeof FreeBetTypeSpecificFieldsSchema>;
export type TypeSpecificFields = z.infer<typeof TypeSpecificFieldsSchema>;

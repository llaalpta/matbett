/**
 * Bet Restrictions - Componentes reutilizables
 *
 * Schemas atómicos que se pueden componer en otros schemas.
 * NO hay un "BetConditionsSchema" genérico - cada contexto
 * incluye directamente los campos que necesita.
 */

import { z } from 'zod';

import { RequiredBetOutcomeSchema } from './enums';

// =============================================
// COMPONENTES ATÓMICOS
// =============================================

/**
 * Restricción de cuotas (mínima/máxima)
 */
export const OddsRestrictionSchema = z.object({
  minOdds: z.number().min(1.01, 'La cuota mínima debe ser mayor a 1.01').optional(),
  maxOdds: z.number().optional(),
});

/**
 * Restricción de stake (mínimo/máximo)
 */
export const StakeRestrictionSchema = z.object({
  minStake: z.number().int('El stake mínimo debe ser un número entero').min(0).optional(),
  maxStake: z.number().int('El stake máximo debe ser un número entero').min(0).optional(),
});

/**
 * Condiciones para apuestas combinadas/múltiples
 */
export const MultipleBetConditionSchema = z.object({
  minSelections: z.number().optional(),
  maxSelections: z.number().optional(),
  minOddsPerSelection: z.number().optional(),
  maxOddsPerSelection: z.number().optional(),
  systemType: z.string().optional(),
});

/**
 * Restricciones textuales reutilizables en condiciones de apuesta
 */
export const BetTextRestrictionsSchema = z.object({
  betTypeRestrictions: z.string().optional(),
  selectionRestrictions: z.string().optional(),
  otherRestrictions: z.string().optional(),
});

// =============================================
// INFERRED TYPES
// =============================================

export type OddsRestriction = z.infer<typeof OddsRestrictionSchema>;
export type StakeRestriction = z.infer<typeof StakeRestrictionSchema>;
export type MultipleBetCondition = z.infer<typeof MultipleBetConditionSchema>;
export type BetTextRestrictions = z.infer<typeof BetTextRestrictionsSchema>;

// =============================================
// RE-EXPORT para compatibilidad
// =============================================

export { RequiredBetOutcomeSchema };

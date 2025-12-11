/**
 * Usage Conditions Schemas
 *
 * Estructura aplanada - cada tipo tiene directamente los campos que necesita,
 * sin objetos wrapper como "betConditions".
 *
 * NOTA: SNR movido a FreeBetRewardSchema (es propiedad de la reward).
 * retentionRate eliminado (es para cálculos de matched betting, no de la promo).
 */

import { z } from 'zod';

import { TimeframeSchema } from './timeframe.schema';
import {
  OddsRestrictionSchema,
  StakeRestrictionSchema,
  MultipleBetConditionSchema,
  RequiredBetOutcomeSchema,
} from './bet-conditions.schema';

// =============================================
// FREEBET USAGE CONDITIONS
// stakeRestriction: solo aplica si mustUseComplete=false (puede fraccionarse)
// =============================================

export const FreeBetUsageConditionsSchema = z.object({
  type: z.literal('FREEBET'),
  timeframe: TimeframeSchema,

  // Comportamiento de uso
  mustUseComplete: z.boolean(),
  voidConsumesBalance: z.boolean(),
  lockWinningsUntilFullyUsed: z.boolean().optional(),

  // Restricciones de apuesta (directas)
  oddsRestriction: OddsRestrictionSchema.optional(),
  stakeRestriction: StakeRestrictionSchema.optional(), // Solo aplica si mustUseComplete=false
  allowMultipleBets: z.boolean().optional(),
  multipleBetCondition: MultipleBetConditionSchema.optional(),
  allowLiveOddsChanges: z.boolean().optional(),
  betTypeRestrictions: z.string().optional(),
  selectionRestrictions: z.string().optional(),
});

// =============================================
// BONUS ROLLOVER USAGE CONDITIONS
// Con stake (límite durante rollover) y outcome requerido
// =============================================

export const BonusRolloverUsageConditionsSchema = z.object({
  type: z.literal('BET_BONUS_ROLLOVER'),
  timeframe: TimeframeSchema,

  // Configuración del rollover
  multiplier: z.number().min(1).optional(),
  maxConversionMultiplier: z.number().min(0).optional(),
  expectedLossPercentage: z.number().min(0).max(100).optional(),
  bonusCanBeUsedForBetting: z.boolean().optional(),
  minBetsRequired: z.number().min(1).optional(),

  // Restricciones de dinero/retiro
  onlyBonusMoneyCountsForRollover: z.boolean().optional(),
  onlyRealMoneyCountsForRollover: z.boolean().optional(),
  noWithdrawalsAllowedDuringRollover: z.boolean().optional(),
  bonusCancelledOnWithdrawal: z.boolean().optional(),
  allowDepositsAfterActivation: z.boolean().optional(),

  // Restricciones de apuesta (con stake y outcome)
  oddsRestriction: OddsRestrictionSchema.optional(),
  stakeRestriction: StakeRestrictionSchema.optional(),
  requiredBetOutcome: RequiredBetOutcomeSchema.optional(),
  allowMultipleBets: z.boolean().optional(),
  multipleBetCondition: MultipleBetConditionSchema.optional(),
  allowLiveOddsChanges: z.boolean().optional(),
  betTypeRestrictions: z.string().optional(),
  selectionRestrictions: z.string().optional(),
});

// =============================================
// BONUS NO ROLLOVER USAGE CONDITIONS
// =============================================

export const BonusNoRolloverUsageConditionsSchema = z.object({
  type: z.literal('BET_BONUS_NO_ROLLOVER'),
  timeframe: TimeframeSchema,
  maxConversionMultiplier: z.number().optional(),

  // Restricciones de apuesta (con stake)
  oddsRestriction: OddsRestrictionSchema.optional(),
  stakeRestriction: StakeRestrictionSchema.optional(),
  allowMultipleBets: z.boolean().optional(),
  multipleBetCondition: MultipleBetConditionSchema.optional(),
  allowLiveOddsChanges: z.boolean().optional(),
  betTypeRestrictions: z.string().optional(),
  selectionRestrictions: z.string().optional(),
});

// =============================================
// CASHBACK USAGE CONDITIONS
// =============================================

export const CashbackUsageConditionsSchema = z.object({
  type: z.literal('CASHBACK_FREEBET'),
  timeframe: TimeframeSchema,
  cashbackPercentage: z.number(),
  maxCashbackAmount: z.number(),

  // Restricciones de apuesta (con stake y outcome)
  oddsRestriction: OddsRestrictionSchema.optional(),
  stakeRestriction: StakeRestrictionSchema.optional(),
  requiredBetOutcome: RequiredBetOutcomeSchema.optional(),
  allowMultipleBets: z.boolean().optional(),
  multipleBetCondition: MultipleBetConditionSchema.optional(),
  allowLiveOddsChanges: z.boolean().optional(),
  betTypeRestrictions: z.string().optional(),
  selectionRestrictions: z.string().optional(),
});

// =============================================
// ENHANCED ODDS USAGE CONDITIONS
// =============================================

export const EnhancedOddsUsageConditionsSchema = z.object({
  type: z.literal('ENHANCED_ODDS'),
  timeframe: TimeframeSchema,
  normalOdds: z.number(),
  enhancedOdds: z.number(),

  // Restricciones de apuesta (con stake)
  stakeRestriction: StakeRestrictionSchema.optional(),
  allowMultipleBets: z.boolean().optional(),
  multipleBetCondition: MultipleBetConditionSchema.optional(),
  betTypeRestrictions: z.string().optional(),
  selectionRestrictions: z.string().optional(),
});

// =============================================
// CASINO SPINS USAGE CONDITIONS
// Sin restricciones de apuesta (no aplica)
// =============================================

export const CasinoSpinsUsageConditionsSchema = z.object({
  type: z.literal('CASINO_SPINS'),
  timeframe: TimeframeSchema,
  spinsCount: z.number().min(1),
  gameTitle: z.string().optional(),
});

// =============================================
// USAGE CONDITIONS (DISCRIMINATED UNION)
// =============================================

export const UsageConditionsSchema = z.discriminatedUnion('type', [
  FreeBetUsageConditionsSchema,
  BonusRolloverUsageConditionsSchema,
  BonusNoRolloverUsageConditionsSchema,
  CashbackUsageConditionsSchema,
  EnhancedOddsUsageConditionsSchema,
  CasinoSpinsUsageConditionsSchema,
]);

// =============================================
// INFERRED TYPES
// =============================================

export type FreeBetUsageConditions = z.infer<typeof FreeBetUsageConditionsSchema>;
export type BonusRolloverUsageConditions = z.infer<typeof BonusRolloverUsageConditionsSchema>;
export type BonusNoRolloverUsageConditions = z.infer<typeof BonusNoRolloverUsageConditionsSchema>;
export type CashbackUsageConditions = z.infer<typeof CashbackUsageConditionsSchema>;
export type EnhancedOddsUsageConditions = z.infer<typeof EnhancedOddsUsageConditionsSchema>;
export type CasinoSpinsUsageConditions = z.infer<typeof CasinoSpinsUsageConditionsSchema>;
export type UsageConditions = z.infer<typeof UsageConditionsSchema>;

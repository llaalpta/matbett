/**
 * Usage Conditions Schemas
 *
 * Estructura aplanada - cada tipo tiene directamente los campos que necesita,
 * sin objetos wrapper como "betConditions".
 *
 * NOTA: SNR movido a FreeBetRewardSchema (es propiedad de la reward).
 * retentionRate pertenece a cálculos de matched betting, no al modelado de la promo.
 */

import { z } from 'zod';

import { TimeframeSchema } from './timeframe.schema';
import { requiredNumber } from './utils';
import {
  OddsRestrictionSchema,
  StakeRestrictionSchema,
  MultipleBetConditionSchema,
  RequiredBetOutcomeSchema,
  BetTextRestrictionsSchema,
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
  ...BetTextRestrictionsSchema.shape,
});

// =============================================
// BONUS ROLLOVER USAGE CONDITIONS
// Con stake (límite durante rollover) y outcome requerido
// =============================================

export const BonusRolloverUsageConditionsSchema = z
  .object({
    type: z.literal('BET_BONUS_ROLLOVER'),
    timeframe: TimeframeSchema,

    // Configuracion del rollover
    multiplier: requiredNumber(1),
    maxConversionMultiplier: z.number().min(0).optional(),
    expectedLossPercentage: requiredNumber(0).refine(
      (value) => value !== undefined && value <= 100,
      { message: 'Debe ser menor o igual a 100' }
    ),
    bonusCanBeUsedForBetting: z.boolean().optional(),
    minBetsRequired: z.number().min(1).optional(),

    // Restricciones de dinero/retiro
    rolloverContributionWallet: z
      .enum(['BONUS_ONLY', 'REAL_ONLY', 'MIXED'])
      .optional(),
    realMoneyUsageRatio: z.number().min(0).max(100).optional(),
    noWithdrawalsAllowedDuringRollover: z.boolean().optional(),
    bonusCancelledOnWithdrawal: z.boolean().optional(),
    allowDepositsAfterActivation: z.boolean().optional(),
    returnedBetsCountForRollover: z.boolean().optional(),
    cashoutBetsCountForRollover: z.boolean().optional(),
    requireResolvedWithinTimeframe: z.boolean().optional(),
    countOnlySettledBets: z.boolean().optional(),
    maxConvertibleAmount: z.number().min(0).optional(),

    // Restricciones de apuesta (con stake y outcome)
    oddsRestriction: OddsRestrictionSchema.optional(),
    stakeRestriction: StakeRestrictionSchema.optional(),
    requiredBetOutcome: RequiredBetOutcomeSchema.optional(),
    allowMultipleBets: z.boolean().optional(),
    multipleBetCondition: MultipleBetConditionSchema.optional(),
    allowLiveOddsChanges: z.boolean().optional(),
    ...BetTextRestrictionsSchema.shape,
  })
  .superRefine((data, ctx) => {
    if (data.bonusCanBeUsedForBetting === false) {
      if (
        data.rolloverContributionWallet !== undefined &&
        data.rolloverContributionWallet !== 'REAL_ONLY'
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['rolloverContributionWallet'],
          message:
            'Cuando el bono no se puede usar para apostar, el saldo que cuenta para rollover debe ser REAL_ONLY.',
        });
      }
      if (
        data.realMoneyUsageRatio !== undefined &&
        data.realMoneyUsageRatio !== 100
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['realMoneyUsageRatio'],
          message:
            'Cuando el bono no se puede usar para apostar, la proporcion de saldo real debe ser 100%.',
        });
      }
    }
  });

// =============================================
// BONUS NO ROLLOVER USAGE CONDITIONS
// =============================================

export const BonusNoRolloverUsageConditionsSchema = z.object({
  type: z.literal('BET_BONUS_NO_ROLLOVER'),
  timeframe: TimeframeSchema,
  maxConversionMultiplier: z.number().min(0).optional(),
  maxConvertibleAmount: z.number().min(0).optional(),

  // Reglas de computo/validez
  returnedBetsCountForUsage: z.boolean().optional(),
  cashoutBetsCountForUsage: z.boolean().optional(),
  requireResolvedWithinTimeframe: z.boolean().optional(),
  countOnlySettledBets: z.boolean().optional(),
  onlyFirstBetCounts: z.boolean().optional(),

  // Restricciones de apuesta (con stake)
  oddsRestriction: OddsRestrictionSchema.optional(),
  stakeRestriction: StakeRestrictionSchema.optional(),
  requiredBetOutcome: RequiredBetOutcomeSchema.optional(),
  allowMultipleBets: z.boolean().optional(),
  multipleBetCondition: MultipleBetConditionSchema.optional(),
  allowLiveOddsChanges: z.boolean().optional(),
  ...BetTextRestrictionsSchema.shape,
});

// =============================================
// CASHBACK USAGE CONDITIONS
// =============================================

export const CashbackUsageConditionsSchema = z.object({
  type: z.literal('CASHBACK_FREEBET'),
  timeframe: TimeframeSchema,

  // Restricciones de apuesta (con stake y outcome)
  oddsRestriction: OddsRestrictionSchema.optional(),
  stakeRestriction: StakeRestrictionSchema.optional(),
  requiredBetOutcome: RequiredBetOutcomeSchema.optional(),
  allowMultipleBets: z.boolean().optional(),
  multipleBetCondition: MultipleBetConditionSchema.optional(),
  allowLiveOddsChanges: z.boolean().optional(),
  ...BetTextRestrictionsSchema.shape,
});

// =============================================
// ENHANCED ODDS USAGE CONDITIONS
// =============================================

export const EnhancedOddsUsageConditionsSchema = z
  .object({
    type: z.literal('ENHANCED_ODDS'),
    timeframe: TimeframeSchema,
    normalOdds: requiredNumber(0),
    enhancedOdds: requiredNumber(0),
    enhancedOddsMode: z.enum(['FIXED', 'PERCENTAGE']).optional(),
    enhancementPercentage: z.number().min(0).optional(),

    // Restricciones de apuesta (con stake)
    stakeRestriction: StakeRestrictionSchema.optional(),
    allowMultipleBets: z.boolean().optional(),
    multipleBetCondition: MultipleBetConditionSchema.optional(),
    allowLiveOddsChanges: z.boolean().optional(),
    ...BetTextRestrictionsSchema.shape,
  })
  .superRefine((data, ctx) => {
    if (
      data.enhancedOddsMode === 'PERCENTAGE' &&
      data.enhancementPercentage === undefined
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['enhancementPercentage'],
        message:
          'Cuando la cuota mejorada se calcula por porcentaje, este campo es obligatorio.',
      });
    }
  });

// =============================================
// CASINO SPINS USAGE CONDITIONS
// Sin restricciones de apuesta (no aplica)
// =============================================

export const CasinoSpinsUsageConditionsSchema = z.object({
  type: z.literal('CASINO_SPINS'),
  timeframe: TimeframeSchema,
  spinsCount: requiredNumber(1),
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


import { z } from 'zod';

// =============================================
// USAGE TRACKING SCHEMAS
// =============================================

export const FreeBetUsageTrackingSchema = z.object({
  type: z.literal('FREEBET'),
  totalUsed: z.number(),
  remainingBalance: z.number(),
});

export const BonusRolloverUsageTrackingSchema = z.object({
  type: z.literal('BET_BONUS_ROLLOVER'),
  totalUsed: z.number(),
  rolloverProgress: z.number(),
  remainingRollover: z.number(),
});

export const BonusNoRolloverUsageTrackingSchema = z.object({
  type: z.literal('BET_BONUS_NO_ROLLOVER'),
  totalUsed: z.number(),
});

export const CashbackUsageTrackingSchema = z.object({
  type: z.literal('CASHBACK_FREEBET'),
  totalCashback: z.number(),
});

export const EnhancedOddsUsageTrackingSchema = z.object({
  type: z.literal('ENHANCED_ODDS'),
  oddsUsed: z.number(),
});

export const CasinoSpinsUsageTrackingSchema = z.object({
  type: z.literal('CASINO_SPINS'),
  spinsUsed: z.number(),
  remainingSpins: z.number(),
});

export const UsageTrackingSchema = z.discriminatedUnion('type', [
  FreeBetUsageTrackingSchema,
  BonusRolloverUsageTrackingSchema,
  BonusNoRolloverUsageTrackingSchema,
  CashbackUsageTrackingSchema,
  EnhancedOddsUsageTrackingSchema,
  CasinoSpinsUsageTrackingSchema,
]);

// =============================================
// INFERRED TYPES
// =============================================

export type FreeBetUsageTracking = z.infer<typeof FreeBetUsageTrackingSchema>;
export type BonusRolloverUsageTracking = z.infer<typeof BonusRolloverUsageTrackingSchema>;
export type BonusNoRolloverUsageTracking = z.infer<typeof BonusNoRolloverUsageTrackingSchema>;
export type CashbackUsageTracking = z.infer<typeof CashbackUsageTrackingSchema>;
export type EnhancedOddsUsageTracking = z.infer<typeof EnhancedOddsUsageTrackingSchema>;
export type CasinoSpinsUsageTracking = z.infer<typeof CasinoSpinsUsageTrackingSchema>;
export type UsageTracking = z.infer<typeof UsageTrackingSchema>;

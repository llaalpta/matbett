/**
 * Qualify Tracking Schemas
 */

import { z } from 'zod';
import {
  BetStatusSchema,
  LegRoleSchema,
} from './enums';
import { jsonDate } from './utils';

// =============================================
// COMMON BET REFERENCE
// =============================================

export const TrackingBetRefSchema = z.object({
  betId: z.string(),
  batchId: z.string().optional(),
  stake: z.number().optional(),
  odds: z.number().optional(),
  profit: z.number().optional(),
  risk: z.number().optional(),
  yield: z.number().optional(),
  status: BetStatusSchema.optional(),
  legRole: LegRoleSchema.optional(),
  placedAt: jsonDate().optional(),
});

export const TrackingDepositRefSchema = z.object({
  depositId: z.string(),
  amount: z.number().min(0).optional(),
  code: z.string().optional(),
  depositedAt: jsonDate().optional(),
});

// =============================================
// QUALIFY TRACKING SCHEMAS
// =============================================

const TrackingAggregateSchema = z.object({
  totalRisk: z.number().default(0),
  totalProfit: z.number().default(0),
  balance: z.number().default(0),
  yield: z.number().default(0),
});

export const DepositQualifyTrackingSchema = z.object({
  type: z.literal('DEPOSIT'),
  qualifyingDepositId: z.string().optional(),
  participatingDeposits: z.array(TrackingDepositRefSchema).default([]),
  totalDepositedAmount: z.number().min(0).default(0),
}).extend(TrackingAggregateSchema.shape);

export const BetQualifyTrackingSchema = z.object({
  type: z.literal('BET'),
  currentAttempts: z.number().min(0),
  attemptedBets: z.array(TrackingBetRefSchema).default([]),
  successfulBetId: z.string().optional(),
}).extend(TrackingAggregateSchema.shape);

export const LossesCashbackQualifyTrackingSchema = z.object({
  type: z.literal('LOSSES_CASHBACK'),
  qualifyingBets: z.array(TrackingBetRefSchema).default([]),
  totalStakes: z.number().min(0),
  totalWinnings: z.number().min(0),
  totalLosses: z.number().min(0),
  calculatedCashbackAmount: z.number().min(0),
  appliedMaxLimit: z.number().min(0),
}).extend(TrackingAggregateSchema.shape);

export const QualifyTrackingSchema = z.discriminatedUnion('type', [
  DepositQualifyTrackingSchema,
  BetQualifyTrackingSchema,
  LossesCashbackQualifyTrackingSchema,
]);

// =============================================
// INFERRED TYPES
// =============================================

export type TrackingBetRef = z.infer<typeof TrackingBetRefSchema>;
export type TrackingDepositRef = z.infer<typeof TrackingDepositRefSchema>;
export type DepositQualifyTracking = z.infer<typeof DepositQualifyTrackingSchema>;
export type BetQualifyTracking = z.infer<typeof BetQualifyTrackingSchema>;
export type LossesCashbackQualifyTracking = z.infer<
  typeof LossesCashbackQualifyTrackingSchema
>;
export type QualifyTracking = z.infer<typeof QualifyTrackingSchema>;

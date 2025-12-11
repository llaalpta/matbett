/**
 * Qualify Tracking Schemas
 */

import { z } from 'zod';
import { QualifyTrackingStatusSchema } from './enums';

// =============================================
// QUALIFY TRACKING SCHEMAS
// =============================================

export const DepositQualifyTrackingSchema = z.object({
  type: z.literal('DEPOSIT'),
  status: QualifyTrackingStatusSchema,
  qualifyingDepositId: z.string().optional(), // Reference to the deposit entity
  depositAmount: z.number().min(0),
  depositCode: z.string().optional(),
  depositedAt: z.date(),
});

export const BetQualifyTrackingSchema = z.object({
  type: z.literal('BET'),
  status: QualifyTrackingStatusSchema,
  attemptedBetIds: z.array(z.string()),
  successfulBetId: z.string().optional(),
  currentAttempts: z.number().min(0),
});

export const LossesCashbackQualifyTrackingSchema = z.object({
  type: z.literal('LOSSES_CASHBACK'),
  status: QualifyTrackingStatusSchema,
  qualifyingBetIds: z.array(z.string()),
  totalStakes: z.number().min(0),
  totalWinnings: z.number().min(0),
  totalLosses: z.number().min(0),
  calculatedCashbackAmount: z.number().min(0),
  appliedMaxLimit: z.number().min(0),
});

export const QualifyTrackingSchema = z.discriminatedUnion('type', [
  DepositQualifyTrackingSchema,
  BetQualifyTrackingSchema,
  LossesCashbackQualifyTrackingSchema,
]);

// =============================================
// INFERRED TYPES
// =============================================

export type DepositQualifyTracking = z.infer<typeof DepositQualifyTrackingSchema>;
export type BetQualifyTracking = z.infer<typeof BetQualifyTrackingSchema>;
export type LossesCashbackQualifyTracking = z.infer<
  typeof LossesCashbackQualifyTrackingSchema
>;
export type QualifyTracking = z.infer<typeof QualifyTrackingSchema>;

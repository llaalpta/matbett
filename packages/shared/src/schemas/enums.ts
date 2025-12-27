/**
 * Enum Schemas
 * Derivados de options - una sola fuente de verdad
 */

import { z } from 'zod';

import {
  getValues,
  // Bookmaker & Betting
  bookmakerOptions,
  betStatusOptions,
  hedgeTypeOptions,
  hedgeModeOptions,
  hedgeRoleOptions,
  optionsOptions, // Import optionsOptions
  // Promotion
  promotionStatusOptions,
  promotionCardinalityOptions,
  promotionAnchorEventOptions,
  // Phase
  phaseStatusOptions,
  phaseAnchorEventOptions,
  activationMethodOptions,
  // Reward
  rewardTypeOptions,
  rewardStatusOptions,
  rewardAnchorEventOptions,
  rewardValueTypeOptions,
  claimMethodOptions,
  rewardFormatTypeOptions,
  // Qualify
  qualifyConditionTypeOptions,
  qualifyConditionStatusOptions,
  qualifyConditionAnchorEventOptions,
  qualifyTrackingStatusOptions,
  rewardQualifyConditionRoleOptions,
  // Bet conditions
  betTypeRestrictionOptions,
  requiredBetOutcomeOptions,
  cashbackCalculationMethodOptions,
  systemTypeRestrictionOptions,
  cashbackRewardPeriodTypeOptions,
  // Usage
  usageTrackingStatusOptions,
  // Timeframe
  timeframeModeOptions,
  entityTypeOptions,
} from '../options';

// =============================================
// BOOKMAKER & BETTING
// =============================================

export const BookmakerSchema = z.enum(getValues(bookmakerOptions));
export type Bookmaker = z.infer<typeof BookmakerSchema>;

export const BetStatusSchema = z.enum(getValues(betStatusOptions));
export type BetStatus = z.infer<typeof BetStatusSchema>;

export const HedgeTypeSchema = z.enum(getValues(hedgeTypeOptions));
export type HedgeType = z.infer<typeof HedgeTypeSchema>;

export const HedgeModeSchema = z.enum(getValues(hedgeModeOptions));
export type HedgeMode = z.infer<typeof HedgeModeSchema>;

export const HedgeRoleSchema = z.enum(getValues(hedgeRoleOptions));
export type HedgeRole = z.infer<typeof HedgeRoleSchema>;

export const OptionsSchema = z.enum(getValues(optionsOptions)); // Add OptionsSchema
export type Options = z.infer<typeof OptionsSchema>; // Add Options type

// =============================================
// PROMOTION
// =============================================

export const PromotionStatusSchema = z.enum(getValues(promotionStatusOptions));
export type PromotionStatus = z.infer<typeof PromotionStatusSchema>;

export const PromotionCardinalitySchema = z.enum(getValues(promotionCardinalityOptions));
export type PromotionCardinality = z.infer<typeof PromotionCardinalitySchema>;

export const PromotionAnchorEventSchema = z.enum(getValues(promotionAnchorEventOptions));
export type PromotionAnchorEvent = z.infer<typeof PromotionAnchorEventSchema>;

// =============================================
// PHASE
// =============================================

export const PhaseStatusSchema = z.enum(getValues(phaseStatusOptions));
export type PhaseStatus = z.infer<typeof PhaseStatusSchema>;

export const PhaseAnchorEventSchema = z.enum(getValues(phaseAnchorEventOptions));
export type PhaseAnchorEvent = z.infer<typeof PhaseAnchorEventSchema>;

export const ActivationMethodSchema = z.enum(getValues(activationMethodOptions));
export type ActivationMethod = z.infer<typeof ActivationMethodSchema>;

// =============================================
// REWARD
// =============================================

export const RewardTypeSchema = z.enum(getValues(rewardTypeOptions));
export type RewardType = z.infer<typeof RewardTypeSchema>;

export const RewardStatusSchema = z.enum(getValues(rewardStatusOptions));
export type RewardStatus = z.infer<typeof RewardStatusSchema>;

export const RewardAnchorEventSchema = z.enum(getValues(rewardAnchorEventOptions));
export type RewardAnchorEvent = z.infer<typeof RewardAnchorEventSchema>;

export const RewardValueTypeSchema = z.enum(getValues(rewardValueTypeOptions));
export type RewardValueType = z.infer<typeof RewardValueTypeSchema>;

export const ClaimMethodSchema = z.enum(getValues(claimMethodOptions));
export type ClaimMethod = z.infer<typeof ClaimMethodSchema>;

export const RewardFormatTypeSchema = z.enum(getValues(rewardFormatTypeOptions));
export type RewardFormatType = z.infer<typeof RewardFormatTypeSchema>;

// =============================================
// QUALIFY CONDITION
// =============================================

export const QualifyConditionTypeSchema = z.enum(getValues(qualifyConditionTypeOptions));
export type QualifyConditionType = z.infer<typeof QualifyConditionTypeSchema>;

export const QualifyConditionStatusSchema = z.enum(getValues(qualifyConditionStatusOptions));
export type QualifyConditionStatus = z.infer<typeof QualifyConditionStatusSchema>;

export const QualifyConditionAnchorEventSchema = z.enum(getValues(qualifyConditionAnchorEventOptions));
export type QualifyConditionAnchorEvent = z.infer<typeof QualifyConditionAnchorEventSchema>;

export const QualifyTrackingStatusSchema = z.enum(getValues(qualifyTrackingStatusOptions));
export type QualifyTrackingStatus = z.infer<typeof QualifyTrackingStatusSchema>;

export const RewardQualifyConditionRoleSchema = z.enum(getValues(rewardQualifyConditionRoleOptions));
export type RewardQualifyConditionRole = z.infer<typeof RewardQualifyConditionRoleSchema>;

// =============================================
// BET CONDITIONS
// =============================================

export const BetTypeRestrictionSchema = z.enum(getValues(betTypeRestrictionOptions));
export type BetTypeRestriction = z.infer<typeof BetTypeRestrictionSchema>;

export const RequiredBetOutcomeSchema = z.enum(getValues(requiredBetOutcomeOptions));
export type RequiredBetOutcome = z.infer<typeof RequiredBetOutcomeSchema>;

export const CashbackCalculationMethodSchema = z.enum(getValues(cashbackCalculationMethodOptions));
export type CashbackCalculationMethod = z.infer<typeof CashbackCalculationMethodSchema>;

export const SystemTypeRestrictionSchema = z.enum(getValues(systemTypeRestrictionOptions));
export type SystemTypeRestriction = z.infer<typeof SystemTypeRestrictionSchema>;

export const CashbackRewardPeriodTypeSchema = z.enum(getValues(cashbackRewardPeriodTypeOptions));
export type CashbackRewardPeriodType = z.infer<typeof CashbackRewardPeriodTypeSchema>;

// =============================================
// USAGE TRACKING
// =============================================

export const UsageTrackingStatusSchema = z.enum(getValues(usageTrackingStatusOptions));
export type UsageTrackingStatus = z.infer<typeof UsageTrackingStatusSchema>;

// =============================================
// TIMEFRAME
// =============================================

export const TimeframeModeSchema = z.enum(getValues(timeframeModeOptions)); // Add TimeframeModeSchema
export type TimeframeMode = z.infer<typeof TimeframeModeSchema>; // Add TimeframeMode type

export const EntityTypeSchema = z.enum(getValues(entityTypeOptions));
export type EntityType = z.infer<typeof EntityTypeSchema>;

export const AnchorEventSchema = z.union([ // Add AnchorEventSchema
  RewardAnchorEventSchema,
  PhaseAnchorEventSchema,
  PromotionAnchorEventSchema,
  QualifyConditionAnchorEventSchema,
]);
export type AnchorEvent = z.infer<typeof AnchorEventSchema>; // Add AnchorEvent type

/**
 * Enum Schemas
 * Derivados de options - una sola fuente de verdad
 */

import { z } from 'zod';

import {
  getValues,
  bookmakerAccountTypeOptions,
  // Bookmaker & Bet registration
  betStatusOptions,
  strategyKindOptions,
  strategyTypeOptions,
  hedgeModeOptions,
  hedgeRoleOptions,
  optionsOptions,
  betLineModeOptions,
  betParticipationKindOptions,
  depositParticipationRoleOptions,
  hedgeAdjustmentTypeOptions,
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
  rewardQualifyConditionRoleOptions,
  // Bet conditions
  betTypeRestrictionOptions,
  requiredBetOutcomeOptions,
  cashbackCalculationMethodOptions,
  systemTypeRestrictionOptions,
  cashbackRewardPeriodTypeOptions,
  // Timeframe
  timeframeModeOptions,
  entityTypeOptions,
} from '../options';
import { scenarioIds } from './bet-scenarios';

// =============================================
// BOOKMAKER & BET REGISTRATION
// =============================================

export const BookmakerAccountTypeSchema = z.enum(
  getValues(bookmakerAccountTypeOptions)
);
export type BookmakerAccountType = z.infer<typeof BookmakerAccountTypeSchema>;

export const BookmakerSchema = z.string().min(1);
export type Bookmaker = z.infer<typeof BookmakerSchema>;

export const BetStatusSchema = z.enum(getValues(betStatusOptions));
export type BetStatus = z.infer<typeof BetStatusSchema>;

export const StrategyKindSchema = z.enum(getValues(strategyKindOptions));
export type StrategyKind = z.infer<typeof StrategyKindSchema>;

export const StrategyTypeSchema = z.enum(getValues(strategyTypeOptions));
export type StrategyType = z.infer<typeof StrategyTypeSchema>;

export const HedgeModeSchema = z.enum(getValues(hedgeModeOptions));
export type HedgeMode = z.infer<typeof HedgeModeSchema>;

export const LegRoleSchema = z.enum(getValues(hedgeRoleOptions));
export type LegRole = z.infer<typeof LegRoleSchema>;

export const HedgeRoleSchema = LegRoleSchema;
export type HedgeRole = LegRole;

export const OptionsSchema = z.enum(getValues(optionsOptions));
export type Options = z.infer<typeof OptionsSchema>;

export const BetLineModeSchema = z.enum(getValues(betLineModeOptions));
export type BetLineMode = z.infer<typeof BetLineModeSchema>;

export const BetParticipationKindSchema = z.enum(getValues(betParticipationKindOptions));
export type BetParticipationKind = z.infer<typeof BetParticipationKindSchema>;

export const BetParticipationRoleSchema = BetParticipationKindSchema;
export type BetParticipationRole = BetParticipationKind;

export const DepositParticipationRoleSchema = z.enum(getValues(depositParticipationRoleOptions));
export type DepositParticipationRole = z.infer<typeof DepositParticipationRoleSchema>;

export const HedgeAdjustmentTypeSchema = z.enum(getValues(hedgeAdjustmentTypeOptions));
export type HedgeAdjustmentType = z.infer<typeof HedgeAdjustmentTypeSchema>;

export const ScenarioIdSchema = z.enum(scenarioIds);
export type ScenarioId = z.infer<typeof ScenarioIdSchema>;

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
// TIMEFRAME
// =============================================

export const TimeframeModeSchema = z.enum(getValues(timeframeModeOptions));
export type TimeframeMode = z.infer<typeof TimeframeModeSchema>;

export const EntityTypeSchema = z.enum(getValues(entityTypeOptions));
export type EntityType = z.infer<typeof EntityTypeSchema>;

export const AnchorEventSchema = z.union([
  RewardAnchorEventSchema,
  PhaseAnchorEventSchema,
  PromotionAnchorEventSchema,
  QualifyConditionAnchorEventSchema,
]);
export type AnchorEvent = z.infer<typeof AnchorEventSchema>;

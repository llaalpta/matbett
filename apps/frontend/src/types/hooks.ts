// src/types/hooks.ts

// =============================================
// TIPOS PARA HOOKS
// =============================================

import type { AnchorCatalog, AnchorOccurrences } from "@matbett/shared";
import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";

import type { RouterInputs, RouterOutputs } from "@/lib/trpc";

// =============================================
// tRPC-derived Form Data and Server Models
// =============================================

// Level 0: Promotion
export type PromotionFormData = RouterInputs["promotion"]["create"];
export type PromotionServerModel = RouterOutputs["promotion"]["getById"];
export type PromotionUpdateInput = RouterInputs["promotion"]["update"];
export type PromotionListResponse = RouterOutputs["promotion"]["list"];

// Level 1: Phase
export type PhaseFormData = PromotionFormData["phases"][number];
export type PhaseServerModel = NonNullable<PromotionServerModel>["phases"][number];

// Level 2: Reward
export type RewardFormData = PhaseFormData["rewards"][number];
export type RewardServerModel = NonNullable<PhaseServerModel>["rewards"][number];

// Level 3: Qualify Conditions
// ⚠️ QualifyCondition FormData (INPUT) - sin tracking
export type RewardQualifyConditionFormData = RewardFormData["qualifyConditions"][number];
// ⚠️ QualifyCondition ServerModel (OUTPUT) - con tracking
export type RewardQualifyConditionServerModel = NonNullable<RewardServerModel>["qualifyConditions"][number];
// ⚠️ Tracking SOLO existe en ServerModel - NO se usa en formularios
// Se infiere directamente desde outputs del backend, no desde FormData

// Level 3: Usage Conditions & Tracking
// ⚠️ UsageConditions existe en FormData (INPUT) - usuario lo configura
export type RewardUsageConditionsFormData = RewardFormData['usageConditions'];
export type RewardUsageConditionsServerModel = NonNullable<RewardServerModel>['usageConditions'];

// ⚠️ UsageTracking SOLO existe en ServerModel (OUTPUT) - calculado por backend
export type RewardUsageTrackingServerModel = NonNullable<RewardServerModel>['usageTracking'];

// Further breakdown for convenience - Usage Conditions (INPUT)
export type FreeBetRewardUsageConditionsFormData = Extract<RewardUsageConditionsFormData, { type: 'FREEBET' }>;
export type CashbackRewardUsageConditionsFormData = Extract<RewardUsageConditionsFormData, { type: 'CASHBACK_FREEBET' }>;
export type BonusRolloverRewardUsageConditionsFormData = Extract<RewardUsageConditionsFormData, { type: 'BET_BONUS_ROLLOVER' }>;
export type BonusNoRolloverRewardUsageConditionsFormData = Extract<RewardUsageConditionsFormData, { type: 'BET_BONUS_NO_ROLLOVER' }>;
export type EnhancedOddsRewardUsageConditionsFormData = Extract<RewardUsageConditionsFormData, { type: 'ENHANCED_ODDS' }>;
export type CasinoSpinsRewardUsageConditionsFormData = Extract<RewardUsageConditionsFormData, { type: 'CASINO_SPINS' }>;

// Further breakdown for convenience - Usage Tracking (OUTPUT only)
export type FreeBetRewardUsageTrackingServerModel = Extract<RewardUsageTrackingServerModel, { type: 'FREEBET' }>;
export type CashbackRewardUsageTrackingServerModel = Extract<RewardUsageTrackingServerModel, { type: 'CASHBACK_FREEBET' }>;
export type BonusRolloverRewardUsageTrackingServerModel = Extract<RewardUsageTrackingServerModel, { type: 'BET_BONUS_ROLLOVER' }>;
export type BonusNoRolloverRewardUsageTrackingServerModel = Extract<RewardUsageTrackingServerModel, { type: 'BET_BONUS_NO_ROLLOVER' }>;
export type EnhancedOddsRewardUsageTrackingServerModel = Extract<RewardUsageTrackingServerModel, { type: 'ENHANCED_ODDS' }>;
export type CasinoSpinsRewardUsageTrackingServerModel = Extract<RewardUsageTrackingServerModel, { type: 'CASINO_SPINS' }>;

// Further breakdown for convenience - QualifyCondition ServerModels by type (OUTPUT only)
export type DepositQualifyConditionServerModel = Extract<RewardQualifyConditionServerModel, { type: 'DEPOSIT' }>;
export type BetQualifyConditionServerModel = Extract<RewardQualifyConditionServerModel, { type: 'BET' }>;
export type LossesCashbackQualifyConditionServerModel = Extract<RewardQualifyConditionServerModel, { type: 'LOSSES_CASHBACK' }>;

// Standalone Entities
export type DepositFormData = RouterInputs['deposit']['create'];
export type DepositServerModel = RouterOutputs['deposit']['getById'];


// =============================================
// usePromotionForm RETURN TYPE
// =============================================

/**
 * Tipo de retorno del Hook Factory (solo el formulario RHF)
 */
export type UsePromotionFormReturn = UseFormReturn<PromotionFormData>;

// =============================================
// usePromotionLogic RETURN TYPE
// =============================================

/**
 * Tipo de retorno del Hook de Lógica de Dominio
 * Contiene estado, acciones y helpers de UI
 */
export type UsePromotionLogicReturn = {
  // Array methods
  phasesFieldArray: UseFieldArrayReturn<PromotionFormData, "phases">;
  addPhase: () => void;
  removePhase: (index: number) => void;

  // Business Logic State
  isSinglePhase: boolean;
  hasDataInAdditionalPhases: () => boolean;
  canRemovePhase: (index: number) => boolean;
  getPhaseRemoveDisabledReason: (index: number) => string | undefined;

  // Actions
  handleCardinalityChange: (value: PromotionFormData["cardinality"]) => void;
  removeAdditionalPhases: () => void;
  resetFormToDefaults: () => void;

  anchorCatalog?: AnchorCatalog;
  anchorOccurrences?: AnchorOccurrences;
  handleNameChange: (value: string | number | undefined) => void;
  handleDescriptionChange: (value: string | undefined) => void;
};



// src/types/hooks.ts

// =============================================
// TIPOS PARA HOOKS
// =============================================

import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import type { AvailableTimeframes } from "@matbett/shared";

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

  // Actions
  handleCardinalityChange: (value: string) => void;
  removeAdditionalPhases: () => void;
  resetFormToDefaults: () => void;
  // calculateRelativeEndDate: (start: string | Date, days: number) => string; // Eliminado

  // UI Tracking State
  trackingState: {
    promotionId?: string;
    phaseId?: string;
    phaseIndex?: number;
    rewardId?: string;
    rewardIndex?: number;
    qualifyConditionId?: string;
    qualifyConditionIndex?: number;
  };

  // Setters de UI (básicos)
  setPhase: (id: string, index: number) => void;
  setReward: (id: string, index: number) => void;
  setQualifyCondition: (id: string, index: number) => void;

  // Paths Helpers
  getQualifyConditionPath: () => string | null;
  getRewardPath: () => string | null;
  getPhasePath: () => string | null;

  // Data reference
  serverData?: PromotionServerModel;
  availableTimeframes?: AvailableTimeframes;

  // Helpers de Extracción de ServerData
  getPhaseServerData: () => PhaseServerModel | undefined;
  getRewardServerData: () => RewardServerModel | undefined;
  getConditionServerData: () => RewardQualifyConditionServerModel | undefined;

  // Estado y Handlers de UI (Modals y Dialogs)
  isDepositModalOpen: boolean;
  openDepositModal: () => void;
  closeDepositModal: () => void;
  showConfirmDialog: boolean;
  setShowConfirmDialog: (value: boolean) => void;

  // Handlers UI Completos (Reutilizables)
  handleQualifyConditionSelect: (id: string, index: number) => void;
  handlePhaseTabChange: (value: string) => void;
  handleSinglePhaseToggle: (value: string) => void;
  handleConfirmToggle: () => void;
  handleFormSubmit: (data: PromotionFormData) => PromotionFormData;
  handleNameChange: (value: string | number | undefined) => void;
  handleDescriptionChange: (value: string | undefined) => void;
  // ❌ handleQualifyConditionValueTypeChange eliminado - ahora en useQualifyConditionLogic
};
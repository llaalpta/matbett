// =============================================
// UI & FORM STATE MODELS
// Tipos exclusivos del Frontend para manejo de estado visual y formularios
// =============================================

import type { 
  RewardQualifyConditionRole, 
  EntityType, 
  AnchorEvent 
} from '@matbett/shared';

import type { RewardQualifyConditionFormData } from './hooks';

// =============================================
// TIMEFRAME UI STATE
// =============================================

/**
 * Anchor simplificado para formularios (UI State).
 * A diferencia del DTO del backend, este no necesita toda la info, solo lo que el usuario selecciona.
 */
export interface TimeframeAnchorForm {
  entityType: EntityType;
  entityId: string;
  event: AnchorEvent;
}

// =============================================
// PROMOTION CONTEXT (UI)
// =============================================

export interface BasePromotionContext {
  promotionId: string;
  phaseId?: string;
}

/**
 * Contexto de UI para el proceso de calificación de rewards.
 * Usado para saber qué reward se está procesando en el wizard/modal.
 */
export interface QualifyConditionContext extends BasePromotionContext {
  role: RewardQualifyConditionRole;
  qualifyConditionId: string;
  generatedRewardIds: string[];
}

// =============================================
// FORM DATA HELPERS (Type Narrowing)
// =============================================

export type RewardDepositQualifyConditionFormData = Extract<
  RewardQualifyConditionFormData,
  { type: 'DEPOSIT' }
>;

export type RewardBetQualifyConditionFormData = Extract<
  RewardQualifyConditionFormData,
  { type: 'BET' }
>;

export type RewardLossesCashbackQualifyConditionFormData = Extract<
  RewardQualifyConditionFormData,
  { type: 'LOSSES_CASHBACK' }
>;

/**
 * @matbett/shared
 * Paquete compartido entre frontend y backend
 */

// =============================================
// OPTIONS (para UI - Exportaciones explícitas)
// =============================================

export { 
  bookmakerOptions,
  betStatusOptions,
  hedgeTypeOptions,
  hedgeModeOptions,
  hedgeRoleOptions,
  optionsOptions,
  promotionStatusOptions,
  promotionCardinalityOptions,
  promotionAnchorEventOptions,
  phaseStatusOptions,
  phaseAnchorEventOptions,
  activationMethodOptions,
  rewardTypeOptions,
  rewardStatusOptions,
  rewardAnchorEventOptions,
  rewardValueTypeOptions,
  enhancedOddsModeOptions,
  claimMethodOptions,
  rewardFormatTypeOptions,
  qualifyConditionTypeOptions,
  qualifyConditionStatusOptions,
  qualifyConditionAnchorEventOptions,
  rewardQualifyConditionRoleOptions,
  qualifyTrackingStatusOptions,
  betTypeRestrictionOptions,
  requiredBetOutcomeOptions,
  rolloverContributionWalletOptions,
  cashbackCalculationMethodOptions,
  systemTypeRestrictionOptions,
  cashbackRewardPeriodTypeOptions,
  usageTrackingStatusOptions,
  timeframeModeOptions,
  entityTypeOptions,
  getAnchorEventLabel,
  getLabel,
  getValues 
} from './options';

export type { SelectOption } from './options';

// =============================================
// SCHEMAS Y TIPOS (fuente de verdad)
// =============================================

// Exportar todo lo de schemas excepto lo que pueda chocar (aunque Zod schemas suelen tener nombres distintos)
export * from './schemas';

/**
 * @matbett/shared
 * Paquete compartido entre frontend y backend
 */

// =============================================
// OPTIONS (para UI - Exportaciones explícitas)
// =============================================

export { 
  bookmakerAccountTypeOptions,
  bookmakerOptions,
  betStatusOptions,
  strategyKindOptions,
  strategyTypeOptions,
  hedgeModeOptions,
  hedgeRoleOptions,
  optionsOptions,
  betLineModeOptions,
  betParticipationKindOptions,
  hedgeAdjustmentTypeOptions,
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
  depositParticipationRoleOptions,
  betTypeRestrictionOptions,
  requiredBetOutcomeOptions,
  rolloverContributionWalletOptions,
  cashbackCalculationMethodOptions,
  systemTypeRestrictionOptions,
  cashbackRewardPeriodTypeOptions,
  timeframeModeOptions,
  entityTypeOptions,
  getAnchorEventLabel,
  getLabel,
  getValues 
} from './options';

export type { SelectOption } from './options';
export { getScenarioNaturalLabel } from './utils/scenarioDisplay';
export * from './utils/timeframeDisplay';

// =============================================
// SCHEMAS Y TIPOS (fuente de verdad)
// =============================================

// Exportar todo lo de schemas excepto lo que pueda chocar (aunque Zod schemas suelen tener nombres distintos)
export * from './schemas';

// =============================================
// DOMAIN POLICIES
// =============================================

export * from './domain/lifecycle';

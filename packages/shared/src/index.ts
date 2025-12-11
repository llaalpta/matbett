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
  claimMethodOptions,
  rewardFormatTypeOptions,
  qualifyConditionTypeOptions,
  qualifyConditionStatusOptions,
  rewardQualifyConditionRoleOptions,
  qualifyTrackingStatusOptions,
  betTypeRestrictionOptions,
  requiredBetOutcomeOptions,
  cashbackCalculationMethodOptions,
  systemTypeRestrictionOptions,
  cashbackRewardPeriodTypeOptions,
  usageTrackingStatusOptions,
  timeframeModeOptions,
  entityTypeOptions,
  getLabel,
  getValues 
} from './options';

export type { SelectOption } from './options';

// =============================================
// SCHEMAS Y TIPOS (fuente de verdad)
// =============================================

// Exportar todo lo de schemas excepto lo que pueda chocar (aunque Zod schemas suelen tener nombres distintos)
export * from './schemas';
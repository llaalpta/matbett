/**
 * Options para Selects
 * Arrays listos para usar en componentes <Select>
 *
 * Preparado para i18n: cuando traduzcas, solo cambia los labels aquí
 * Ejemplo futuro: { value: 'ACTIVE', label: t('promotionStatus.ACTIVE') }
 */

// =============================================
// HELPER TYPE
// =============================================

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
};

// =============================================
// BOOKMAKER
// =============================================

export const bookmakerOptions = [
  { value: 'bookmaker1', label: '888sports' },
  { value: 'bookmaker2', label: 'Admiralbet' },
  { value: 'bookmaker3', label: 'Bet365' },
  { value: 'bookmaker4', label: 'Betfair Exchange' },
  { value: 'bookmaker5', label: 'Betfair Sportbook' },
  { value: 'bookmaker6', label: 'Betway' },
  { value: 'bookmaker7', label: 'Bwin' },
  { value: 'bookmaker8', label: 'Casumo' },
  { value: 'bookmaker9', label: 'Codere' },
  { value: 'bookmaker10', label: 'Efbet' },
  { value: 'bookmaker11', label: 'Goldenpark' },
  { value: 'bookmaker12', label: 'Jokerbet' },
  { value: 'bookmaker13', label: 'Juegging' },
  { value: 'bookmaker14', label: 'Kirolbet' },
  { value: 'bookmaker15', label: 'Leovegas' },
  { value: 'bookmaker16', label: 'Luckia' },
  { value: 'bookmaker17', label: 'Marathonbet' },
  { value: 'bookmaker18', label: 'Marcaapuestas' },
  { value: 'bookmaker19', label: 'Paf' },
  { value: 'bookmaker20', label: 'Paston' },
  { value: 'bookmaker21', label: 'Pokerstars' },
  { value: 'bookmaker22', label: 'Retabet' },
  { value: 'bookmaker23', label: 'Sportium' },
  { value: 'bookmaker24', label: 'Versus' },
  { value: 'bookmaker25', label: 'William Hill' },
  { value: 'bookmaker26', label: 'Winamax' },
  { value: 'bookmaker27', label: 'Yaass' },
  { value: 'bookmaker28', label: 'Zebet' },
];
export type Bookmaker = (typeof bookmakerOptions)[number]['value'];

// =============================================
// BET STATUS
// =============================================

export const betStatusOptions = [
  { value: 'OPEN', label: 'Abierta' },
  { value: 'WON', label: 'Ganada' },
  { value: 'LOST', label: 'Perdida' },
  { value: 'VOID', label: 'Anulada' },
  { value: 'CASHOUT', label: 'Cash Out' },
];
export type BetStatus = (typeof betStatusOptions)[number]['value'];

// =============================================
// HEDGE
// =============================================

export const hedgeTypeOptions = [
  { value: 'NONE', label: 'Sin red' },
  { value: 'MATCHED_BETTING', label: 'Matched Betting' },
  { value: 'DUTCHING', label: 'Arbitraje' },
];
export type HedgeType = (typeof hedgeTypeOptions)[number]['value'];

export const hedgeModeOptions = [
  { value: 'OVERLAY', label: 'Overlay' },
  { value: 'UNDERLAY', label: 'Underlay' },
  { value: 'STANDARD', label: 'Estándar' },
];
export type HedgeMode = (typeof hedgeModeOptions)[number]['value'];

export const hedgeRoleOptions = [
  { value: 'MAIN', label: 'BackBet' },
  { value: 'HEDGE1', label: 'LayBet' },
  { value: 'HEDGE2', label: 'LayBet2' },
  { value: 'HEDGE3', label: 'LayBet3' },
];
export type HedgeRole = (typeof hedgeRoleOptions)[number]['value'];

export const optionsOptions = [
  { value: 'TWO_OPTIONS', label: '2 opciones' },
  { value: 'THREE_OPTIONS', label: '3 opciones' },
  { value: 'MULTIPLE_OPTIONS', label: 'Múltiples opciones' },
];
export type Options = (typeof optionsOptions)[number]['value'];

// =============================================
// PROMOTION
// =============================================

export const promotionStatusOptions = [
  { value: 'NOT_STARTED', label: 'No iniciada' },
  { value: 'ACTIVE', label: 'Activa' },
  { value: 'COMPLETED', label: 'Completada' },
  { value: 'EXPIRED', label: 'Expirada' },
];
export type PromotionStatus = (typeof promotionStatusOptions)[number]['value'];

export const promotionCardinalityOptions = [
  { value: 'SINGLE', label: 'Fase única' },
  { value: 'MULTIPLE', label: 'Múltiples fases' },
];
export type PromotionCardinality = (typeof promotionCardinalityOptions)[number]['value'];

export const promotionAnchorEventOptions = [
  { value: 'ACTIVE', label: 'Inicio de promoción' },
  { value: 'COMPLETED', label: 'Completación de promoción' },
  { value: 'EXPIRED', label: 'Expiración de promoción' },
];
export type PromotionAnchorEvent = (typeof promotionAnchorEventOptions)[number]['value'];

// =============================================
// PHASE
// =============================================

export const phaseStatusOptions = [
  { value: 'NOT_STARTED', label: 'No iniciada' },
  { value: 'ACTIVE', label: 'Activa' },
  { value: 'COMPLETED', label: 'Completada' },
  { value: 'EXPIRED', label: 'Expirada' },
];
export type PhaseStatus = (typeof phaseStatusOptions)[number]['value'];

export const phaseAnchorEventOptions = [
  { value: 'ACTIVE', label: 'Inicio de fase' },
  { value: 'COMPLETED', label: 'Completación de fase' },
  { value: 'EXPIRED', label: 'Expiración de fase' },
];
export type PhaseAnchorEvent = (typeof phaseAnchorEventOptions)[number]['value'];

export const activationMethodOptions = [
  { value: 'CLICK', label: 'Click' },
  { value: 'EXTERNAL_URL', label: 'URL externa' },
  { value: 'IN_APP', label: 'En la app' },
  { value: 'AUTOMATIC', label: 'Automático' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'OPT_IN', label: 'Opt-in' },
  { value: 'CODE_REQUIRED', label: 'Código requerido' },
];
export type ActivationMethod = (typeof activationMethodOptions)[number]['value'];

// =============================================
// REWARD
// =============================================

export const rewardTypeOptions = [
  { value: 'FREEBET', label: 'Freebet' },
  { value: 'CASHBACK_FREEBET', label: 'Cashback en freebet' },
  { value: 'BET_BONUS_ROLLOVER', label: 'Bono de apuestas con rollover' },
  { value: 'BET_BONUS_NO_ROLLOVER', label: 'Bono de apuestas sin rollover' },
  { value: 'ENHANCED_ODDS', label: 'Cuotas mejoradas' },
  { value: 'CASINO_SPINS', label: 'Giros de casino' },
];
export type RewardType = (typeof rewardTypeOptions)[number]['value'];

export const rewardStatusOptions = [
  { value: 'QUALIFYING', label: 'Calificando - condiciones pendientes' },
  { value: 'PENDING_TO_CLAIM', label: 'Condiciones cumplidas - Pendiente de reclamar' },
  { value: 'CLAIMED', label: 'Reclamada - Pendiente de recibir' },
  { value: 'RECEIVED', label: 'Recibida, disponible para uso' },
  { value: 'IN_USE', label: 'En uso' },
  { value: 'USED', label: 'Usada' },
  { value: 'EXPIRED', label: 'Caducada' },
];
export type RewardStatus = (typeof rewardStatusOptions)[number]['value'];

export const rewardAnchorEventOptions = [
  { value: 'PENDING_TO_CLAIM', label: 'Cumplimiento de condiciones' },
  { value: 'CLAIMED', label: 'Reclamación de recompensa' },
  { value: 'RECEIVED', label: 'Recepción de recompensa' },
  { value: 'IN_USE', label: 'Inicio de uso' },
  { value: 'USED', label: 'Fin de uso' },
  { value: 'EXPIRED', label: 'Expiración' },
];
export type RewardAnchorEvent = (typeof rewardAnchorEventOptions)[number]['value'];

export const rewardValueTypeOptions = [
  { value: 'FIXED', label: 'Valor Fijo' },
  { value: 'CALCULATED_FROM_CONDITIONS', label: 'Calculado desde Condiciones' },
];
export type RewardValueType = (typeof rewardValueTypeOptions)[number]['value'];

export const claimMethodOptions = [
  { value: 'AUTOMATIC', label: 'Automático' },
  { value: 'MANUAL_CLICK', label: 'Click Manual' },
  { value: 'MANUAL_CODE', label: 'Código Manual' },
  { value: 'CUSTOMER_SERVICE', label: 'Servicio al Cliente' },
];
export type ClaimMethod = (typeof claimMethodOptions)[number]['value'];

// =============================================
// QUALIFY CONDITION
// =============================================

export const qualifyConditionTypeOptions = [
  { value: 'DEPOSIT', label: 'Depósito' },
  { value: 'BET', label: 'Apuesta' },
  { value: 'LOSSES_CASHBACK', label: 'Cashback de pérdidas' },
];
export type QualifyConditionType = (typeof qualifyConditionTypeOptions)[number]['value'];

export const qualifyConditionStatusOptions = [
  { value: 'QUALIFYING', label: 'Calificando - en progreso' },
  { value: 'PENDING', label: 'Pendiente - sin iniciar' },
  { value: 'FULFILLED', label: 'Cumplida' },
  { value: 'FAILED', label: 'Fallida' },
];
export type QualifyConditionStatus = (typeof qualifyConditionStatusOptions)[number]['value'];

export const rewardQualifyConditionRoleOptions = [
  { value: 'QUALIFY_FOR_FREEBET', label: 'Calificar para Freebet' },
  { value: 'QUALIFY_FOR_BONUS', label: 'Calificar para Bono' },
  { value: 'QUALIFY_FOR_CASHBACK', label: 'Calificar para Cashback' },
  { value: 'QUALIFY_FOR_REAL_MONEY', label: 'Calificar para Dinero Real' },
  { value: 'QUALIFY_FOR_ENHANCED_ODDS', label: 'Calificar para Cuotas Mejoradas' },
];
export type RewardQualifyConditionRole = (typeof rewardQualifyConditionRoleOptions)[number]['value'];

// =============================================
// QUALIFY TRACKING
// =============================================

export const qualifyTrackingStatusOptions = [
  { value: 'TRACKING', label: 'Seguimiento en curso' },
  { value: 'QUALIFIED', label: 'Condición cumplida' },
  { value: 'FAILED', label: 'Condición fallida' },
  { value: 'EXPIRED', label: 'Tiempo agotado' },
];
export type QualifyTrackingStatus = (typeof qualifyTrackingStatusOptions)[number]['value'];

// =============================================
// BET CONDITIONS
// =============================================

export const betTypeRestrictionOptions = [
  { value: 'ANY', label: 'Cualquiera' },
  { value: 'SINGLE', label: 'Simple' },
  { value: 'MULTIPLE', label: 'Múltiple' },
  { value: 'SYSTEM', label: 'Sistema' },
  { value: 'LIVE', label: 'En vivo' },
  { value: 'PRE_MATCH', label: 'Pre-partido' },
];
export type BetTypeRestriction = (typeof betTypeRestrictionOptions)[number]['value'];

export const requiredBetOutcomeOptions = [
  { value: 'WIN', label: 'Ganada' },
  { value: 'LOSE', label: 'Perdida' },
  { value: 'VOID', label: 'Anulada' },
  { value: 'ANY', label: 'Cualquiera' },
];
export type RequiredBetOutcome = (typeof requiredBetOutcomeOptions)[number]['value'];

export const cashbackCalculationMethodOptions = [
  { value: 'NET_LOSS', label: 'Pérdida neta' },
  { value: 'GROSS_LOSS', label: 'Pérdida bruta' },
  { value: 'STAKES_ONLY', label: 'Solo stakes' },
  { value: 'PERCENTAGE_OF_LOSS', label: 'Porcentaje de la pérdida' },
];
export type CashbackCalculationMethod = (typeof cashbackCalculationMethodOptions)[number]['value'];

export const systemTypeRestrictionOptions = [
  { value: 'ANY', label: 'Ninguno' },
  { value: 'TRIXIE', label: 'Trixie' },
  { value: 'YANKEE', label: 'Yankee' },
  { value: 'PATENT', label: 'Patent' },
  { value: 'OTHER', label: 'Otro' },
];
export type SystemTypeRestriction = (typeof systemTypeRestrictionOptions)[number]['value'];

export const cashbackRewardPeriodTypeOptions = [
  { value: 'CUSTOM', label: 'Personalizado' },
  { value: 'DAILY', label: 'Diario' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensual' },
  { value: 'EVENT_DURATION', label: 'Duración del evento' },
];
export type CashbackRewardPeriodType = (typeof cashbackRewardPeriodTypeOptions)[number]['value'];

export const rewardFormatTypeOptions = [
  { value: 'FREEBET', label: 'Freebet' },
  { value: 'BONUS', label: 'Bono' },
  { value: 'REAL_MONEY', label: 'Dinero real' },
];
export type RewardFormatType = (typeof rewardFormatTypeOptions)[number]['value'];

// =============================================
// USAGE TRACKING
// =============================================

export const usageTrackingStatusOptions = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'EXPIRED', label: 'Expirado' },
  { value: 'FAILED', label: 'Fallido' },
];
export type UsageTrackingStatus = (typeof usageTrackingStatusOptions)[number]['value'];

// =============================================
// TIMEFRAME
// =============================================

export const timeframeModeOptions = [
  { value: 'ABSOLUTE', label: 'Fijo' },
  { value: 'RELATIVE', label: 'Relativo a evento' },
  { value: 'PROMOTION', label: 'Mientras dure la promoción' },
];
export type TimeframeMode = (typeof timeframeModeOptions)[number]['value'];

export const entityTypeOptions = [
  { value: 'REWARD', label: 'Reward' },
  { value: 'PHASE', label: 'Phase' },
  { value: 'PROMOTION', label: 'Promotion' },
];
export type EntityType = (typeof entityTypeOptions)[number]['value'];

// =============================================
// ANCHOR EVENT UNION TYPE
// =============================================

export type AnchorEvent = RewardAnchorEvent | PhaseAnchorEvent | PromotionAnchorEvent;

// =============================================
// HELPER: Get label by value
// =============================================

export function getLabel<T extends string>(
  options: readonly SelectOption<T>[],
  value: T
): string {
  const option = options.find((o) => o.value === value);
  return option?.label ?? value;
}

// =============================================
// HELPER: Get values array (for Zod schemas)
// =============================================

export function getValues<T extends string>(
  options: readonly SelectOption<T>[]
): [T, ...T[]] {
  const values = options.map((o) => o.value);
  return values as [T, ...T[]];
}

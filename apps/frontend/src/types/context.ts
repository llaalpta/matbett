// =============================================
// CONTEXTO JERÁRQUICO PARA ENDPOINTS REST
// =============================================

// Estos contextos se usan para construir URLs jerárquicas en endpoints REST
// Para contextos de API/submit, ver rewardQualifyConditions.ts y bet.ts

export interface DepositTrackingContext {
  promotionId: string;
  phaseId: string;
  rewardId: string;
  qualifyConditionId: string;
}

export interface BetTrackingContext {
  promotionId: string;
  phaseId: string;
  rewardId: string;
}

// =============================================
// TIPOS PARA CALCULADORAS Y ANÁLISIS
// =============================================

/**
 * Resultado del análisis de rentabilidad de un bono (Rollover)
 * Usado en la UI de simulaciones.
 */
export interface ProfitabilityAnalysis {
  expectedValue: number;
  totalRolloverRequired: number;
  estimatedLoss: number;
  requiredBankroll: number;
  recommendedBets: number;
  recommendedBetSizes: number[];
  recommendedStrategy: "UNDERLAY_FIRST" | "STANDARD_ONLY" | "AVOID";
  firstBetAmount?: number;
  
  // Configuración original que determina restricciones
  bonusValue: number;
  depositRequired: number;
  maxConversionMultiplier: number; 
  minOdds: number;
  maxStake?: number;
  minBetsRequired: number;
  onlyBonusMoneyCountsForRollover: boolean;
  onlyRealMoneyCountsForRollover: boolean;
  allowDepositsAfterActivation: boolean;
  expectedLossPercentage: number;
  
  // Factores que determinan si se puede usar underlay
  restrictions: {
    conversionBlocksUnderlay: boolean;
    minOddsTooHigh: boolean;
    hasStakeLimit: boolean;
    tooManyBetsRequired: boolean;
    mustUseRealMoneyOnly: boolean;
  };
  
  metadata: {
    canUseUnderlay: boolean;
    rolloverMultiplier: number;
    estimatedROI: number;
    estimatedExchangeCapital: number;
    exchangeRiskPerEuro: number;
    exchangeCapitalFirstBet?: number;
    totalHouseCapitalIfNoDeposits?: number;
    totalCapitalNeeded: number;
    underlayScenario?: {
      successProfit: number;
      failureProfit: number;
      additionalBankrollIfFails: number;
      additionalExchangeCapital: number;
      successProbability: number;
    };
    recommendedOddsRange?: {
      min: number;
      max: number;
      optimal: number;
    };
    standardMethodInfo?: {
      mustUseRealMoneyOnly: boolean;
      mustDepositBeforeActivation: boolean;
      totalRealMoneyNeeded: number;
      rolloverVsBonusRatio: number;
      estimatedNetProfit: number;
    };
  };
}

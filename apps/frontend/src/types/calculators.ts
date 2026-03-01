// =============================================
// TIPOS PARA CALCULADORAS Y ANALISIS
// =============================================

/**
 * Resultado del analisis de rentabilidad de un bono (Rollover)
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

  // Configuracion original que determina restricciones
  bonusValue: number;
  depositRequired: number;
  maxConversionMultiplier?: number;
  maxConvertibleAmount?: number;
  minOdds?: number;
  maxStake?: number;
  minBetsRequired: number;
  rolloverContributionWallet: "BONUS_ONLY" | "REAL_ONLY" | "MIXED";
  allowDepositsAfterActivation: boolean;
  expectedLossPercentage: number;

  // Factores que determinan si se puede usar underlay
  restrictions: {
    conversionBlocksUnderlay: boolean;
    invalidOddsRange: boolean;
    stakeLimitsBlockPlan: boolean;
    stakeLimitBlocksInitialUnderlay: boolean;
    bonusCannotBeUsedForBetting: boolean;
    tooManyBetsRequired: boolean;
    mustUseRealMoneyOnly: boolean;
    withdrawalCancelsBonus: boolean;
    withdrawalsNotAllowed: boolean;
    requiresSpecificOutcome: boolean;
    returnedBetsDoNotCount: boolean;
    cashoutBetsDoNotCount: boolean;
    mustSettleWithinTimeframe: boolean;
    onlySettledBetsCount: boolean;
    hasMaxConvertibleAmount: boolean;
    hasOtherRestrictions: boolean;
  };

  metadata: {
    canUseUnderlay: boolean;
    releaseMode:
      | "UNDERLAY_CANDIDATE"
      | "STANDARD_REAL_MONEY"
      | "NO_LOW_RISK_PATH";
    rolloverMultiplier: number;
    estimatedROI: number;
    effectiveLossPercentage: number;
    requiredRealMoneyUpfront?: number;
    bookmakerCapitalMin: number;
    bookmakerCapitalMax: number;
    exchangeCapitalMin: number;
    exchangeCapitalMax: number;
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
      remainingRolloverAmount?: number;
    };
    continuationPlans?: {
      bets: number;
      stakePerBet: number;
      totalRollover: number;
      label: string;
    }[];
    standardPlans?: {
      bets: number;
      stakePerBet: number;
      totalRollover: number;
      label: string;
    }[];
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
    keySignals: {
      avoidBonusFundsForRollover: boolean;
      fullBookmakerBankrollRequiredUpfront: boolean;
      lowRiskMatchedBettingPossible: boolean;
    };
    assumptions?: string[];
  };
}

import { useMemo } from "react";

import type { ProfitabilityAnalysis } from "@/types/calculators";

interface RolloverCalculationParams {
  bonusValue: number;
  multiplier?: number;
  maxConversionMultiplier?: number;
  minOdds?: number;
  maxOdds?: number;
  minStake?: number;
  maxStake?: number;
  depositRequired?: number;
  expectedLossPercentage?: number;
  rolloverContributionWallet?: "BONUS_ONLY" | "REAL_ONLY" | "MIXED";
  realMoneyUsageRatio?: number;
  bonusCanBeUsedForBetting?: boolean;
  minBetsRequired?: number;
  allowDepositsAfterActivation?: boolean;
  returnedBetsCountForRollover?: boolean;
  cashoutBetsCountForRollover?: boolean;
  requireResolvedWithinTimeframe?: boolean;
  countOnlySettledBets?: boolean;
  maxConvertibleAmount?: number;
  otherRestrictions?: string;
  noWithdrawalsAllowedDuringRollover?: boolean;
  bonusCancelledOnWithdrawal?: boolean;
  requiredBetOutcome?: "WIN" | "LOSE" | "VOID" | "ANY";
}

function calculateExchangeRiskPerEuro(odds: number): number {
  if (odds <= 1.5) {
    return 0.58;
  }
  if (odds <= 1.6) {
    return 0.67;
  }
  if (odds <= 2.0) {
    return 1.08;
  }
  if (odds <= 2.5) {
    return 1.58;
  }
  if (odds <= 3.0) {
    return 2.0;
  }
  return 2.5;
}

interface ExecutionPlan {
  bets: number;
  stakePerBet: number;
  totalRollover: number;
  label: string;
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildExecutionPlans(params: {
  rolloverAmount: number;
  minBetsRequired: number;
  minStake?: number;
  maxStake?: number;
}): ExecutionPlan[] {
  const { rolloverAmount, minBetsRequired, minStake, maxStake } = params;
  if (rolloverAmount <= 0) {
    return [];
  }

  const hardMinStake = typeof minStake === "number" && minStake > 0 ? minStake : 0;
  const hardMaxStake =
    typeof maxStake === "number" && maxStake > 0
      ? maxStake
      : Number.POSITIVE_INFINITY;

  const preferredTargets = [200, 150, 100, 50].filter(
    (target) => target >= hardMinStake && target <= hardMaxStake
  );

  if (preferredTargets.length === 0) {
    const fallbackTarget = Math.min(
      hardMaxStake,
      Math.max(hardMinStake, 200)
    );
    if (Number.isFinite(fallbackTarget) && fallbackTarget > 0) {
      preferredTargets.push(fallbackTarget);
    }
  }

  const planMap = new Map<string, Omit<ExecutionPlan, "label">>();

  preferredTargets.forEach((targetStake) => {
    let bets = Math.max(minBetsRequired, Math.ceil(rolloverAmount / targetStake));

    // If this produces stake below minStake, reduce bets while respecting minBetsRequired.
    if (hardMinStake > 0) {
      const maxBetsAllowedByMinStake = Math.floor(rolloverAmount / hardMinStake);
      if (maxBetsAllowedByMinStake < minBetsRequired) {
        return;
      }
      bets = Math.min(bets, maxBetsAllowedByMinStake);
      bets = Math.max(bets, minBetsRequired);
    }

    const stakePerBet = rolloverAmount / bets;
    if (stakePerBet < hardMinStake || stakePerBet > hardMaxStake) {
      return;
    }

    const roundedStake = roundToTwo(stakePerBet);
    const key = `${bets}-${roundedStake}`;
    if (!planMap.has(key)) {
      planMap.set(key, {
        bets,
        stakePerBet: roundedStake,
        totalRollover: roundToTwo(rolloverAmount),
      });
    }
  });

  const validPlans = Array.from(planMap.values()).sort(
    (a, b) => b.stakePerBet - a.stakePerBet
  );

  const labels = ["Plan A", "Plan B", "Plan C", "Plan D"];

  return validPlans.slice(0, 4).map((plan, index) => ({
    ...plan,
    label: labels[index] ?? `Plan ${index + 1}`,
  }));
}

export function useRolloverProfitabilityCalculation(
  params: RolloverCalculationParams
): ProfitabilityAnalysis | null {
  return useMemo(() => {
    const {
      bonusValue,
      multiplier,
      maxConversionMultiplier,
      minOdds,
      maxOdds,
      minStake,
      maxStake,
      depositRequired = 0,
      expectedLossPercentage,
      rolloverContributionWallet = "MIXED",
      realMoneyUsageRatio,
      bonusCanBeUsedForBetting = true,
      minBetsRequired,
      allowDepositsAfterActivation = true,
      returnedBetsCountForRollover = false,
      cashoutBetsCountForRollover = false,
      requireResolvedWithinTimeframe = true,
      countOnlySettledBets = true,
      maxConvertibleAmount,
      otherRestrictions,
      noWithdrawalsAllowedDuringRollover = false,
      bonusCancelledOnWithdrawal = false,
      requiredBetOutcome = "ANY",
    } = params;

    if (
      !bonusValue ||
      bonusValue <= 0 ||
      !multiplier ||
      multiplier <= 0 ||
      expectedLossPercentage === undefined ||
      expectedLossPercentage < 0 ||
      expectedLossPercentage > 100
    ) {
      return null;
    }

    const effectiveMinOdds = typeof minOdds === "number" && minOdds > 1 ? minOdds : 2;
    const effectiveMinBetsRequired =
      typeof minBetsRequired === "number" && minBetsRequired > 0 ? minBetsRequired : 1;

    const assumptions: string[] = [];
    if (minOdds === undefined) {
      assumptions.push("Sin cuota mínima: se asume cuota objetivo 2.00 para estimar riesgo.");
    }
    if (maxConversionMultiplier === undefined) {
      assumptions.push("Sin límite de conversión máxima configurado.");
    }
    if (minBetsRequired === undefined) {
      assumptions.push("Sin mínimo de apuestas: se asume 1 apuesta mínima.");
    }
    if (
      rolloverContributionWallet === "MIXED" &&
      typeof realMoneyUsageRatio === "number"
    ) {
      assumptions.push(
        `Modo mixto configurado con proporcion manual de saldo real: ${realMoneyUsageRatio}%.`
      );
    }
    if (minStake === undefined && maxStake === undefined) {
      assumptions.push("Sin límites de stake: se estima con stake flexible.");
    }
    assumptions.push(
      "Planes orientativos calculados con exposicion por apuesta en rangos realistas (50-200 EUR), salvo restricciones del bono."
    );

    const totalRolloverRequired = bonusValue * multiplier;
    const firstBetAmount = bonusValue + depositRequired;
    const invalidOddsRange =
      typeof maxOdds === "number" && typeof minOdds === "number" && maxOdds < minOdds;
    const stakeLimitsBlockPlan =
      typeof minStake === "number" &&
      typeof maxStake === "number" &&
      minStake > maxStake;
    const stakeLimitBlocksInitialUnderlay =
      typeof maxStake === "number" && maxStake < firstBetAmount;
    const conversionBlocksUnderlay =
      typeof maxConversionMultiplier === "number" &&
      maxConversionMultiplier > 0 &&
      maxConversionMultiplier <= effectiveMinOdds;
    const onlyRealMoneyCountsForRollover =
      rolloverContributionWallet === "REAL_ONLY";
    const mustUseRealMoneyOnly =
      onlyRealMoneyCountsForRollover ||
      conversionBlocksUnderlay ||
      stakeLimitBlocksInitialUnderlay ||
      !bonusCanBeUsedForBetting;
    const avoidBonusFundsForRollover =
      conversionBlocksUnderlay ||
      !bonusCanBeUsedForBetting ||
      rolloverContributionWallet === "REAL_ONLY";
    const impossibleWithoutBonusFunds =
      rolloverContributionWallet === "BONUS_ONLY" && avoidBonusFundsForRollover;
    const lowRiskMatchedBettingPossible =
      requiredBetOutcome === "ANY" && !impossibleWithoutBonusFunds;
    const tooManyBetsRequired = effectiveMinBetsRequired > 1;

    const effectiveLossPercentage = expectedLossPercentage;
    const effectiveLossRatio = effectiveLossPercentage / 100;

    const exchangeRiskPerEuro = calculateExchangeRiskPerEuro(effectiveMinOdds);
    const effectiveBonusValue =
      typeof maxConvertibleAmount === "number" && maxConvertibleAmount >= 0
        ? Math.min(bonusValue, maxConvertibleAmount)
        : bonusValue;
    if (
      typeof maxConvertibleAmount === "number" &&
      maxConvertibleAmount >= 0 &&
      maxConvertibleAmount < bonusValue
    ) {
      assumptions.push(
        `El máximo convertible (${maxConvertibleAmount} EUR) limita el valor efectivo de la recompensa.`
      );
    }
    const worstCaseLoss = totalRolloverRequired * effectiveLossRatio;
    const worstCaseNetProfit = effectiveBonusValue - worstCaseLoss;
    const exchangeCapitalForFullRollover = Math.round(
      totalRolloverRequired * exchangeRiskPerEuro
    );
    const bookmakerCapitalForCompletion = Math.max(
      depositRequired,
      totalRolloverRequired
    );
    const fullBookmakerBankrollRequiredUpfront = !allowDepositsAfterActivation;
    const requiredBankroll = bookmakerCapitalForCompletion;
    const requiredRealMoneyUpfront = fullBookmakerBankrollRequiredUpfront
      ? bookmakerCapitalForCompletion
      : undefined;
    const totalCapitalNeeded =
      bookmakerCapitalForCompletion + exchangeCapitalForFullRollover;
    const exchangeCapitalMin = Math.round(firstBetAmount * exchangeRiskPerEuro);
    const standardPlansForFullRollover = buildExecutionPlans({
      rolloverAmount: totalRolloverRequired,
      minBetsRequired: effectiveMinBetsRequired,
      minStake,
      maxStake,
    });

    const baseRestrictions = {
      conversionBlocksUnderlay,
      invalidOddsRange,
      stakeLimitsBlockPlan,
      stakeLimitBlocksInitialUnderlay,
      bonusCannotBeUsedForBetting: !bonusCanBeUsedForBetting,
      tooManyBetsRequired,
      mustUseRealMoneyOnly,
      withdrawalCancelsBonus: bonusCancelledOnWithdrawal,
      withdrawalsNotAllowed: noWithdrawalsAllowedDuringRollover,
      requiresSpecificOutcome: requiredBetOutcome !== "ANY",
      returnedBetsDoNotCount: !returnedBetsCountForRollover,
      cashoutBetsDoNotCount: !cashoutBetsCountForRollover,
      mustSettleWithinTimeframe: requireResolvedWithinTimeframe,
      onlySettledBetsCount: countOnlySettledBets,
      hasMaxConvertibleAmount: typeof maxConvertibleAmount === "number",
      hasOtherRestrictions:
        typeof otherRestrictions === "string" && otherRestrictions.trim().length > 0,
    };

    if (
      invalidOddsRange ||
      stakeLimitsBlockPlan ||
      worstCaseNetProfit <= 0 ||
      !lowRiskMatchedBettingPossible
    ) {
      return {
        expectedValue: Math.round(worstCaseNetProfit),
        totalRolloverRequired,
        estimatedLoss: Math.round(worstCaseLoss),
        requiredBankroll,
        recommendedBets: 0,
        recommendedBetSizes: [],
        recommendedStrategy: "AVOID",
        bonusValue,
        depositRequired,
        maxConversionMultiplier,
        maxConvertibleAmount,
        minOdds,
        maxStake,
        minBetsRequired: effectiveMinBetsRequired,
        rolloverContributionWallet,
        allowDepositsAfterActivation,
        expectedLossPercentage,
        restrictions: baseRestrictions,
        metadata: {
          canUseUnderlay: false,
          releaseMode: !lowRiskMatchedBettingPossible
            ? "NO_LOW_RISK_PATH"
            : "STANDARD_REAL_MONEY",
          rolloverMultiplier: multiplier,
          estimatedROI:
            totalCapitalNeeded > 0
              ? Math.round((worstCaseNetProfit / totalCapitalNeeded) * 100)
              : 0,
          effectiveLossPercentage,
          requiredRealMoneyUpfront,
          bookmakerCapitalMin: bookmakerCapitalForCompletion,
          bookmakerCapitalMax: bookmakerCapitalForCompletion,
          exchangeCapitalMin: exchangeCapitalForFullRollover,
          exchangeCapitalMax: exchangeCapitalForFullRollover,
          estimatedExchangeCapital: exchangeCapitalForFullRollover,
          exchangeRiskPerEuro: Math.round(exchangeRiskPerEuro * 100) / 100,
          totalCapitalNeeded,
          standardPlans: standardPlansForFullRollover,
          keySignals: {
            avoidBonusFundsForRollover,
            fullBookmakerBankrollRequiredUpfront,
            lowRiskMatchedBettingPossible,
          },
          assumptions,
        },
      };
    }

    const canUseUnderlay = !mustUseRealMoneyOnly;

    if (canUseUnderlay) {
      const conversionUpperLimit =
        typeof maxConversionMultiplier === "number" && maxConversionMultiplier > 0
          ? maxConversionMultiplier * 0.95
          : Number.POSITIVE_INFINITY;
      const oddsUpperLimit =
        typeof maxOdds === "number" ? maxOdds : Number.POSITIVE_INFINITY;
      const upperOddsLimit = Math.min(conversionUpperLimit, oddsUpperLimit);
      const underlayMaxOdds =
        Number.isFinite(upperOddsLimit) && upperOddsLimit > effectiveMinOdds
          ? upperOddsLimit
          : effectiveMinOdds + 0.6;
      const targetOdds = (effectiveMinOdds + underlayMaxOdds) / 2;
      const underlaySuccessProbability = Math.min(0.95, Math.max(0.05, 1 / targetOdds));
      const remainingRollover = Math.max(totalRolloverRequired - firstBetAmount, 0);
      const continuationLoss = remainingRollover * effectiveLossRatio;
      const continuationProfit = effectiveBonusValue - continuationLoss;
      const exchangeCapitalFirstBet = Math.round(firstBetAmount * exchangeRiskPerEuro);
      const conservativeExpectedValue = worstCaseNetProfit;
      const continuationPlans = buildExecutionPlans({
        rolloverAmount: remainingRollover,
        minBetsRequired: effectiveMinBetsRequired,
        minStake,
        maxStake,
      });

      return {
        expectedValue: Math.round(conservativeExpectedValue),
        totalRolloverRequired,
        estimatedLoss: Math.round(worstCaseLoss),
        requiredBankroll,
        recommendedBets: continuationPlans[0]?.bets ?? 1,
        recommendedBetSizes:
          continuationPlans.length > 0
            ? continuationPlans.map((plan) => plan.stakePerBet)
            : [roundToTwo(firstBetAmount)],
        recommendedStrategy: "UNDERLAY_FIRST",
        firstBetAmount,
        bonusValue,
        depositRequired,
        maxConversionMultiplier,
        maxConvertibleAmount,
        minOdds,
        maxStake,
        minBetsRequired: effectiveMinBetsRequired,
        rolloverContributionWallet,
        allowDepositsAfterActivation,
        expectedLossPercentage,
        restrictions: baseRestrictions,
        metadata: {
          canUseUnderlay: true,
          releaseMode: "UNDERLAY_CANDIDATE",
          rolloverMultiplier: multiplier,
          estimatedROI:
            totalCapitalNeeded > 0
              ? Math.round((conservativeExpectedValue / totalCapitalNeeded) * 100)
              : 0,
          effectiveLossPercentage,
          requiredRealMoneyUpfront,
          bookmakerCapitalMin: depositRequired,
          bookmakerCapitalMax: bookmakerCapitalForCompletion,
          exchangeCapitalMin,
          exchangeCapitalMax: exchangeCapitalForFullRollover,
          estimatedExchangeCapital: exchangeCapitalForFullRollover,
          exchangeRiskPerEuro: Math.round(exchangeRiskPerEuro * 100) / 100,
          exchangeCapitalFirstBet,
          totalCapitalNeeded,
          totalHouseCapitalIfNoDeposits: !allowDepositsAfterActivation
            ? requiredBankroll + remainingRollover
            : undefined,
          underlayScenario: {
            successProfit: effectiveBonusValue,
            failureProfit: Math.round(continuationProfit),
            additionalBankrollIfFails: !allowDepositsAfterActivation
              ? remainingRollover
              : 0,
            additionalExchangeCapital: Math.round(
              remainingRollover * exchangeRiskPerEuro
            ),
            successProbability: underlaySuccessProbability,
            remainingRolloverAmount: roundToTwo(remainingRollover),
          },
          continuationPlans,
          standardPlans: standardPlansForFullRollover,
          recommendedOddsRange: {
            min: effectiveMinOdds,
            max: underlayMaxOdds,
            optimal: targetOdds,
          },
          standardMethodInfo: {
            mustUseRealMoneyOnly: false,
            mustDepositBeforeActivation: !allowDepositsAfterActivation,
            totalRealMoneyNeeded: totalRolloverRequired,
            rolloverVsBonusRatio: multiplier,
            estimatedNetProfit: Math.round(worstCaseNetProfit),
          },
          keySignals: {
            avoidBonusFundsForRollover,
            fullBookmakerBankrollRequiredUpfront,
            lowRiskMatchedBettingPossible,
          },
          assumptions,
        },
      };
    }

    const maxAllowedStake =
      typeof maxStake === "number" ? maxStake : totalRolloverRequired;
    const minAllowedStake =
      typeof minStake === "number" ? minStake : Math.max(10, bonusValue * 0.1);
    const betsByMaxStake = Math.ceil(totalRolloverRequired / maxAllowedStake);
    const recommendedBets = Math.max(effectiveMinBetsRequired, betsByMaxStake);
    const standardPlans = buildExecutionPlans({
      rolloverAmount: totalRolloverRequired,
      minBetsRequired: recommendedBets,
      minStake,
      maxStake,
    });
    const recommendedBetSizes =
      standardPlans.length > 0
        ? standardPlans.map((plan) => plan.stakePerBet)
        : [roundToTwo(Math.min(maxAllowedStake, Math.max(minAllowedStake, totalRolloverRequired / recommendedBets)))];
    const recommendedStrategy =
      worstCaseNetProfit > 0 ? "STANDARD_ONLY" : "AVOID";

    return {
      expectedValue: Math.round(worstCaseNetProfit),
      totalRolloverRequired,
      estimatedLoss: Math.round(worstCaseLoss),
      requiredBankroll,
      recommendedBets,
      recommendedBetSizes,
      recommendedStrategy,
      bonusValue,
      depositRequired,
      maxConversionMultiplier,
      maxConvertibleAmount,
      minOdds,
      maxStake,
      minBetsRequired: effectiveMinBetsRequired,
      rolloverContributionWallet,
      allowDepositsAfterActivation,
      expectedLossPercentage,
      restrictions: baseRestrictions,
        metadata: {
          canUseUnderlay: false,
          releaseMode: "STANDARD_REAL_MONEY",
          rolloverMultiplier: multiplier,
        estimatedROI:
          totalCapitalNeeded > 0
            ? Math.round((worstCaseNetProfit / totalCapitalNeeded) * 100)
            : 0,
          effectiveLossPercentage,
          requiredRealMoneyUpfront,
          bookmakerCapitalMin: bookmakerCapitalForCompletion,
          bookmakerCapitalMax: bookmakerCapitalForCompletion,
          exchangeCapitalMin: exchangeCapitalForFullRollover,
          exchangeCapitalMax: exchangeCapitalForFullRollover,
          estimatedExchangeCapital: exchangeCapitalForFullRollover,
          exchangeRiskPerEuro: Math.round(exchangeRiskPerEuro * 100) / 100,
          totalCapitalNeeded,
        standardPlans,
        standardMethodInfo: {
          mustUseRealMoneyOnly,
          mustDepositBeforeActivation: !allowDepositsAfterActivation,
          totalRealMoneyNeeded: totalRolloverRequired,
          rolloverVsBonusRatio: multiplier,
          estimatedNetProfit: Math.round(worstCaseNetProfit),
        },
        keySignals: {
          avoidBonusFundsForRollover,
          fullBookmakerBankrollRequiredUpfront,
          lowRiskMatchedBettingPossible,
        },
        assumptions,
      },
    };
  }, [params]);
}

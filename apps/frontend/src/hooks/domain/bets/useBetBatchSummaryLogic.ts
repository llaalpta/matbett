"use client";

import { deriveScenarioPromoAction, getScenarioId } from "@matbett/shared";
import { useEffect, useMemo, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { useReward } from "@/hooks/api/useRewards";
import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";
import {
  areNumbersEqual,
  isPositiveNumber,
  roundToCents,
} from "@/utils/numberHelpers";

type BatchLeg = BetBatchFormValues["legs"][number];
type CalculationTargetParticipation =
  NonNullable<BatchLeg["participations"]>[number];

export type BetBatchCalculationTargetOption = {
  value: string;
  label: string;
  participation: CalculationTargetParticipation;
};

type CalculatedLegValues = {
  stake: number;
  profit: number;
  risk: number;
  yield: number;
};

type SingleMatchedBettingScenarioId =
  | "SINGLE_MATCHED_BETTING_STANDARD_NO_PROMO"
  | "SINGLE_MATCHED_BETTING_STANDARD_USE_FREEBET"
  | "SINGLE_MATCHED_BETTING_STANDARD_GENERATE_FREEBET"
  | "SINGLE_MATCHED_BETTING_UNDERLAY_NO_PROMO"
  | "SINGLE_MATCHED_BETTING_OVERLAY_NO_PROMO";

export type ScenarioOutcomeSummary = {
  mainWins: {
    mainProfit: number;
    hedge1Risk: number;
    balance: number;
    yield: number;
  };
  hedge1Wins: {
    mainRisk: number;
    hedge1Profit: number;
    balance: number;
    yield: number;
  };
  totals: {
    mainStake: number;
    hedge1Stake: number;
    turnover: number;
    risk: number;
    guaranteedBalance: number;
    totalGain: number;
    yield: number;
  };
};

type SingleMatchedBettingScenarioResult = {
  main: CalculatedLegValues;
  hedge1: CalculatedLegValues;
  outcomes: ScenarioOutcomeSummary;
};

type SingleMatchedBettingScenarioInput = {
  mainStake?: number;
  mainOdds?: number;
  mainCommission?: number;
  hedge1Odds?: number;
  hedge1Commission?: number;
  hedge1Stake?: number;
  rewardValue?: number;
  retentionRate?: number;
};

type BetBatchCalculationContext = {
  mainIndex: number;
  hedge1Index: number;
  suggestedHedgeStake: number;
  effectiveHedgeStake: number;
  isManualHedgeStake: boolean;
  upstreamSignature: string;
  result: SingleMatchedBettingScenarioResult;
};

function buildBetBatchCalculationTargetOptions(
  legs: BetBatchFormValues["legs"]
): BetBatchCalculationTargetOption[] {
  return legs.flatMap((leg, legIndex) =>
    (leg.participations ?? []).map((participation, participationIndex) => ({
      value: participation.participationKey,
      label: `${leg.legRole ?? `LEG ${legIndex + 1}`} · ${participation.kind} · ${participation.rewardType} · ${participationIndex + 1}`,
      participation,
    }))
  );
}

function resolveBetBatchCalculationTargetValue(
  currentTarget: string | undefined,
  targetOptions: readonly BetBatchCalculationTargetOption[]
) {
  if (targetOptions.length === 0) {
    return undefined;
  }

  const firstTarget = targetOptions[0];
  const matchingTarget = targetOptions.find(
    (option) => option.value === currentTarget
  );

  return {
    participationKey: matchingTarget?.value ?? firstTarget.value,
  };
}

function resolveBetBatchScenarioId(
  strategy: BetBatchFormValues["strategy"],
  targetOption: BetBatchCalculationTargetOption | undefined,
  targetOptions: readonly BetBatchCalculationTargetOption[]
) {
  if (strategy.kind !== "HEDGE") {
    return undefined;
  }

  if (targetOptions.length > 0 && !targetOption) {
    return undefined;
  }

  return getScenarioId({
    strategyType: strategy.strategyType,
    lineMode: strategy.lineMode,
    mode: strategy.mode,
    dutchingOptionsCount: strategy.dutchingOptionsCount,
    hedgeAdjustmentType: strategy.hedgeAdjustmentType,
    promoAction: deriveScenarioPromoAction(targetOption?.participation),
  });
}

function isSingleMatchedBettingScenario(
  scenarioId?: string
): scenarioId is SingleMatchedBettingScenarioId {
  return (
    scenarioId === "SINGLE_MATCHED_BETTING_STANDARD_NO_PROMO" ||
    scenarioId === "SINGLE_MATCHED_BETTING_STANDARD_USE_FREEBET" ||
    scenarioId === "SINGLE_MATCHED_BETTING_STANDARD_GENERATE_FREEBET" ||
    scenarioId === "SINGLE_MATCHED_BETTING_UNDERLAY_NO_PROMO" ||
    scenarioId === "SINGLE_MATCHED_BETTING_OVERLAY_NO_PROMO"
  );
}

function resolveTargetRewardId(
  targetOption: BetBatchCalculationTargetOption | undefined
) {
  const participation = targetOption?.participation;

  if (!participation) {
    return undefined;
  }

  return participation.kind === "QUALIFY_TRACKING"
    ? participation.calculationRewardId
    : participation.rewardId;
}

function calculateYield(profit: number, risk: number) {
  if (risk === 0) {
    return 0;
  }

  return roundToCents((profit / Math.abs(risk)) * 100);
}

function emptyLegValues(): CalculatedLegValues {
  return {
    stake: 0,
    profit: 0,
    risk: 0,
    yield: 0,
  };
}

function calculateSuggestedHedgeStake(args: {
  scenarioId: SingleMatchedBettingScenarioId;
  mainStake: number;
  mainOdds: number;
  mainProfit: number;
  rewardValue?: number;
  retentionRate?: number;
  hedge1Odds: number;
  hedge1CommissionRate: number;
}) {
  const {
    scenarioId,
    mainStake,
    mainOdds,
    mainProfit,
    rewardValue = 0,
    retentionRate = 0,
    hedge1Odds,
    hedge1CommissionRate,
  } = args;

  switch (scenarioId) {
    case "SINGLE_MATCHED_BETTING_STANDARD_NO_PROMO":
      return (mainOdds * mainStake) / (hedge1Odds - (1 - hedge1CommissionRate));
    case "SINGLE_MATCHED_BETTING_STANDARD_USE_FREEBET":
      return mainProfit / (hedge1Odds - (1 - hedge1CommissionRate));
    case "SINGLE_MATCHED_BETTING_STANDARD_GENERATE_FREEBET":
      return (
        mainOdds * mainStake - (retentionRate / 100) * rewardValue
      ) / (hedge1Odds - (1 - hedge1CommissionRate));
    case "SINGLE_MATCHED_BETTING_UNDERLAY_NO_PROMO":
      return mainOdds < hedge1Odds
        ? ((mainOdds - 1) * mainStake) / (hedge1Odds - 1)
        : mainStake / hedge1CommissionRate;
    case "SINGLE_MATCHED_BETTING_OVERLAY_NO_PROMO":
      return mainOdds < hedge1Odds
        ? mainStake / hedge1CommissionRate
        : ((mainOdds - 1) * mainStake) / (hedge1Odds - 1);
  }
}

function calculateSingleMatchedBettingScenario(args: {
  scenarioId: SingleMatchedBettingScenarioId;
} & SingleMatchedBettingScenarioInput): SingleMatchedBettingScenarioResult {
  const {
    scenarioId,
    mainStake,
    mainOdds,
    mainCommission = 0,
    hedge1Odds,
    hedge1Commission = 2,
    hedge1Stake,
    rewardValue,
    retentionRate,
  } = args;
  const main = emptyLegValues();
  const hedge1 = emptyLegValues();
  const outcomes: ScenarioOutcomeSummary = {
    mainWins: {
      mainProfit: 0,
      hedge1Risk: 0,
      balance: 0,
      yield: 0,
    },
    hedge1Wins: {
      mainRisk: 0,
      hedge1Profit: 0,
      balance: 0,
      yield: 0,
    },
    totals: {
      mainStake: 0,
      hedge1Stake: 0,
      turnover: 0,
      risk: 0,
      guaranteedBalance: 0,
      totalGain: 0,
      yield: 0,
    },
  };

  const hasValidMainInputs =
    typeof mainStake === "number" &&
    mainStake > 0 &&
    typeof mainOdds === "number" &&
    mainOdds > 0;

  if (!hasValidMainInputs) {
    return { main, hedge1, outcomes };
  }

  const mainStakeRaw = mainStake;
  const mainCommissionRate = 1 - mainCommission / 100;
  const hedge1CommissionRate = 1 - hedge1Commission / 100;
  const mainRiskRaw =
    scenarioId === "SINGLE_MATCHED_BETTING_STANDARD_USE_FREEBET"
      ? 0
      : -mainStakeRaw;
  const mainProfitRaw = (mainOdds - 1) * mainStakeRaw * mainCommissionRate;
  const retainedProfitRaw =
    scenarioId === "SINGLE_MATCHED_BETTING_STANDARD_GENERATE_FREEBET"
      ? roundToCents(((retentionRate ?? 0) / 100) * (rewardValue ?? 0))
      : 0;

  main.stake = roundToCents(mainStakeRaw);
  main.risk = roundToCents(mainRiskRaw);
  main.profit = roundToCents(mainProfitRaw);
  main.yield = calculateYield(main.profit, main.risk);

  const hasValidHedgeInputs =
    typeof hedge1Odds === "number" &&
    hedge1Odds > 0 &&
    typeof hedge1Commission === "number" &&
    hedge1CommissionRate > 0 &&
    (scenarioId === "SINGLE_MATCHED_BETTING_STANDARD_NO_PROMO" ||
      scenarioId === "SINGLE_MATCHED_BETTING_STANDARD_USE_FREEBET" ||
      scenarioId === "SINGLE_MATCHED_BETTING_STANDARD_GENERATE_FREEBET" ||
      hedge1Odds > 1);
  const hasValidGenerateFreeBetInputs =
    scenarioId !== "SINGLE_MATCHED_BETTING_STANDARD_GENERATE_FREEBET" ||
    (typeof rewardValue === "number" &&
      rewardValue > 0 &&
      typeof retentionRate === "number" &&
      retentionRate >= 0 &&
      retentionRate <= 100);

  if (!hasValidHedgeInputs || !hasValidGenerateFreeBetInputs) {
    return { main, hedge1, outcomes };
  }

  const hedgeStake =
    typeof hedge1Stake === "number" && hedge1Stake > 0
      ? hedge1Stake
        : calculateSuggestedHedgeStake({
          scenarioId,
          mainStake,
          mainOdds,
          mainProfit: mainProfitRaw,
          rewardValue,
          retentionRate,
          hedge1Odds,
          hedge1CommissionRate,
        });
  const hedgeRiskRaw = -((hedge1Odds - 1) * hedgeStake);
  const hedgeProfitRaw = hedgeStake * hedge1CommissionRate;

  hedge1.stake = roundToCents(hedgeStake);
  hedge1.risk = roundToCents(hedgeRiskRaw);
  hedge1.profit = roundToCents(hedgeProfitRaw);
  hedge1.yield = calculateYield(hedge1.profit, hedge1.risk);

  outcomes.mainWins.mainProfit = main.profit;
  outcomes.mainWins.hedge1Risk = hedge1.risk;
  outcomes.mainWins.balance = roundToCents(mainProfitRaw + hedgeRiskRaw);
  outcomes.mainWins.yield =
    main.stake === 0
      ? 0
      : roundToCents((outcomes.mainWins.balance / main.stake) * 100);

  outcomes.hedge1Wins.mainRisk = main.risk;
  outcomes.hedge1Wins.hedge1Profit = hedge1.profit;
  outcomes.hedge1Wins.balance = roundToCents(
    hedgeProfitRaw + mainRiskRaw + retainedProfitRaw
  );
  outcomes.hedge1Wins.yield =
    hedge1.stake === 0
      ? 0
      : roundToCents((outcomes.hedge1Wins.balance / hedge1.stake) * 100);

  outcomes.totals.mainStake = main.stake;
  outcomes.totals.hedge1Stake = hedge1.stake;
  outcomes.totals.turnover = roundToCents(mainStakeRaw + hedgeStake);
  outcomes.totals.risk = roundToCents(mainRiskRaw + hedgeRiskRaw);
  outcomes.totals.totalGain = roundToCents(
    mainProfitRaw + hedgeProfitRaw + retainedProfitRaw
  );
  outcomes.totals.guaranteedBalance = roundToCents(
    Math.min(outcomes.mainWins.balance, outcomes.hedge1Wins.balance)
  );
  outcomes.totals.yield =
    outcomes.totals.turnover === 0
      ? 0
      : roundToCents(
          (outcomes.totals.guaranteedBalance / outcomes.totals.turnover) * 100
        );

  return { main, hedge1, outcomes };
}

function buildSingleMatchedCalculationContext(args: {
  scenarioId: string | undefined;
  legs: BetBatchFormValues["legs"];
  lastSuggestedHedgeStake: number | undefined;
  isManualHedgeStake: boolean;
  lastUpstreamSignature: string | undefined;
  rewardValue?: number;
  retentionRate?: number;
}): BetBatchCalculationContext | undefined {
  const {
    scenarioId,
    legs,
    lastSuggestedHedgeStake,
    isManualHedgeStake,
    lastUpstreamSignature,
    rewardValue,
    retentionRate,
  } = args;

  if (!isSingleMatchedBettingScenario(scenarioId)) {
    return undefined;
  }

  if (
    scenarioId === "SINGLE_MATCHED_BETTING_STANDARD_GENERATE_FREEBET" &&
    (rewardValue === undefined || retentionRate === undefined)
  ) {
    return undefined;
  }

  const mainIndex = legs.findIndex((leg) => leg.legRole === "MAIN");
  const hedge1Index = legs.findIndex((leg) => leg.legRole === "HEDGE1");

  if (mainIndex < 0 || hedge1Index < 0) {
    return undefined;
  }

  const mainLeg = legs[mainIndex];
  const hedge1Leg = legs[hedge1Index];
  const upstreamSignature = JSON.stringify({
    mainStake: mainLeg.stake,
    mainOdds: mainLeg.odds,
    mainCommission: mainLeg.commission,
    hedge1Odds: hedge1Leg.odds,
    hedge1Commission: hedge1Leg.commission,
    rewardValue,
    retentionRate,
  });
  const upstreamChanged =
    lastUpstreamSignature !== undefined &&
    lastUpstreamSignature !== upstreamSignature;

  const suggestedResult = calculateSingleMatchedBettingScenario({
    scenarioId,
    mainStake: mainLeg.stake,
    mainOdds: mainLeg.odds,
    mainCommission: mainLeg.commission,
    hedge1Odds: hedge1Leg.odds,
    hedge1Commission: hedge1Leg.commission,
    rewardValue,
    retentionRate,
  });
  const suggestedHedgeStake = suggestedResult.hedge1.stake;
  const currentHedgeStake = hedge1Leg.stake;
  let nextIsManualHedgeStake = isManualHedgeStake;

  if (upstreamChanged || !isPositiveNumber(currentHedgeStake)) {
    nextIsManualHedgeStake = false;
  } else if (
    isPositiveNumber(lastSuggestedHedgeStake) &&
    !areNumbersEqual(currentHedgeStake, lastSuggestedHedgeStake)
  ) {
    nextIsManualHedgeStake = true;
  } else if (
    lastSuggestedHedgeStake === undefined &&
    !areNumbersEqual(currentHedgeStake, suggestedHedgeStake)
  ) {
    nextIsManualHedgeStake = true;
  } else if (areNumbersEqual(currentHedgeStake, suggestedHedgeStake)) {
    nextIsManualHedgeStake = false;
  }

  const effectiveHedgeStake =
    nextIsManualHedgeStake && isPositiveNumber(currentHedgeStake)
      ? currentHedgeStake
      : suggestedHedgeStake;

  return {
    mainIndex,
    hedge1Index,
    suggestedHedgeStake,
    effectiveHedgeStake,
    isManualHedgeStake: nextIsManualHedgeStake,
    upstreamSignature,
    result: calculateSingleMatchedBettingScenario({
      scenarioId,
      mainStake: mainLeg.stake,
      mainOdds: mainLeg.odds,
      mainCommission: mainLeg.commission,
      hedge1Odds: hedge1Leg.odds,
      hedge1Commission: hedge1Leg.commission,
      rewardValue,
      retentionRate,
      hedge1Stake: effectiveHedgeStake,
    }),
  };
}

function calculateBetBatchTotals(args: {
  legs: BetBatchFormValues["legs"];
  scenarioOutcomeSummary: ScenarioOutcomeSummary | undefined;
}) {
  const { legs, scenarioOutcomeSummary } = args;
  const profit = scenarioOutcomeSummary
    ? scenarioOutcomeSummary.totals.guaranteedBalance
    : roundToCents(legs.reduce((sum, leg) => sum + (leg.profit ?? 0), 0));
  const risk = scenarioOutcomeSummary
    ? scenarioOutcomeSummary.totals.risk
    : roundToCents(legs.reduce((sum, leg) => sum + (leg.risk ?? 0), 0));
  const yieldValue = scenarioOutcomeSummary
    ? scenarioOutcomeSummary.totals.yield
    : risk === 0
      ? 0
      : roundToCents((profit / Math.abs(risk)) * 100);

  return {
    profit,
    risk,
    yield: yieldValue,
  };
}

export function useBetBatchSummaryLogic() {
  const form = useFormContext<BetBatchFormValues>();
  const strategy = useWatch({ control: form.control, name: "strategy" });
  const watchedLegs = useWatch({ control: form.control, name: "legs" });
  const legs = useMemo(() => watchedLegs ?? [], [watchedLegs]);
  const currentTarget = useWatch({
    control: form.control,
    name: "calculation.target.participationKey",
  });
  const lastSuggestedHedgeStakeRef = useRef<number | undefined>(undefined);
  const isManualHedgeStakeRef = useRef(false);
  const lastUpstreamSignatureRef = useRef<string | undefined>(undefined);

  const targetOptions = useMemo(
    () => buildBetBatchCalculationTargetOptions(legs),
    [legs]
  );
  const nextTargetValue = useMemo(
    () => resolveBetBatchCalculationTargetValue(currentTarget, targetOptions),
    [currentTarget, targetOptions]
  );
  const targetOption = useMemo(
    () =>
      nextTargetValue
        ? targetOptions.find(
            (option) => option.value === nextTargetValue.participationKey
          )
        : undefined,
    [nextTargetValue, targetOptions]
  );
  const targetRewardId = useMemo(
    () => resolveTargetRewardId(targetOption),
    [targetOption]
  );
  const { data: targetReward } = useReward(targetRewardId);
  const targetRewardValue =
    targetReward?.type === "FREEBET" ? targetReward.value : undefined;
  const targetRetentionRate =
    targetReward?.type === "FREEBET"
      ? targetReward.typeSpecificFields.retentionRate
      : undefined;
  const nextScenarioId = useMemo(
    () => resolveBetBatchScenarioId(strategy, targetOption, targetOptions),
    [strategy, targetOption, targetOptions]
  );
  const calculationContext = useMemo(
    () =>
      buildSingleMatchedCalculationContext({
        scenarioId: nextScenarioId,
        legs,
        lastSuggestedHedgeStake: lastSuggestedHedgeStakeRef.current,
        isManualHedgeStake: isManualHedgeStakeRef.current,
        lastUpstreamSignature: lastUpstreamSignatureRef.current,
        rewardValue: targetRewardValue,
        retentionRate: targetRetentionRate,
      }),
    [legs, nextScenarioId, targetRetentionRate, targetRewardValue]
  );
  const scenarioOutcomeSummary = calculationContext?.result.outcomes;
  const totals = useMemo(
    () => calculateBetBatchTotals({ legs, scenarioOutcomeSummary }),
    [legs, scenarioOutcomeSummary]
  );
  const mainLeg =
    calculationContext !== undefined
      ? legs[calculationContext.mainIndex]
      : legs.find((leg) => leg.legRole === "MAIN");
  const hedge1Leg =
    calculationContext !== undefined
      ? legs[calculationContext.hedge1Index]
      : legs.find((leg) => leg.legRole === "HEDGE1");

  useEffect(() => {
    const currentTargetValue = form.getValues("calculation.target");

    if (!nextTargetValue && currentTargetValue) {
      form.setValue("calculation.target", undefined);
    } else if (
      nextTargetValue &&
      currentTargetValue?.participationKey !== nextTargetValue.participationKey
    ) {
      form.setValue("calculation.target", nextTargetValue);
    }

    if (form.getValues("profit") !== totals.profit) {
      form.setValue("profit", totals.profit);
    }
    if (form.getValues("risk") !== totals.risk) {
      form.setValue("risk", totals.risk);
    }
    if (form.getValues("yield") !== totals.yield) {
      form.setValue("yield", totals.yield);
    }
    if (form.getValues("calculation.scenarioId") !== nextScenarioId) {
      form.setValue("calculation.scenarioId", nextScenarioId);
    }

    if (!calculationContext) {
      lastSuggestedHedgeStakeRef.current = undefined;
      isManualHedgeStakeRef.current = false;
      lastUpstreamSignatureRef.current = undefined;
      return;
    }

    const { mainIndex, hedge1Index, result } = calculationContext;
    const main = legs[mainIndex];
    const hedge1 = legs[hedge1Index];

    if (!areNumbersEqual(main?.profit, result.main.profit)) {
      form.setValue(`legs.${mainIndex}.profit`, result.main.profit);
    }
    if (!areNumbersEqual(main?.risk, result.main.risk)) {
      form.setValue(`legs.${mainIndex}.risk`, result.main.risk);
    }
    if (!areNumbersEqual(main?.yield, result.main.yield)) {
      form.setValue(`legs.${mainIndex}.yield`, result.main.yield);
    }
    if (
      !calculationContext.isManualHedgeStake &&
      !areNumbersEqual(hedge1?.stake, result.hedge1.stake)
    ) {
      form.setValue(`legs.${hedge1Index}.stake`, result.hedge1.stake);
    }
    if (!areNumbersEqual(hedge1?.profit, result.hedge1.profit)) {
      form.setValue(`legs.${hedge1Index}.profit`, result.hedge1.profit);
    }
    if (!areNumbersEqual(hedge1?.risk, result.hedge1.risk)) {
      form.setValue(`legs.${hedge1Index}.risk`, result.hedge1.risk);
    }
    if (!areNumbersEqual(hedge1?.yield, result.hedge1.yield)) {
      form.setValue(`legs.${hedge1Index}.yield`, result.hedge1.yield);
    }

    lastSuggestedHedgeStakeRef.current = calculationContext.suggestedHedgeStake;
    isManualHedgeStakeRef.current = calculationContext.isManualHedgeStake;
    lastUpstreamSignatureRef.current = calculationContext.upstreamSignature;
  }, [calculationContext, form, legs, nextScenarioId, nextTargetValue, totals]);

  return {
    scenarioOutcomeSummary,
    targetOptions,
    mainLeg,
    hedge1Leg,
  };
}

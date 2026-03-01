import { Path } from "react-hook-form";

import type {
  PromotionFormData,
  RewardFormData,
  RewardQualifyConditionFormData,
} from "@/types/hooks";

import type { QualifyConditionFormPaths } from "./QualifyConditionForm";
import type { TimeframePaths } from "./TimeframeForm";

export type PromotionRewardPath = `phases.${number}.rewards.${number}`;

export const buildPromotionQualifyConditionPathsGetter = (
  rewardBasePath: PromotionRewardPath,
  p: (value: Path<PromotionFormData>) => Path<PromotionFormData>
) => {
  return (index: number): QualifyConditionFormPaths<PromotionFormData> => {
    const basePath =
      `${rewardBasePath}.qualifyConditions.${index}` satisfies Path<PromotionFormData>;
    const timeframeBase = `${basePath}.timeframe` as const;
    const timeframePaths = {
      mode: p(`${timeframeBase}.mode`),
      start: p(`${timeframeBase}.start`),
      end: p(`${timeframeBase}.end`),
      anchorEntityType: p(`${timeframeBase}.anchor.entityType`),
      anchorEntityRefType: p(`${timeframeBase}.anchor.entityRefType`),
      anchorEntityRef: p(`${timeframeBase}.anchor.entityRef`),
      anchorEvent: p(`${timeframeBase}.anchor.event`),
      offsetDays: p(`${timeframeBase}.offsetDays`),
    } satisfies TimeframePaths<PromotionFormData>;

    return {
      basePath,
      type: p(`${basePath}.type`),
      status: p(`${basePath}.status`),
      description: p(`${basePath}.description`),
      otherRestrictions: p(`${basePath}.conditions.otherRestrictions`),
      timeframe: timeframePaths,
      contributesToRewardValue: p(`${basePath}.conditions.contributesToRewardValue`),
      deposit: {
        contributesToRewardValue: p(`${basePath}.conditions.contributesToRewardValue`),
        bonusPercentage: p(`${basePath}.conditions.bonusPercentage`),
        maxBonusAmount: p(`${basePath}.conditions.maxBonusAmount`),
        minAmount: p(`${basePath}.conditions.minAmount`),
        maxAmount: p(`${basePath}.conditions.maxAmount`),
        targetAmount: p(`${basePath}.conditions.targetAmount`),
        depositCode: p(`${basePath}.conditions.depositCode`),
        firstDepositOnly: p(`${basePath}.conditions.firstDepositOnly`),
      },
      bet: {
        contributesToRewardValue: p(`${basePath}.conditions.contributesToRewardValue`),
        allowRetries: p(`${basePath}.conditions.allowRetries`),
        maxAttempts: p(`${basePath}.conditions.maxAttempts`),
        allowMultipleBets: p(`${basePath}.conditions.allowMultipleBets`),
        returnPercentage: p(`${basePath}.conditions.returnPercentage`),
        maxRewardAmount: p(`${basePath}.conditions.maxRewardAmount`),
        targetStake: p(`${basePath}.conditions.targetStake`),
        stakeMin: p(`${basePath}.conditions.stakeRestriction.minStake`),
        stakeMax: p(`${basePath}.conditions.stakeRestriction.maxStake`),
        oddsMin: p(`${basePath}.conditions.oddsRestriction.minOdds`),
        oddsMax: p(`${basePath}.conditions.oddsRestriction.maxOdds`),
        multipleMinSelections: p(`${basePath}.conditions.multipleBetCondition.minSelections`),
        multipleMaxSelections: p(`${basePath}.conditions.multipleBetCondition.maxSelections`),
        multipleMinOddsPerSelection: p(`${basePath}.conditions.multipleBetCondition.minOddsPerSelection`),
        multipleMaxOddsPerSelection: p(`${basePath}.conditions.multipleBetCondition.maxOddsPerSelection`),
        multipleSystemType: p(`${basePath}.conditions.multipleBetCondition.systemType`),
        requiredBetOutcome: p(`${basePath}.conditions.requiredBetOutcome`),
        allowLiveOddsChanges: p(`${basePath}.conditions.allowLiveOddsChanges`),
        onlyFirstBetCounts: p(`${basePath}.conditions.onlyFirstBetCounts`),
        betTypeRestrictions: p(`${basePath}.conditions.betTypeRestrictions`),
        selectionRestrictions: p(`${basePath}.conditions.selectionRestrictions`),
        otherRestrictions: p(`${basePath}.conditions.otherRestrictions`),
      },
      lossesCashback: {
        allowMultipleBets: p(`${basePath}.conditions.allowMultipleBets`),
        cashbackPercentage: p(`${basePath}.conditions.cashbackPercentage`),
        maxCashbackAmount: p(`${basePath}.conditions.maxCashbackAmount`),
        calculationMethod: p(`${basePath}.conditions.calculationMethod`),
        calculationPeriod: p(`${basePath}.conditions.calculationPeriod`),
        returnedBetsCountForCashback: p(`${basePath}.conditions.returnedBetsCountForCashback`),
        cashoutBetsCountForCashback: p(`${basePath}.conditions.cashoutBetsCountForCashback`),
        countOnlySettledBets: p(`${basePath}.conditions.countOnlySettledBets`),
        oddsMin: p(`${basePath}.conditions.oddsRestriction.minOdds`),
        oddsMax: p(`${basePath}.conditions.oddsRestriction.maxOdds`),
        stakeMin: p(`${basePath}.conditions.stakeRestriction.minStake`),
        stakeMax: p(`${basePath}.conditions.stakeRestriction.maxStake`),
        requiredBetOutcome: p(`${basePath}.conditions.requiredBetOutcome`),
        multipleMinSelections: p(`${basePath}.conditions.multipleBetCondition.minSelections`),
        multipleMaxSelections: p(`${basePath}.conditions.multipleBetCondition.maxSelections`),
        multipleMinOddsPerSelection: p(`${basePath}.conditions.multipleBetCondition.minOddsPerSelection`),
        multipleMaxOddsPerSelection: p(`${basePath}.conditions.multipleBetCondition.maxOddsPerSelection`),
        allowLiveOddsChanges: p(`${basePath}.conditions.allowLiveOddsChanges`),
        onlyFirstBetCounts: p(`${basePath}.conditions.onlyFirstBetCounts`),
        betTypeRestrictions: p(`${basePath}.conditions.betTypeRestrictions`),
        selectionRestrictions: p(`${basePath}.conditions.selectionRestrictions`),
        otherRestrictions: p(`${basePath}.conditions.otherRestrictions`),
      },
    };
  };
};

export const buildRewardQualifyConditionPathsGetter = (
  p: (value: Path<RewardFormData>) => Path<RewardFormData>
) => {
  return (index: number): QualifyConditionFormPaths<RewardFormData> => {
    const basePath =
      `qualifyConditions.${index}` satisfies Path<RewardFormData>;
    const timeframeBase = `${basePath}.timeframe` as const;
    const timeframePaths = {
      mode: p(`${timeframeBase}.mode`),
      start: p(`${timeframeBase}.start`),
      end: p(`${timeframeBase}.end`),
      anchorEntityType: p(`${timeframeBase}.anchor.entityType`),
      anchorEntityRefType: p(`${timeframeBase}.anchor.entityRefType`),
      anchorEntityRef: p(`${timeframeBase}.anchor.entityRef`),
      anchorEvent: p(`${timeframeBase}.anchor.event`),
      offsetDays: p(`${timeframeBase}.offsetDays`),
    } satisfies TimeframePaths<RewardFormData>;

    return {
      basePath,
      type: p(`${basePath}.type`),
      status: p(`${basePath}.status`),
      description: p(`${basePath}.description`),
      otherRestrictions: p(`${basePath}.conditions.otherRestrictions`),
      timeframe: timeframePaths,
      contributesToRewardValue: p(`${basePath}.conditions.contributesToRewardValue`),
      deposit: {
        contributesToRewardValue: p(`${basePath}.conditions.contributesToRewardValue`),
        bonusPercentage: p(`${basePath}.conditions.bonusPercentage`),
        maxBonusAmount: p(`${basePath}.conditions.maxBonusAmount`),
        minAmount: p(`${basePath}.conditions.minAmount`),
        maxAmount: p(`${basePath}.conditions.maxAmount`),
        targetAmount: p(`${basePath}.conditions.targetAmount`),
        depositCode: p(`${basePath}.conditions.depositCode`),
        firstDepositOnly: p(`${basePath}.conditions.firstDepositOnly`),
      },
      bet: {
        contributesToRewardValue: p(`${basePath}.conditions.contributesToRewardValue`),
        allowRetries: p(`${basePath}.conditions.allowRetries`),
        maxAttempts: p(`${basePath}.conditions.maxAttempts`),
        allowMultipleBets: p(`${basePath}.conditions.allowMultipleBets`),
        returnPercentage: p(`${basePath}.conditions.returnPercentage`),
        maxRewardAmount: p(`${basePath}.conditions.maxRewardAmount`),
        targetStake: p(`${basePath}.conditions.targetStake`),
        stakeMin: p(`${basePath}.conditions.stakeRestriction.minStake`),
        stakeMax: p(`${basePath}.conditions.stakeRestriction.maxStake`),
        oddsMin: p(`${basePath}.conditions.oddsRestriction.minOdds`),
        oddsMax: p(`${basePath}.conditions.oddsRestriction.maxOdds`),
        multipleMinSelections: p(`${basePath}.conditions.multipleBetCondition.minSelections`),
        multipleMaxSelections: p(`${basePath}.conditions.multipleBetCondition.maxSelections`),
        multipleMinOddsPerSelection: p(`${basePath}.conditions.multipleBetCondition.minOddsPerSelection`),
        multipleMaxOddsPerSelection: p(`${basePath}.conditions.multipleBetCondition.maxOddsPerSelection`),
        multipleSystemType: p(`${basePath}.conditions.multipleBetCondition.systemType`),
        requiredBetOutcome: p(`${basePath}.conditions.requiredBetOutcome`),
        allowLiveOddsChanges: p(`${basePath}.conditions.allowLiveOddsChanges`),
        onlyFirstBetCounts: p(`${basePath}.conditions.onlyFirstBetCounts`),
        betTypeRestrictions: p(`${basePath}.conditions.betTypeRestrictions`),
        selectionRestrictions: p(`${basePath}.conditions.selectionRestrictions`),
        otherRestrictions: p(`${basePath}.conditions.otherRestrictions`),
      },
      lossesCashback: {
        allowMultipleBets: p(`${basePath}.conditions.allowMultipleBets`),
        cashbackPercentage: p(`${basePath}.conditions.cashbackPercentage`),
        maxCashbackAmount: p(`${basePath}.conditions.maxCashbackAmount`),
        calculationMethod: p(`${basePath}.conditions.calculationMethod`),
        calculationPeriod: p(`${basePath}.conditions.calculationPeriod`),
        returnedBetsCountForCashback: p(`${basePath}.conditions.returnedBetsCountForCashback`),
        cashoutBetsCountForCashback: p(`${basePath}.conditions.cashoutBetsCountForCashback`),
        countOnlySettledBets: p(`${basePath}.conditions.countOnlySettledBets`),
        oddsMin: p(`${basePath}.conditions.oddsRestriction.minOdds`),
        oddsMax: p(`${basePath}.conditions.oddsRestriction.maxOdds`),
        stakeMin: p(`${basePath}.conditions.stakeRestriction.minStake`),
        stakeMax: p(`${basePath}.conditions.stakeRestriction.maxStake`),
        requiredBetOutcome: p(`${basePath}.conditions.requiredBetOutcome`),
        multipleMinSelections: p(`${basePath}.conditions.multipleBetCondition.minSelections`),
        multipleMaxSelections: p(`${basePath}.conditions.multipleBetCondition.maxSelections`),
        multipleMinOddsPerSelection: p(`${basePath}.conditions.multipleBetCondition.minOddsPerSelection`),
        multipleMaxOddsPerSelection: p(`${basePath}.conditions.multipleBetCondition.maxOddsPerSelection`),
        allowLiveOddsChanges: p(`${basePath}.conditions.allowLiveOddsChanges`),
        onlyFirstBetCounts: p(`${basePath}.conditions.onlyFirstBetCounts`),
        betTypeRestrictions: p(`${basePath}.conditions.betTypeRestrictions`),
        selectionRestrictions: p(`${basePath}.conditions.selectionRestrictions`),
        otherRestrictions: p(`${basePath}.conditions.otherRestrictions`),
      },
    };
  };
};

export const buildQualifyConditionStandalonePaths = (
  p: (
    value: Path<RewardQualifyConditionFormData>
  ) => Path<RewardQualifyConditionFormData>
): QualifyConditionFormPaths<RewardQualifyConditionFormData> => {
  const timeframePaths = {
    mode: p("timeframe.mode"),
    start: p("timeframe.start"),
    end: p("timeframe.end"),
    anchorEntityType: p("timeframe.anchor.entityType"),
    anchorEntityRefType: p("timeframe.anchor.entityRefType"),
    anchorEntityRef: p("timeframe.anchor.entityRef"),
    anchorEvent: p("timeframe.anchor.event"),
    offsetDays: p("timeframe.offsetDays"),
  } satisfies TimeframePaths<RewardQualifyConditionFormData>;

  return {
    basePath: "",
    type: p("type"),
    status: p("status"),
    description: p("description"),
    otherRestrictions: p("conditions.otherRestrictions"),
    timeframe: timeframePaths,
    contributesToRewardValue: p("conditions.contributesToRewardValue"),
    deposit: {
      contributesToRewardValue: p("conditions.contributesToRewardValue"),
      bonusPercentage: p("conditions.bonusPercentage"),
      maxBonusAmount: p("conditions.maxBonusAmount"),
      minAmount: p("conditions.minAmount"),
      maxAmount: p("conditions.maxAmount"),
      targetAmount: p("conditions.targetAmount"),
      depositCode: p("conditions.depositCode"),
      firstDepositOnly: p("conditions.firstDepositOnly"),
    },
    bet: {
      contributesToRewardValue: p("conditions.contributesToRewardValue"),
      allowRetries: p("conditions.allowRetries"),
      maxAttempts: p("conditions.maxAttempts"),
      allowMultipleBets: p("conditions.allowMultipleBets"),
      returnPercentage: p("conditions.returnPercentage"),
      maxRewardAmount: p("conditions.maxRewardAmount"),
      targetStake: p("conditions.targetStake"),
      stakeMin: p("conditions.stakeRestriction.minStake"),
      stakeMax: p("conditions.stakeRestriction.maxStake"),
      oddsMin: p("conditions.oddsRestriction.minOdds"),
      oddsMax: p("conditions.oddsRestriction.maxOdds"),
      multipleMinSelections: p("conditions.multipleBetCondition.minSelections"),
      multipleMaxSelections: p("conditions.multipleBetCondition.maxSelections"),
      multipleMinOddsPerSelection: p(
        "conditions.multipleBetCondition.minOddsPerSelection"
      ),
      multipleMaxOddsPerSelection: p(
        "conditions.multipleBetCondition.maxOddsPerSelection"
      ),
      multipleSystemType: p("conditions.multipleBetCondition.systemType"),
      requiredBetOutcome: p("conditions.requiredBetOutcome"),
      allowLiveOddsChanges: p("conditions.allowLiveOddsChanges"),
      onlyFirstBetCounts: p("conditions.onlyFirstBetCounts"),
      betTypeRestrictions: p("conditions.betTypeRestrictions"),
      selectionRestrictions: p("conditions.selectionRestrictions"),
      otherRestrictions: p("conditions.otherRestrictions"),
    },
    lossesCashback: {
      allowMultipleBets: p("conditions.allowMultipleBets"),
      cashbackPercentage: p("conditions.cashbackPercentage"),
      maxCashbackAmount: p("conditions.maxCashbackAmount"),
      calculationMethod: p("conditions.calculationMethod"),
      calculationPeriod: p("conditions.calculationPeriod"),
      returnedBetsCountForCashback: p("conditions.returnedBetsCountForCashback"),
      cashoutBetsCountForCashback: p("conditions.cashoutBetsCountForCashback"),
      countOnlySettledBets: p("conditions.countOnlySettledBets"),
      oddsMin: p("conditions.oddsRestriction.minOdds"),
      oddsMax: p("conditions.oddsRestriction.maxOdds"),
      stakeMin: p("conditions.stakeRestriction.minStake"),
      stakeMax: p("conditions.stakeRestriction.maxStake"),
      requiredBetOutcome: p("conditions.requiredBetOutcome"),
      multipleMinSelections: p("conditions.multipleBetCondition.minSelections"),
      multipleMaxSelections: p("conditions.multipleBetCondition.maxSelections"),
      multipleMinOddsPerSelection: p("conditions.multipleBetCondition.minOddsPerSelection"),
      multipleMaxOddsPerSelection: p("conditions.multipleBetCondition.maxOddsPerSelection"),
      allowLiveOddsChanges: p("conditions.allowLiveOddsChanges"),
      onlyFirstBetCounts: p("conditions.onlyFirstBetCounts"),
      betTypeRestrictions: p("conditions.betTypeRestrictions"),
      selectionRestrictions: p("conditions.selectionRestrictions"),
      otherRestrictions: p("conditions.otherRestrictions"),
    },
  };
};



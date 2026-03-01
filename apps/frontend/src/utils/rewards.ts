import type {
  RewardEntity,
  RewardRelatedBet,
  RewardRelatedDeposit,
} from "@matbett/shared";
import {
  getLabel,
  qualifyConditionTypeOptions,
  qualifyConditionStatusOptions,
  rewardTypeOptions,
} from "@matbett/shared";

import {
  formatCurrencyAmount,
} from "./formatters";

export function getRewardPromotionSummary(reward: RewardEntity, phaseSummary?: string) {
  const promotionName = reward.promotionName ?? "Promoción";
  const compactPhase = phaseSummary ?? reward.phaseName ?? undefined;

  return {
    primary: compactPhase ? `${promotionName} · ${compactPhase}` : promotionName,
    secondary: undefined,
  };
}

export function getRewardIdentitySummary(reward: RewardEntity) {
  return {
    primary: getLabel(rewardTypeOptions, reward.type),
    secondary: undefined,
  };
}

export function getRewardQualifySummary(reward: RewardEntity) {
  const fulfilledCount = reward.qualifyConditions.filter(
    (condition) => condition.status === "FULFILLED"
  ).length;

  return {
    primary:
      reward.qualifyConditions.length === 0
        ? "Sin QC"
        : `${fulfilledCount}/${reward.qualifyConditions.length}`,
    secondary: undefined,
  };
}

export function getRewardUsageSummary(reward: RewardEntity): {
  primary: string;
  secondary?: string;
} {
  if (!reward.usageTracking) {
    return {
      primary: "Sin acciones registradas",
    };
  }

  switch (reward.usageTracking.type) {
    case "FREEBET":
      return {
        primary: `${formatCurrencyAmount(reward.usageTracking.totalUsed)} usado · ${formatCurrencyAmount(reward.usageTracking.remainingBalance)} restante`,
      };
    case "BET_BONUS_ROLLOVER":
      return {
        primary: `${formatCurrencyAmount(reward.usageTracking.rolloverProgress)} rollover · ${formatCurrencyAmount(reward.usageTracking.remainingRollover)} restante`,
      };
    case "BET_BONUS_NO_ROLLOVER":
      return {
        primary: `${formatCurrencyAmount(reward.usageTracking.totalUsed)} usado`,
      };
    case "CASHBACK_FREEBET":
      return {
        primary: `${formatCurrencyAmount(reward.usageTracking.totalCashback)} cashback`,
      };
    case "ENHANCED_ODDS":
      return {
        primary: reward.usageTracking.oddsUsed ? "Cuota usada" : "Sin uso",
      };
    case "CASINO_SPINS":
      return {
        primary: `${reward.usageTracking.spinsUsed} usados · ${reward.usageTracking.remainingSpins} restantes`,
      };
    default:
      return {
        primary: `Balance ${formatCurrencyAmount(reward.totalBalance)}`,
      };
  }
}

function getRelatedQualifyConditionTypeLabel(type: RewardRelatedBet["context"]["qualifyConditionType"]) {
  if (!type) {
    return "Calificación";
  }

  switch (type) {
    case "BET":
      return "Apuesta";
    case "LOSSES_CASHBACK":
      return "Cashback";
    case "DEPOSIT":
      return "Depósito";
    default:
      return getLabel(qualifyConditionTypeOptions, type);
  }
}

export function getNestedRewardQualifyConditionStatusLabel(status: RewardEntity["qualifyConditions"][number]["status"]) {
  return getLabel(qualifyConditionStatusOptions, status);
}

export function getRewardRelatedBetContextSummary(item: RewardRelatedBet) {
  if (item.context.role === "USAGE") {
    return {
      primary: "Uso",
      secondary: undefined,
    };
  }

  const qualifier =
    item.context.qualifyConditionIndex !== undefined
      ? `QC${item.context.qualifyConditionIndex}`
      : "QC";

  return {
    primary: `${qualifier} · ${getRelatedQualifyConditionTypeLabel(item.context.qualifyConditionType)}`,
    secondary: undefined,
  };
}

export function getRewardRelatedDepositContextSummary(item: RewardRelatedDeposit) {
  return {
    primary: `QC${item.context.qualifyConditionIndex} · Depósito`,
    secondary: undefined,
  };
}

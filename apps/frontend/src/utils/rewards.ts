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
        ? "Sin condiciones"
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
      primary: "Sin uso",
    };
  }

  switch (reward.usageTracking.type) {
    case "FREEBET": {
      const hasUsage = reward.usageTracking.totalUsed > 0;
      const isCompleted = hasUsage && reward.usageTracking.remainingBalance <= 0;

      return {
        primary: isCompleted ? "Uso completo" : hasUsage ? "Uso parcial" : "Sin uso",
      };
    }
    case "BET_BONUS_ROLLOVER": {
      const hasProgress = reward.usageTracking.rolloverProgress > 0;
      const isCompleted = hasProgress && reward.usageTracking.remainingRollover <= 0;

      return {
        primary: isCompleted
          ? "Rollover completo"
          : hasProgress
            ? "Rollover parcial"
            : "Sin uso",
      };
    }
    case "BET_BONUS_NO_ROLLOVER":
      return {
        primary: reward.usageTracking.totalUsed > 0 ? "Usada" : "Sin uso",
      };
    case "CASHBACK_FREEBET":
      return {
        primary: reward.usageTracking.totalCashback > 0 ? "Cashback generado" : "Sin uso",
      };
    case "ENHANCED_ODDS":
      return {
        primary: reward.usageTracking.oddsUsed ? "Cuota usada" : "Sin uso",
      };
    case "CASINO_SPINS": {
      const hasUsage = reward.usageTracking.spinsUsed > 0;
      const isCompleted = hasUsage && reward.usageTracking.remainingSpins <= 0;

      return {
        primary: isCompleted ? "Uso completo" : hasUsage ? "Uso parcial" : "Sin uso",
      };
    }
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
      ? `Condición ${item.context.qualifyConditionIndex}`
      : "Condición";

  return {
    primary: `${qualifier} · ${getRelatedQualifyConditionTypeLabel(item.context.qualifyConditionType)}`,
    secondary: undefined,
  };
}

export function getRewardRelatedDepositContextSummary(item: RewardRelatedDeposit) {
  return {
    primary: `Condición ${item.context.qualifyConditionIndex} · Depósito`,
    secondary: undefined,
  };
}

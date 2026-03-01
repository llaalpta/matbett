import type { QualifyConditionEntity } from "@matbett/shared";
import {
  getLabel,
  rewardTypeOptions,
} from "@matbett/shared";

import { formatCurrencyAmount } from "./formatters";

export function getQualifyConditionSummary(condition: QualifyConditionEntity): {
  primary: string;
  secondary?: string;
} {
  switch (condition.type) {
    case "DEPOSIT":
      return condition.conditions.contributesToRewardValue
        ? {
            primary: [
              `Min ${formatCurrencyAmount(condition.conditions.minAmount ?? 0)}`,
              `${condition.conditions.bonusPercentage ?? 0}% bonus`,
              condition.conditions.firstDepositOnly ? "Solo primer depósito" : null,
            ]
              .filter(Boolean)
              .join(" · "),
            secondary: undefined,
          }
        : {
            primary: [
              `Objetivo ${formatCurrencyAmount(condition.conditions.targetAmount ?? 0)}`,
              condition.conditions.firstDepositOnly ? "Solo primer depósito" : null,
            ]
              .filter(Boolean)
              .join(" · "),
            secondary: undefined,
          };
    case "BET":
      return condition.conditions.contributesToRewardValue
        ? {
            primary: [
              `Min ${formatCurrencyAmount(condition.conditions.stakeRestriction.minStake ?? 0)}`,
              condition.conditions.oddsRestriction?.minOdds
                ? `Cuota mín. ${condition.conditions.oddsRestriction.minOdds.toFixed(2)}`
                : null,
              condition.conditions.allowRetries && condition.conditions.maxAttempts
                ? `${condition.conditions.maxAttempts} intento(s)`
                : condition.conditions.allowRetries
                  ? "Con reintentos"
                  : null,
            ]
              .filter(Boolean)
              .join(" · "),
            secondary: undefined,
          }
        : {
            primary: [
              `Stake ${formatCurrencyAmount(condition.conditions.targetStake ?? 0)}`,
              condition.conditions.oddsRestriction?.minOdds
                ? `Cuota mín. ${condition.conditions.oddsRestriction.minOdds.toFixed(2)}`
                : null,
              condition.conditions.allowRetries && condition.conditions.maxAttempts
                ? `${condition.conditions.maxAttempts} intento(s)`
                : condition.conditions.allowRetries
                  ? "Con reintentos"
                  : null,
            ]
              .filter(Boolean)
              .join(" · "),
            secondary: undefined,
          };
    case "LOSSES_CASHBACK":
      return {
        primary: `${condition.conditions.cashbackPercentage}% cashback · Máx. ${formatCurrencyAmount(condition.conditions.maxCashbackAmount ?? 0)}`,
        secondary: undefined,
      };
    default:
      return {
        primary: "Sin resumen",
      };
  }
}

export function getQualifyConditionParentSummary(condition: QualifyConditionEntity) {
  const primaryReward = condition.linkedRewards[0];

  if (!primaryReward) {
    return {
      primary: `${condition.promotionName ?? "Promoción"} · Sin reward asociada`,
      secondary: undefined,
    };
  }

  const phaseName = primaryReward.phaseName?.trim();
  const promotionName = condition.promotionName?.trim();
  const normalizedPhaseName = phaseName?.toLocaleLowerCase();
  const normalizedPromotionName = promotionName?.toLocaleLowerCase();
  const phaseLabel =
    primaryReward.phaseIndex !== undefined ? `F${primaryReward.phaseIndex + 1}` : undefined;
  const rewardLabel = getLabel(rewardTypeOptions, primaryReward.type);

  return {
    primary: [
      condition.promotionName ?? "Promoción",
      phaseLabel && phaseName && normalizedPhaseName !== normalizedPromotionName
        ? `${phaseLabel} · ${rewardLabel}`
        : phaseLabel
          ? `${phaseLabel} · ${rewardLabel}`
          : rewardLabel,
    ]
      .filter(Boolean)
      .join(" · "),
    secondary: undefined,
  };
}

export function getQualifyTrackingSummary(condition: QualifyConditionEntity) {
  if (!condition.trackingSummary) {
    return {
      label: "Sin registros",
    };
  }

  return {
    label:
      condition.trackingSummary.label ??
      `${condition.trackingStats.totalParticipations} registro(s)`,
  };
}

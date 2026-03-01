import type { BetListItem, BetPromotionContext } from "@matbett/shared";
import { getLabel, rewardTypeOptions } from "@matbett/shared";

import { formatCompactPhaseLabel } from "./formatters";

export function getBetSelectionSummary(bet: BetListItem) {
  return bet.selections.length > 0
    ? bet.selections.map((selection) => selection.selection).join(" · ")
    : "Sin selección";
}

export function getBetEventSummary(bet: BetListItem) {
  const firstEvent = bet.events[0];
  if (!firstEvent) {
    return "Sin evento";
  }

  return [firstEvent.eventName, firstEvent.marketName].filter(Boolean).join(" · ");
}

export function getBetPromotionRoleLabel(role: BetPromotionContext["role"]) {
  return role === "QUALIFICATION" ? "Calificación" : "Uso";
}

export function getBetPromotionSummary(context: BetPromotionContext | null | undefined) {
  if (!context) {
    return {
      primary: "Sin promoción",
      secondary: undefined,
      tertiary: undefined,
    };
  }

  const compactPhaseLabel = formatCompactPhaseLabel(context.phaseName);

  return {
    primary: [
      context.promotionName,
      compactPhaseLabel ?? null,
      context.rewardType ? getLabel(rewardTypeOptions, context.rewardType) : "Reward",
      getBetPromotionRoleLabel(context.role),
    ]
      .filter(Boolean)
      .join(" · "),
    secondary: undefined,
    tertiary: undefined,
  };
}

export function getBetBalanceTone(balance: number | null | undefined) {
  if (balance === null || balance === undefined || balance === 0) {
    return "neutral" as const;
  }

  return balance > 0 ? "positive" as const : "negative" as const;
}

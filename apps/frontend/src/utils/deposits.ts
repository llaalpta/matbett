import type { DepositEntity } from "@matbett/shared";
import { getLabel, rewardTypeOptions } from "@matbett/shared";

import { formatCompactPhaseLabel } from "./formatters";

export function getDepositAccountLabel(deposit: DepositEntity) {
  return [deposit.bookmaker, deposit.bookmakerAccountIdentifier]
    .filter(Boolean)
    .join(" · ");
}

export function getDepositPromotionSummary(deposit: DepositEntity) {
  const participation = deposit.participations[0];

  if (!participation) {
    return {
      primary: "Sin promoción",
      secondary: undefined,
      tertiary: undefined,
    };
  }

  const compactPhaseLabel = formatCompactPhaseLabel(participation.phaseName);

  return {
    primary: [
      participation.promotionName ?? "Promoción",
      compactPhaseLabel ?? null,
      participation.rewardType
        ? getLabel(rewardTypeOptions, participation.rewardType)
        : "Calificación",
      "Calificación",
    ]
      .filter(Boolean)
      .join(" · "),
    secondary: undefined,
    tertiary: undefined,
  };
}

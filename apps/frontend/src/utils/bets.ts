import type {
  BetLineMode,
  BetListItem,
  BetOperationContext,
  BetPromotionContext,
  LegRole,
  StrategyContext,
} from "@matbett/shared";
import { getLabel, rewardTypeOptions } from "@matbett/shared";

import { formatCompactPhaseLabel } from "./formatters";

type BetOperationRoleDescriptionArgs = {
  index: number;
  operation?: Partial<BetOperationContext>;
  role?: LegRole | null;
  strategy?: StrategyContext;
};

export function getBetLineModeLabel(lineMode: BetLineMode | undefined) {
  switch (lineMode) {
    case "SINGLE":
      return "Apuesta simple";
    case "COMBINED_2":
      return "Apuesta combinada de 2 eventos";
    case "COMBINED_3":
      return "Apuesta combinada de 3 eventos";
    default:
      return "Formato de apuesta";
  }
}

export function getBetScenarioLabel(scenarioId: string | undefined) {
  switch (scenarioId) {
    case "SINGLE_MATCHED_BETTING_STANDARD_NO_PROMO":
      return "Matched betting simple · estándar · sin promoción";
    case "SINGLE_MATCHED_BETTING_STANDARD_GENERATE_FREEBET":
      return "Matched betting simple · estándar · generar freebet";
    case "SINGLE_MATCHED_BETTING_STANDARD_USE_FREEBET":
      return "Matched betting simple · estándar · usar freebet";
    case "SINGLE_MATCHED_BETTING_UNDERLAY_NO_PROMO":
      return "Matched betting simple · underlay · sin promoción";
    case "SINGLE_MATCHED_BETTING_OVERLAY_NO_PROMO":
      return "Matched betting simple · overlay · sin promoción";
    case undefined:
      return "Totales de la operación";
    default:
      return scenarioId;
  }
}

export function getBetOperationBetLabel(index: number, role?: LegRole | null) {
  if (role === "MAIN") {
    return "Principal";
  }

  if (role === "HEDGE1") {
    return "Cobertura 1";
  }

  if (role === "HEDGE2") {
    return "Cobertura 2";
  }

  if (role === "HEDGE3") {
    return "Cobertura 3";
  }

  return `Apuesta ${index + 1}`;
}

function getHedgeNumber(role: LegRole | null | undefined, index: number) {
  if (role === "HEDGE1") {
    return 1;
  }

  if (role === "HEDGE2") {
    return 2;
  }

  if (role === "HEDGE3") {
    return 3;
  }

  return Math.max(index, 1);
}

export function getBetOperationRoleDescription({
  index,
  operation,
  role,
  strategy,
}: BetOperationRoleDescriptionArgs) {
  if (!strategy || strategy.kind === "NONE") {
    return operation?.lineMode && operation.lineMode !== "SINGLE"
      ? "Apuesta combinada registrada"
      : "Apuesta registrada";
  }

  if (strategy.strategyType === "MATCHED_BETTING") {
    if (role === "MAIN") {
      return operation?.lineMode && operation.lineMode !== "SINGLE"
        ? "Apuesta principal combinada en bookmaker"
        : "Apuesta en bookmaker principal";
    }

    return "Cobertura para compensar pérdidas";
  }

  if (strategy.strategyType === "DUTCHING") {
    if (role === "MAIN") {
      return operation?.lineMode && operation.lineMode !== "SINGLE"
        ? "Selección principal de la combinada"
        : "Resultado principal";
    }

    return `Resultado cubierto ${getHedgeNumber(role, index)}`;
  }

  return "Apuesta registrada";
}

export function getBetOperationBetSummary(args: BetOperationRoleDescriptionArgs) {
  const shouldUseRoleLabel = !!args.strategy && args.strategy.kind !== "NONE";

  return {
    label: getBetOperationBetLabel(
      args.index,
      shouldUseRoleLabel ? args.role : undefined
    ),
    description: getBetOperationRoleDescription(args),
  };
}

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
      context.rewardType ? getLabel(rewardTypeOptions, context.rewardType) : "Recompensa",
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

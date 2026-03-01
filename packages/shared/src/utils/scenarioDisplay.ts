import type { ScenarioId } from "../schemas";
import { getScenarioDescriptor } from "../schemas";
import {
  betLineModeOptions,
  hedgeAdjustmentTypeOptions,
  hedgeModeOptions,
  strategyTypeOptions,
  getLabel,
} from "../options";

export function getScenarioNaturalLabel(
  scenarioId: ScenarioId
): {
  primary: string;
  secondary: string;
} {
  const descriptor = getScenarioDescriptor(scenarioId);

  const lineModeLabel =
    descriptor.lineMode === "SINGLE"
      ? "Apuesta simple"
      : getLabel(
          betLineModeOptions,
          descriptor.lineMode as (typeof betLineModeOptions)[number]["value"]
        );
  const strategyLabel = getLabel(
    strategyTypeOptions,
    descriptor.strategyType as (typeof strategyTypeOptions)[number]["value"]
  ).toLowerCase();
  const modeLabel = getLabel(
    hedgeModeOptions,
    descriptor.mode as (typeof hedgeModeOptions)[number]["value"]
  ).toLowerCase();
  const adjustmentLabel = descriptor.hedgeAdjustmentType
    ? ` · ${getLabel(
        hedgeAdjustmentTypeOptions,
        descriptor.hedgeAdjustmentType as (typeof hedgeAdjustmentTypeOptions)[number]["value"]
      ).toLowerCase()}`
    : "";

  const promoActionLabel =
    descriptor.promoAction === "GENERATE_FREEBET"
      ? "Generar freebet"
      : descriptor.promoAction === "USE_FREEBET"
        ? "Usar freebet"
        : "Sin promo";

  return {
    primary: `${lineModeLabel} · ${strategyLabel} ${modeLabel}${adjustmentLabel}`,
    secondary: promoActionLabel,
  };
}

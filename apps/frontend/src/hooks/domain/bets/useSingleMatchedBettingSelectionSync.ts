"use client";

import { useEffect, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";

function deriveOpposedSelectionLabel(selection?: string) {
  const normalizedSelection = selection?.trim();

  if (!normalizedSelection) {
    return "";
  }

  return `En contra de ${normalizedSelection}`;
}

function isSingleMatchedBettingLayout(strategy: BetBatchFormValues["strategy"]) {
  return (
    strategy.kind === "HEDGE" &&
    strategy.strategyType === "MATCHED_BETTING" &&
    strategy.lineMode === "SINGLE"
  );
}

export function useSingleMatchedBettingSelectionSync(
) {
  const form = useFormContext<BetBatchFormValues>();
  const strategy = useWatch({ control: form.control, name: "strategy" });
  const watchedLegs = useWatch({ control: form.control, name: "legs" });
  const legs = useMemo(() => watchedLegs ?? [], [watchedLegs]);
  const mainSelection =
    legs.find((candidate) => candidate.legRole === "MAIN")?.selections?.[0]
      ?.selection ?? "";
  const isSingleMatchedLayout = isSingleMatchedBettingLayout(strategy);
  const derivedHedge1Selection = deriveOpposedSelectionLabel(mainSelection);

  useEffect(() => {
    if (!isSingleMatchedLayout) {
      return;
    }

    const mainIndex = legs.findIndex((leg) => leg.legRole === "MAIN");
    const hedge1Index = legs.findIndex((leg) => leg.legRole === "HEDGE1");

    if (mainIndex < 0 || hedge1Index < 0) {
      return;
    }

    const currentHedge1Selection =
      legs[hedge1Index]?.selections?.[0]?.selection ?? "";

    if (currentHedge1Selection !== derivedHedge1Selection) {
      form.setValue(
        `legs.${hedge1Index}.selections.0.selection`,
        derivedHedge1Selection
      );
    }
  }, [derivedHedge1Selection, form, isSingleMatchedLayout, legs]);
}

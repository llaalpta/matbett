"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";
import { areNumbersEqual, roundToCents } from "@/utils/numberHelpers";

function isPositiveOdd(value: unknown): value is number {
  return typeof value === "number" && value > 0;
}

function resolveMainCombinedLegIndex(legs: BetBatchFormValues["legs"]) {
  const mainIndex = legs.findIndex((leg) => leg.legRole === "MAIN");

  return mainIndex >= 0 ? mainIndex : 0;
}

function buildSelectionOddsSignature(odds: readonly (number | undefined)[]) {
  return odds.map((value) => value ?? "").join("|");
}

function calculateCombinedOdds(odds: readonly number[]) {
  return roundToCents(odds.reduce((product, value) => product * value, 1));
}

export function useCombinedMainOddsSync() {
  const form = useFormContext<BetBatchFormValues>();
  const operation = useWatch({ control: form.control, name: "operation" });
  const watchedLegs = useWatch({ control: form.control, name: "legs" });
  const legs = useMemo(() => watchedLegs ?? [], [watchedLegs]);
  const lastSelectionOddsSignatureRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!operation?.lineMode || operation.lineMode === "SINGLE") {
      lastSelectionOddsSignatureRef.current = undefined;
      return;
    }

    const mainIndex = resolveMainCombinedLegIndex(legs);
    const mainLeg = legs[mainIndex];
    const selectionOdds = mainLeg?.selections?.map((selection) => selection.odds) ?? [];
    const nextSignature = buildSelectionOddsSignature(selectionOdds);
    const hasSelectionOddsChanged =
      lastSelectionOddsSignatureRef.current !== undefined &&
      lastSelectionOddsSignatureRef.current !== nextSignature;

    lastSelectionOddsSignatureRef.current = nextSignature;

    if (!hasSelectionOddsChanged || !selectionOdds.every(isPositiveOdd)) {
      return;
    }

    const nextMainOdds = calculateCombinedOdds(selectionOdds);

    if (!areNumbersEqual(mainLeg?.odds, nextMainOdds)) {
      form.setValue(`legs.${mainIndex}.odds`, nextMainOdds);
    }
  }, [form, legs, operation?.lineMode]);
}

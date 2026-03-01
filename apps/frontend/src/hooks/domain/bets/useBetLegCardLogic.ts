"use client";

import {
  getAvailableScenarioOptions,
  hedgeAdjustmentTypeOptions,
} from "@matbett/shared";
import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";
import {
  buildBookmakerAccountTypeById,
  formatBookmakerAccountLabel,
  getBookmakerAccountType,
} from "@/utils/bookmakerAccounts";

type BetLegCardBookmakerAccount = {
  id: string;
  bookmaker: string;
  accountIdentifier?: string | null;
  bookmakerAccountType?: string | null;
  accountType?: string | null;
};

type UseBetLegCardLogicArgs = {
  legIndex: number;
  mode: "create" | "edit";
  bookmakerAccounts: BetLegCardBookmakerAccount[];
};

function isExchangeAccountType(accountType?: string | null) {
  return accountType === "EXCHANGE";
}

function isAdjustmentCompatibleWithAccountType(
  adjustmentType: string,
  accountType?: string | null
) {
  if (!accountType) {
    return false;
  }

  if (adjustmentType === "UNMATCHED") {
    return isExchangeAccountType(accountType);
  }

  if (adjustmentType === "PREPAYMENT") {
    return !isExchangeAccountType(accountType);
  }

  return false;
}

function filterAdjustmentOptionsForAccountType<T extends { value: string }>(
  options: readonly T[],
  accountType?: string | null
) {
  return options.filter((option) =>
    isAdjustmentCompatibleWithAccountType(option.value, accountType)
  );
}

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

function isCalculatedSingleMatchedScenario(scenarioId?: string) {
  return (
    scenarioId === "SINGLE_MATCHED_BETTING_STANDARD_NO_PROMO" ||
    scenarioId === "SINGLE_MATCHED_BETTING_STANDARD_USE_FREEBET" ||
    scenarioId === "SINGLE_MATCHED_BETTING_STANDARD_GENERATE_FREEBET" ||
    scenarioId === "SINGLE_MATCHED_BETTING_UNDERLAY_NO_PROMO" ||
    scenarioId === "SINGLE_MATCHED_BETTING_OVERLAY_NO_PROMO"
  );
}

export function useBetLegCardLogic({
  legIndex,
  mode,
  bookmakerAccounts,
}: UseBetLegCardLogicArgs) {
  const form = useFormContext<BetBatchFormValues>();
  const leg = useWatch({ control: form.control, name: `legs.${legIndex}` });
  const strategy = useWatch({ control: form.control, name: "strategy" });
  const scenarioId = useWatch({
    control: form.control,
    name: "calculation.scenarioId",
  });
  const events = useWatch({ control: form.control, name: "events" }) ?? [];
  const allLegs = useWatch({ control: form.control, name: "legs" }) ?? [];

  const bookmakerOptions = useMemo(
    () =>
      bookmakerAccounts.map((account) => ({
        value: account.id,
        label: formatBookmakerAccountLabel(account),
      })),
    [bookmakerAccounts]
  );

  const isMainLeg = leg?.legRole === "MAIN";
  const isHedge1Leg = leg?.legRole === "HEDGE1";
  const mainSelection =
    allLegs.find((candidate) => candidate.legRole === "MAIN")?.selections?.[0]
      ?.selection ?? "";
  const isSingleMatchedLayout = isSingleMatchedBettingLayout(strategy);
  const derivedHedge1Selection = deriveOpposedSelectionLabel(mainSelection);
  const sharedEvent = events[0];
  const hideGenericSelections =
    isSingleMatchedLayout && (isMainLeg || isHedge1Leg);
  const hideCalculatedLegMetrics =
    isCalculatedSingleMatchedScenario(scenarioId);

  const selectedAccount = bookmakerAccounts.find(
    (account) => account.id === leg?.bookmakerAccountId
  );
  const selectedAccountType = getBookmakerAccountType(selectedAccount);
  const accountTypeById = useMemo(
    () => buildBookmakerAccountTypeById(bookmakerAccounts),
    [bookmakerAccounts]
  );
  const firstExchangeLegIndex = allLegs.findIndex((candidate) =>
    isExchangeAccountType(accountTypeById.get(candidate.bookmakerAccountId))
  );
  const firstNonExchangeLegIndex = allLegs.findIndex((candidate) => {
    const accountType = accountTypeById.get(candidate.bookmakerAccountId);
    return Boolean(accountType) && !isExchangeAccountType(accountType);
  });
  const availableAdjustmentTypes =
    mode === "edit" &&
    strategy.kind === "HEDGE" &&
    strategy.lineMode === "SINGLE"
      ? getAvailableScenarioOptions({
          operation: "update",
          strategyType: strategy.strategyType,
          lineMode: strategy.lineMode,
          mode: strategy.mode,
          dutchingOptionsCount: strategy.dutchingOptionsCount,
        }).hedgeAdjustmentTypes
      : [];
  const baseAdjustmentOptions = hedgeAdjustmentTypeOptions.filter((option) =>
    availableAdjustmentTypes.includes(option.value)
  );
  const legAdjustmentOptions = filterAdjustmentOptionsForAccountType(
    baseAdjustmentOptions,
    selectedAccountType
  );
  const shouldRenderAdjustmentSection =
    legAdjustmentOptions.length > 0 &&
    ((isExchangeAccountType(selectedAccountType) &&
      legIndex === firstExchangeLegIndex) ||
      (!!selectedAccountType &&
        !isExchangeAccountType(selectedAccountType) &&
        legIndex === firstNonExchangeLegIndex));
  const selectedAdjustment =
    strategy.kind === "HEDGE" ? strategy.hedgeAdjustmentType : undefined;

  return {
    leg,
    bookmakerOptions,
    isSingleMatchedLayout,
    isMainLeg,
    sharedEvent,
    derivedHedge1Selection,
    hideGenericSelections,
    hideCalculatedLegMetrics,
    shouldRenderAdjustmentSection,
    legAdjustmentOptions,
    selectedAdjustment,
    setSelectedAdjustment: (value?: "UNMATCHED" | "PREPAYMENT") =>
      form.setValue("strategy.hedgeAdjustmentType", value),
  };
}

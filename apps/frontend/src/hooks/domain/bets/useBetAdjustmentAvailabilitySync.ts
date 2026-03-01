"use client";

import { useEffect, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import type { BookmakerAccountLike } from "@/components/molecules/bets/types";
import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";
import { buildBookmakerAccountTypeById } from "@/utils/bookmakerAccounts";

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

type UseBetAdjustmentAvailabilitySyncArgs = {
  bookmakerAccounts: BookmakerAccountLike[];
  hasBookmakerAccountsLoaded: boolean;
};

export function useBetAdjustmentAvailabilitySync({
  bookmakerAccounts,
  hasBookmakerAccountsLoaded,
}: UseBetAdjustmentAvailabilitySyncArgs) {
  const form = useFormContext<BetBatchFormValues>();
  const strategy = useWatch({ control: form.control, name: "strategy" });
  const watchedLegs = useWatch({ control: form.control, name: "legs" });
  const legs = useMemo(() => watchedLegs ?? [], [watchedLegs]);

  const accountTypeById = useMemo(
    () => buildBookmakerAccountTypeById(bookmakerAccounts),
    [bookmakerAccounts]
  );
  const selectedAdjustment =
    strategy.kind === "HEDGE" ? strategy.hedgeAdjustmentType : undefined;

  useEffect(() => {
    if (!selectedAdjustment) {
      return;
    }

    if (!hasBookmakerAccountsLoaded) {
      return;
    }

    const hasCompatibleLeg = legs.some((leg) =>
      isAdjustmentCompatibleWithAccountType(
        selectedAdjustment,
        accountTypeById.get(leg.bookmakerAccountId)
      )
    );

    if (!hasCompatibleLeg) {
      form.setValue("strategy.hedgeAdjustmentType", undefined);
    }
  }, [
    accountTypeById,
    form,
    hasBookmakerAccountsLoaded,
    legs,
    selectedAdjustment,
  ]);
}

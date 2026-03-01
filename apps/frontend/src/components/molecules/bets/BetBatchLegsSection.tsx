"use client";

import { useFormContext, useWatch } from "react-hook-form";

import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";

import { BetBatchLegCard } from "./legs";
import type { BookmakerAccountLike } from "./types";

type BetBatchLegsSectionProps = {
  mode: "create" | "edit";
  bookmakerAccounts: BookmakerAccountLike[];
};

export function BetBatchLegsSection({
  mode,
  bookmakerAccounts,
}: BetBatchLegsSectionProps) {
  const form = useFormContext<BetBatchFormValues>();
  const legs = useWatch({ control: form.control, name: "legs" }) ?? [];

  return (
    <div className="space-y-4">
      {legs.map((leg, legIndex) => (
        <BetBatchLegCard
          key={`${leg.betId ?? "new"}-${legIndex}`}
          legIndex={legIndex}
          mode={mode}
          bookmakerAccounts={bookmakerAccounts}
        />
      ))}
    </div>
  );
}

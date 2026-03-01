"use client";

import type { UpdateBetsBatch } from "@matbett/shared";
import { useFormContext } from "react-hook-form";

import { ApiErrorBanner, ValidationErrorBanner } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { useBetAdjustmentAvailabilitySync } from "@/hooks/domain/bets/useBetAdjustmentAvailabilitySync";
import { useSingleMatchedBettingSelectionSync } from "@/hooks/domain/bets/useSingleMatchedBettingSelectionSync";
import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";
import { useFormInvalidSubmitFocus } from "@/hooks/useFormInvalidSubmitFocus";

import { BetBatchEntryContextBanner } from "./BetBatchEntryContextBanner";
import { BetBatchEventsSection } from "./BetBatchEventsSection";
import { BetBatchLegsSection } from "./BetBatchLegsSection";
import { BetBatchStrategySection } from "./BetBatchStrategySection";
import { BetBatchSummarySection } from "./BetBatchSummarySection";
import type { BetBatchFormProps, BookmakerAccountLike } from "./types";

type BetBatchFormContentProps = Pick<
  BetBatchFormProps,
  | "mode"
  | "initialContext"
  | "onSubmit"
  | "isLoading"
  | "apiErrorMessage"
  | "onDismissApiError"
> & {
  bookmakerAccounts: BookmakerAccountLike[];
  hasBookmakerAccountsLoaded: boolean;
  defaultBookmakerAccountId: string;
};

export function BetBatchFormContent({
  mode,
  initialContext,
  onSubmit,
  isLoading = false,
  apiErrorMessage,
  onDismissApiError,
  bookmakerAccounts,
  hasBookmakerAccountsLoaded,
  defaultBookmakerAccountId,
}: BetBatchFormContentProps) {
  const form = useFormContext<
    BetBatchFormValues,
    undefined,
    UpdateBetsBatch
  >();
  const { formRef, validationBannerRef, focusFirstInvalidField } =
    useFormInvalidSubmitFocus();

  useSingleMatchedBettingSelectionSync();
  useBetAdjustmentAvailabilitySync({
    bookmakerAccounts,
    hasBookmakerAccountsLoaded,
  });

  return (
    <form
      ref={formRef}
      onSubmit={form.handleSubmit(onSubmit, focusFirstInvalidField)}
      className="space-y-6"
    >
      <ValidationErrorBanner<BetBatchFormValues>
        errors={form.formState.errors}
        submitCount={form.formState.submitCount}
        containerRef={validationBannerRef}
        mode="all"
        onDismiss={() => form.clearErrors()}
      />
      <ApiErrorBanner
        errorMessage={apiErrorMessage}
        onDismissError={onDismissApiError}
      />
      <BetBatchEntryContextBanner
        initialContext={initialContext}
      />

      <BetBatchStrategySection
        mode={mode}
        defaultBookmakerAccountId={defaultBookmakerAccountId}
      />
      <BetBatchEventsSection />
      <BetBatchLegsSection mode={mode} bookmakerAccounts={bookmakerAccounts} />
      <BetBatchSummarySection />

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Guardando..."
            : mode === "create"
              ? "Registrar batch"
              : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

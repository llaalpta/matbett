"use client";

import type { UpdateBetsBatch } from "@matbett/shared";
import { useFormContext } from "react-hook-form";

import { ApiErrorBanner, ValidationErrorBanner } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { useBetAdjustmentAvailabilitySync } from "@/hooks/domain/bets/useBetAdjustmentAvailabilitySync";
import { useCombinedMainOddsSync } from "@/hooks/domain/bets/useCombinedMainOddsSync";
import { useSingleMatchedBettingSelectionSync } from "@/hooks/domain/bets/useSingleMatchedBettingSelectionSync";
import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";
import { useFormInvalidSubmitFocus } from "@/hooks/useFormInvalidSubmitFocus";

import { BetBatchEntryContextBanner } from "./BetBatchEntryContextBanner";
import { BetBatchLegsSection } from "./BetBatchLegsSection";
import { BetBatchSetupSection } from "./BetBatchSetupSection";
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
  useCombinedMainOddsSync();
  useBetAdjustmentAvailabilitySync({
    bookmakerAccounts,
    hasBookmakerAccountsLoaded,
  });

  return (
    <form
      ref={formRef}
      onSubmit={form.handleSubmit(onSubmit, focusFirstInvalidField)}
      className="min-w-0 space-y-3"
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

      <BetBatchSetupSection
        mode={mode}
        defaultBookmakerAccountId={defaultBookmakerAccountId}
      />
      <BetBatchLegsSection mode={mode} bookmakerAccounts={bookmakerAccounts} />
      <BetBatchSummarySection />

      <div className="sticky bottom-0 z-10 flex justify-end border-t bg-background/95 py-3 backdrop-blur">
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading
            ? "Guardando..."
            : mode === "create"
              ? "Registrar operación"
              : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

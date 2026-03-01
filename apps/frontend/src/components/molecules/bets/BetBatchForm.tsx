"use client";

import { FormProvider } from "react-hook-form";

import { useBookmakerAccounts } from "@/hooks/api/useBookmakerAccounts";
import { useBetBatchForm } from "@/hooks/useBetBatchForm";

import { BetBatchFormContent } from "./BetBatchFormContent";
import type { BetBatchFormProps } from "./types";

export function BetBatchForm({
  mode,
  initialData,
  initialContext,
  onSubmit,
  isLoading = false,
  apiErrorMessage,
  onDismissApiError,
}: BetBatchFormProps) {
  const { data: bookmakerAccountsResponse } = useBookmakerAccounts({
    pageIndex: 0,
    pageSize: 100,
  });
  const bookmakerAccounts = bookmakerAccountsResponse?.data ?? [];
  const hasBookmakerAccountsLoaded = bookmakerAccountsResponse !== undefined;
  const contextualBookmakerAccountId = bookmakerAccounts.find(
    (bookmakerAccount) => bookmakerAccount.id === initialContext?.bookmakerAccountId
  )?.id;
  const defaultBookmakerAccountId =
    contextualBookmakerAccountId ?? bookmakerAccounts[0]?.id ?? "";
  const formMethods = useBetBatchForm(
    initialData,
    defaultBookmakerAccountId,
    initialContext
  );

  return (
    <FormProvider {...formMethods}>
      <BetBatchFormContent
        mode={mode}
        initialContext={initialContext}
        onSubmit={onSubmit}
        isLoading={isLoading}
        apiErrorMessage={apiErrorMessage}
        onDismissApiError={onDismissApiError}
        bookmakerAccounts={bookmakerAccounts}
        hasBookmakerAccountsLoaded={hasBookmakerAccountsLoaded}
        defaultBookmakerAccountId={defaultBookmakerAccountId}
      />
    </FormProvider>
  );
}

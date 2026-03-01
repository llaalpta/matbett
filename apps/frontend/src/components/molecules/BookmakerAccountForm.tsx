"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  bookmakerAccountTypeOptions,
  BookmakerAccountSchema,
  type BookmakerAccount,
} from "@matbett/shared";
import { useEffect, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { InputField, SelectField } from "@/components/atoms";
import { ApiErrorBanner, ValidationErrorBanner } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { useFormInvalidSubmitFocus } from "@/hooks/useFormInvalidSubmitFocus";

type BookmakerAccountFormValues = z.input<typeof BookmakerAccountSchema>;

type BookmakerAccountFormProps = {
  onSubmit: (data: BookmakerAccount) => Promise<void> | void;
  initialData?: Partial<BookmakerAccountFormValues>;
  isLoading?: boolean;
  apiErrorMessage?: string | null;
  onDismissApiError?: () => void;
  submitLabel?: string;
};

export function BookmakerAccountForm({
  onSubmit,
  initialData,
  isLoading = false,
  apiErrorMessage,
  onDismissApiError,
  submitLabel = "Guardar cuenta",
}: BookmakerAccountFormProps) {
  const defaultValues = useMemo<BookmakerAccountFormValues>(
    () => ({
      bookmaker: initialData?.bookmaker ?? "",
      accountType: initialData?.accountType ?? "SPORTSBOOK",
      accountIdentifier: initialData?.accountIdentifier ?? "",
      realBalance: initialData?.realBalance ?? 0,
      bonusBalance: initialData?.bonusBalance ?? 0,
      freebetBalance: initialData?.freebetBalance ?? 0,
    }),
    [initialData]
  );

  const formMethods = useForm<
    BookmakerAccountFormValues,
    undefined,
    BookmakerAccount
  >({
    resolver: zodResolver(BookmakerAccountSchema),
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const { formRef, validationBannerRef, focusFirstInvalidField } =
    useFormInvalidSubmitFocus();
  const { handleSubmit, reset } = formMethods;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <FormProvider {...formMethods}>
      <form
        ref={formRef}
        onSubmit={handleSubmit(onSubmit, focusFirstInvalidField)}
        className="space-y-6"
      >
        <ValidationErrorBanner<BookmakerAccountFormValues>
          errors={formMethods.formState.errors}
          submitCount={formMethods.formState.submitCount}
          containerRef={validationBannerRef}
          mode="generic"
          onDismiss={() => formMethods.clearErrors()}
        />
        <ApiErrorBanner
          errorMessage={apiErrorMessage}
          onDismissError={onDismissApiError}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <InputField<BookmakerAccountFormValues>
            name="bookmaker"
            label="Operador / casa"
            placeholder="Bet365, Betfair Exchange, OrbitX..."
            required
          />
          <SelectField<BookmakerAccountFormValues>
            name="accountType"
            label="Tipo de cuenta"
            options={bookmakerAccountTypeOptions}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InputField<BookmakerAccountFormValues>
            name="accountIdentifier"
            label="Identificador de cuenta"
            placeholder="usuario@email.com"
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <InputField<BookmakerAccountFormValues>
            name="realBalance"
            label="Saldo real"
            type="number"
            step={0.01}
          />
          <InputField<BookmakerAccountFormValues>
            name="bonusBalance"
            label="Saldo bono"
            type="number"
            step={0.01}
          />
          <InputField<BookmakerAccountFormValues>
            name="freebetBalance"
            label="Saldo freebet"
            type="number"
            step={0.01}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : submitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

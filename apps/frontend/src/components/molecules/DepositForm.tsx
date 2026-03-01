"use client";

import { bookmakerOptions } from "@matbett/shared";
import type { Deposit } from "@matbett/shared";
import React, { useCallback } from "react";
import { FormProvider, type SubmitHandler } from "react-hook-form";

import { InputField, SelectField } from "@/components/atoms";
import { DateTimeField } from "@/components/atoms/DateTimeField";
import { ApiErrorBanner, ValidationErrorBanner } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { useDepositForm } from "@/hooks/useDepositForm";
import { useFormInvalidSubmitFocus } from "@/hooks/useFormInvalidSubmitFocus";

type DepositFormData = Deposit;

interface DepositFormProps {
  onSubmit: SubmitHandler<DepositFormData>;
  initialData?: Partial<DepositFormData>;
  isLoading?: boolean;
  onValueChange?: (amount: number) => void;
  apiErrorMessage?: string | null;
  onDismissApiError?: () => void;
  showSubmitButton?: boolean;
}

export const DepositForm: React.FC<DepositFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
  onValueChange,
  apiErrorMessage,
  onDismissApiError,
  showSubmitButton = true,
}) => {
  const { formMethods } = useDepositForm({
    initialData,
  });
  const { formRef, validationBannerRef, focusFirstInvalidField } =
    useFormInvalidSubmitFocus();

  const handleAmountChange = useCallback(
    (value: number | undefined | string) => {
      if (!onValueChange || typeof value !== "number") {
        return;
      }
      onValueChange(value || 0);
    },
    [onValueChange]
  );

  const handleSubmit = formMethods.handleSubmit(onSubmit, focusFirstInvalidField);

  return (
    <FormProvider {...formMethods}>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <ValidationErrorBanner<DepositFormData>
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

        <InputField<DepositFormData>
          control={formMethods.control}
          name="amount"
          label="Cantidad"
          type="number"
          placeholder="0.00"
          onValueChange={handleAmountChange}
        />

        <SelectField<DepositFormData>
          control={formMethods.control}
          name="bookmaker"
          label="Casa de Apuestas"
          options={bookmakerOptions}
          placeholder="Selecciona una casa"
        />

        <DateTimeField<DepositFormData>
          control={formMethods.control}
          name="date"
          label="Fecha y Hora"
        />

        <InputField<DepositFormData>
          control={formMethods.control}
          name="code"
          label="Codigo Promocional (opcional)"
          placeholder="ej: WELCOME100"
        />

        {showSubmitButton ? (
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Guardando..." : "Registrar Deposito"}
          </Button>
        ) : null}
      </form>
    </FormProvider>
  );
};

"use client";

import { bookmakerOptions } from "@matbett/shared";
import type { Deposit } from "@matbett/shared";
import React from "react";
import { FormProvider } from "react-hook-form";

import { InputField, SelectField } from "@/components/atoms";
import { DateTimeField } from "@/components/atoms/DateTimeField";
import { Button } from "@/components/ui/button";
import { useDepositForm } from "@/hooks/useDepositForm";

type DepositFormData = Deposit;

interface DepositFormProps {
  onSubmit: (data: DepositFormData) => void | Promise<void>;
  initialData?: Partial<DepositFormData>;
  isLoading?: boolean;
  onValueChange?: (amount: number) => void;
  showSubmitButton?: boolean;
}

export const DepositForm: React.FC<DepositFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
  onValueChange,
  showSubmitButton = true,
}) => {
  const { formMethods, handleAmountChange, isValid } = useDepositForm({
    initialData,
    onValueChange,
  });

  // Handler de submit agnóstico - usa onSubmit pasado como prop
  const handleSubmit = formMethods.handleSubmit(onSubmit);

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          control={formMethods.control}
          name="amount"
          label="Cantidad"
          type="number"
          placeholder="0.00"
          onValueChange={handleAmountChange}
        />

        <SelectField
          control={formMethods.control}
          name="bookmaker"
          label="Casa de Apuestas"
          options={bookmakerOptions}
          placeholder="Selecciona una casa"
        />

        <DateTimeField
          control={formMethods.control}
          name="date"
          label="Fecha y Hora"
        />

        <InputField
          control={formMethods.control}
          name="code"
          label="Código Promocional (opcional)"
          placeholder="ej: WELCOME100"
        />

        {showSubmitButton && (
          <Button
            type="submit"
            disabled={!isValid || isLoading}
            className="w-full"
          >
            {isLoading ? "Guardando..." : "Registrar Depósito"}
          </Button>
        )}
      </form>
    </FormProvider>
  );
};

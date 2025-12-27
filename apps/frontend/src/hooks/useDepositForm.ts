import { zodResolver } from "@hookform/resolvers/zod";
import { DepositSchema, type Deposit } from "@matbett/shared";
import { useCallback } from "react";
import { useForm } from "react-hook-form";


// Tipo inferido del schema (cuando haya tRPC route, usar RouterInputs)
type DepositFormData = Deposit;

interface UseDepositFormOptions {
  initialData?: Partial<DepositFormData>;
  onValueChange?: (amount: number) => void;
}

export const useDepositForm = ({ 
  initialData,
  onValueChange 
}: UseDepositFormOptions = {}) => {
  const form = useForm<DepositFormData>({
    resolver: zodResolver(DepositSchema),
    defaultValues: {
      bookmaker: "BET365",
      amount: 0,
      date: new Date(),
      code: "",
      ...initialData,
    },
    mode: "onChange",
  });


  // Handler para cambio de amount - compatible con InputField
  const handleAmountChange = useCallback(
    (value: number | undefined | string) => {
      if (onValueChange && typeof value === 'number') {
        onValueChange(value || 0);
      }
    },
    [onValueChange]
  );

  return {
    formMethods: form,
    handleAmountChange,
    isValid: form.formState.isValid,
  };
};

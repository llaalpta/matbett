import { zodResolver } from "@hookform/resolvers/zod";
import { DepositSchema, type Deposit } from "@matbett/shared";
import { useEffect, useMemo } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";


// Tipo inferido del schema (cuando haya tRPC route, usar RouterInputs)
type DepositFormData = Deposit;

interface UseDepositFormOptions {
  initialData?: Partial<DepositFormData>;
}

export const useDepositForm = ({
  initialData,
}: UseDepositFormOptions = {}): {
  formMethods: UseFormReturn<DepositFormData>;
} => {
  const defaultValues = useMemo(
    () => ({
      bookmakerAccountId: "",
      amount: 0,
      date: new Date(),
      code: "",
      ...initialData,
    }),
    [initialData]
  );

  const form = useForm<DepositFormData>({
    resolver: zodResolver(DepositSchema),
    defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  return {
    formMethods: form,
  };
};

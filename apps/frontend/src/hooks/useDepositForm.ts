import { zodResolver } from "@hookform/resolvers/zod";
import { DepositSchema, bookmakerOptions, type Deposit } from "@matbett/shared";
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
  const form = useForm<DepositFormData>({
    resolver: zodResolver(DepositSchema),
    defaultValues: {
      bookmaker: bookmakerOptions[2].value,
      amount: 0,
      date: new Date(),
      code: "",
      ...initialData,
    },
    mode: "onChange",
  });

  return {
    formMethods: form,
  };
};

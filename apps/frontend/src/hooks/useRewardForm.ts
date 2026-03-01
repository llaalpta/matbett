import { zodResolver } from "@hookform/resolvers/zod";
import { RewardSchema } from "@matbett/shared";
import { useEffect, useMemo } from "react";
import { useForm, UseFormReturn } from "react-hook-form";

import type { RewardFormData, RewardServerModel } from "@/types/hooks";
import { buildDefaultReward } from "@/utils/formDefaults";

/**
 * Hook factory para crear el form de Reward standalone
 * Patron consistente con usePromotionForm
 */
export const useRewardForm = (
  initialData?: RewardServerModel
): UseFormReturn<RewardFormData> => {
  const defaultValues = useMemo(
    () => buildDefaultReward(initialData?.type || "FREEBET", initialData),
    [initialData]
  );

  const form = useForm<RewardFormData>({
    resolver: zodResolver(RewardSchema),
    defaultValues,
    mode: "onSubmit", // Validacion solo al intentar submit
    reValidateMode: "onChange", // Despues del submit, revalida en cada cambio
  });

  const { reset } = form;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return form;
};

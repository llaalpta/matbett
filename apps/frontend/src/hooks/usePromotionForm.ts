import { zodResolver } from "@hookform/resolvers/zod";
import { PromotionSchema } from "@matbett/shared";
import { useEffect, useMemo } from "react";
import { useForm, UseFormReturn } from "react-hook-form";

import type { PromotionFormData, PromotionServerModel } from "@/types/hooks";
import { buildDefaultPromotion } from "@/utils/formDefaults";

export const normalizePromotionSubmitData = (
  data: PromotionFormData
): PromotionFormData => {
  if (data.cardinality !== "SINGLE" || data.phases.length === 0) {
    return data;
  }

  const phase0 = data.phases[0];
  const normalizedPhase0 = {
    ...phase0,
    name: data.name,
    description: data.description || "",
    timeframe: data.timeframe,
    activationMethod: data.activationMethod || "AUTOMATIC",
  };

  return {
    ...data,
    phases: [normalizedPhase0],
  };
};

export const usePromotionForm = (
  initialData?: PromotionServerModel
): UseFormReturn<PromotionFormData> => {
  const defaultValues = useMemo(
    () => buildDefaultPromotion(initialData),
    [initialData]
  );

  const form = useForm<PromotionFormData>({
    resolver: zodResolver(PromotionSchema),
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

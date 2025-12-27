import { zodResolver } from "@hookform/resolvers/zod";
import { PromotionSchema } from "@matbett/shared";
import { useForm, UseFormReturn } from "react-hook-form";

import type { PromotionFormData, PromotionServerModel } from "@/types/hooks";
import { buildDefaultPromotion } from "@/utils/formDefaults";

export const usePromotionForm = (
  initialData?: PromotionServerModel
): UseFormReturn<PromotionFormData> => {
  return useForm<PromotionFormData>({
    resolver: zodResolver(PromotionSchema),
    defaultValues: buildDefaultPromotion(initialData),
    mode: "onSubmit",          // Validación solo al intentar submit
    reValidateMode: "onChange", // Después del submit, revalida en cada cambio
  });
};
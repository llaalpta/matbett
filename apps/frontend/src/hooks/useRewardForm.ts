import { zodResolver } from "@hookform/resolvers/zod";
import { RewardSchema } from "@matbett/shared";
import { useForm, UseFormReturn } from "react-hook-form";

import type { RewardFormData, RewardServerModel } from "@/types/hooks";
import { buildDefaultReward } from "@/utils/formDefaults";

/**
 * Hook factory para crear el form de Reward standalone
 * Patrón consistente con usePromotionForm
 */
export const useRewardForm = (
  initialData?: RewardServerModel
): UseFormReturn<RewardFormData> => {
  return useForm<RewardFormData>({
    resolver: zodResolver(RewardSchema),
    defaultValues: buildDefaultReward(
      initialData?.type || "FREEBET",
      initialData
    ),
    mode: "onSubmit",          // Validación solo al intentar submit
    reValidateMode: "onChange", // Después del submit, revalida en cada cambio
  });
};

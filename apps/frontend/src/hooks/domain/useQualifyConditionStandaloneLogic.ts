import { useWatch, type Control } from "react-hook-form";

import type { RewardQualifyConditionFormData } from "@/types/hooks";
import { buildQualifyConditionDraftAnchorCatalog } from "@/utils/anchorCatalog";

import { useAnchorContext } from "./useAnchorContext";

interface UseQualifyConditionStandaloneLogicArgs {
  control: Control<RewardQualifyConditionFormData>;
  promotionId?: string;
}

export function useQualifyConditionStandaloneLogic({
  control,
  promotionId,
}: UseQualifyConditionStandaloneLogicArgs) {
  const currentQualifyCondition = useWatch({ control });
  const draftCatalog = buildQualifyConditionDraftAnchorCatalog(
    currentQualifyCondition
  );

  return useAnchorContext({
    promotionId,
    draftCatalog,
  });
}

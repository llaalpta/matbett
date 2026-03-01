import { useCallback } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { buildPhasePaths } from "@/components/molecules/phase.paths";
import { usePhaseStatusDateSync } from "@/hooks/useStatusDateSync";
import type { PhaseServerModel, PromotionFormData } from "@/types/hooks";
import { buildDefaultReward } from "@/utils/formDefaults";

interface UsePhaseLogicArgs {
  phaseIndex: number;
  phaseServerData?: PhaseServerModel;
}

export function usePhaseLogic({
  phaseIndex,
  phaseServerData,
}: UsePhaseLogicArgs) {
  const { control, getValues, setValue } = useFormContext<PromotionFormData>();
  const {
    phasePath,
    rewardsPath,
    rewardsWatchPath,
    statusPath,
    statusDatePath,
    namePath,
    descriptionPath,
    activationMethodPath,
    timeframePaths,
    getRewardFieldPath,
  } = buildPhasePaths(phaseIndex);

  const rewardsFieldArray = useFieldArray({
    control,
    name: rewardsPath,
  });

  const rewardsValues = useWatch<PromotionFormData, typeof rewardsWatchPath>({
    control,
    name: rewardsWatchPath,
  });
  const promotionStatus = useWatch({
    control,
    name: "status",
  });
  const promotionTimeframe = useWatch({
    control,
    name: "timeframe",
  });
  const phaseStatusValue = useWatch({
    control,
    name: statusPath,
  });
  const phaseTimeframe = useWatch({
    control,
    name: `${phasePath}.timeframe`,
  });

  usePhaseStatusDateSync({
    control,
    setValue,
    statusPath,
    datePath: statusDatePath,
    serverDates: phaseServerData
      ? {
          activatedAt: phaseServerData.activatedAt ?? null,
          completedAt: phaseServerData.completedAt ?? null,
          expiredAt: phaseServerData.expiredAt ?? null,
        }
      : undefined,
  });

  const addReward = useCallback(
    (type: string = "FREEBET") => {
      rewardsFieldArray.append(buildDefaultReward(type));
    },
    [rewardsFieldArray]
  );

  const hasRewardDependencies = useCallback(
    (rewardIndex: number) => {
      const hasDraftQualifyConditions =
        (rewardsValues?.[rewardIndex]?.qualifyConditions?.length ?? 0) > 0;
      const serverCanDelete = phaseServerData?.rewards?.[rewardIndex]?.canDelete ?? true;
      return hasDraftQualifyConditions || !serverCanDelete;
    },
    [phaseServerData?.rewards, rewardsValues]
  );

  const getRewardRemoveDisabledReason = useCallback(
    (rewardIndex: number) => {
      if (hasRewardDependencies(rewardIndex)) {
        return "No se puede eliminar porque tiene dependencias.";
      }
      return undefined;
    },
    [hasRewardDependencies]
  );

  const canRemoveReward = useCallback(
    (rewardIndex: number, isSimplified: boolean) => {
      if (isSimplified && rewardsFieldArray.fields.length <= 1) {
        return false;
      }
      return !hasRewardDependencies(rewardIndex);
    },
    [hasRewardDependencies, rewardsFieldArray.fields.length]
  );

  const removeReward = useCallback(
    (rewardIndex: number) => {
      if (hasRewardDependencies(rewardIndex)) {
        return;
      }
      rewardsFieldArray.remove(rewardIndex);
    },
    [hasRewardDependencies, rewardsFieldArray]
  );

  const getRewardIdByIndex = useCallback(
    (rewardIndex: number) => {
      const rewardPath = getRewardFieldPath(rewardIndex);
      const reward = getValues(rewardPath);
      if (
        reward &&
        typeof reward === "object" &&
        "id" in reward &&
        typeof reward.id === "string"
      ) {
        return reward.id;
      }
      return undefined;
    },
    [getRewardFieldPath, getValues]
  );

  return {
    rewardsFieldArray,
    rewardsValues,
    addReward,
    removeReward,
    canRemoveReward,
    getRewardRemoveDisabledReason,
    getRewardIdByIndex,
    getRewardFieldPath,
    namePath,
    descriptionPath,
    activationMethodPath,
    promotionStatus,
    promotionTimeframe,
    phaseStatusValue,
    phaseTimeframe,
    statusPath,
    statusDatePath,
    timeframePaths,
  };
}

import {
  evaluateTimeframeState,
  getPhaseLifecyclePolicy,
  type AnchorOccurrences,
  TimeframeSchema,
} from "@matbett/shared";
import { useMemo } from "react";

import type { PhaseFormData, PhaseServerModel, PromotionFormData } from "@/types/hooks";

type UsePhaseAccessLogicParams = {
  isPersisted: boolean;
  promotionStatus?: PromotionFormData["status"] | string;
  phaseStatus?: PhaseFormData["status"] | PhaseServerModel["status"] | string;
  timeframe?: unknown;
  promotionTimeframe?: unknown;
  anchorOccurrences?: AnchorOccurrences;
  rewards?: PhaseFormData["rewards"];
};

export function usePhaseAccessLogic({
  isPersisted,
  promotionStatus,
  phaseStatus,
  timeframe,
  promotionTimeframe,
  anchorOccurrences,
  rewards,
}: UsePhaseAccessLogicParams) {
  return useMemo(() => {
    const parsedTimeframe = TimeframeSchema.safeParse(timeframe);
    const parsedPromotionTimeframe = TimeframeSchema.safeParse(promotionTimeframe);
    const timeframeState = evaluateTimeframeState({
      timeframe: parsedTimeframe.success ? parsedTimeframe.data : null,
      promotionTimeframe: parsedPromotionTimeframe.success
        ? parsedPromotionTimeframe.data
        : null,
      anchorOccurrences,
    });
    const lifecycle = getPhaseLifecyclePolicy({
      isPersisted,
      promotionStatus,
      phaseStatus,
      timeframeState,
      rewards: rewards?.map((reward) => ({
        rewardStatus: reward.status,
        qualifyConditionStatuses: reward.qualifyConditions?.map(
          (condition) => condition.status,
        ),
      })),
    });

    return {
      isStructureEditable: lifecycle.canEditStructure,
      structureLockedReason:
        lifecycle.structureReasons.map((reason) => reason.message).join(" ") ||
        undefined,
      statusOptions: lifecycle.statusOptions.map((option) => ({
        value: option.value,
        label: option.label,
        disabled: !option.enabled,
        description:
          option.reasons.length > 0
            ? option.reasons.map((reason) => reason.message).join(" ")
            : undefined,
      })),
      warnings: lifecycle.warnings.map((warning) => warning.message),
    };
  }, [
    anchorOccurrences,
    isPersisted,
    phaseStatus,
    promotionStatus,
    promotionTimeframe,
    rewards,
    timeframe,
  ]);
}

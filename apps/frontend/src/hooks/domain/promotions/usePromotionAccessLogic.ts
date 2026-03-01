import {
  evaluateTimeframeState,
  getPromotionLifecyclePolicy,
  TimeframeSchema,
} from "@matbett/shared";
import { useMemo } from "react";

import type { PromotionFormData, PromotionServerModel } from "@/types/hooks";

type UsePromotionAccessLogicParams = {
  isPersisted: boolean;
  promotionStatus?:
    | PromotionFormData["status"]
    | NonNullable<PromotionServerModel>["status"]
    | string;
  timeframe?: unknown;
  phases?: PromotionFormData["phases"];
};

export function usePromotionAccessLogic({
  isPersisted,
  promotionStatus,
  timeframe,
  phases,
}: UsePromotionAccessLogicParams) {
  return useMemo(() => {
    const parsedTimeframe = TimeframeSchema.safeParse(timeframe);
    const timeframeState = evaluateTimeframeState({
      timeframe: parsedTimeframe.success ? parsedTimeframe.data : null,
    });
    const lifecycle = getPromotionLifecyclePolicy({
      isPersisted,
      promotionStatus,
      timeframeState,
      phases: phases?.map((phase) => ({
        phaseStatus: phase.status,
        rewards: phase.rewards?.map((reward) => ({
          rewardStatus: reward.status,
          qualifyConditionStatuses: reward.qualifyConditions?.map(
            (condition) => condition.status,
          ),
        })),
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
  }, [isPersisted, phases, promotionStatus, timeframe]);
}

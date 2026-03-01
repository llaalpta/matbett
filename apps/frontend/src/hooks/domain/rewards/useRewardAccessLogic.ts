import {
  evaluateTimeframeState,
  getRewardLifecyclePolicy,
  type AnchorOccurrences,
  TimeframeSchema,
} from "@matbett/shared";
import { useMemo } from "react";

import type { PromotionServerModel, RewardServerModel } from "@/types/hooks";

type RewardAccessLogicParams = {
  isPersisted: boolean;
  rewardType?: RewardServerModel["type"] | string;
  rewardStatus?: RewardServerModel["status"] | string;
  claimMethod?: RewardServerModel["claimMethod"] | string;
  qualifyConditionStatuses?: Array<
    RewardServerModel["qualifyConditions"][number]["status"] | string | undefined
  >;
  promotion?: PromotionServerModel | null;
  phaseId?: string;
  promotionStatus?: NonNullable<PromotionServerModel>["status"] | string;
  phaseStatus?: NonNullable<PromotionServerModel>["phases"][number]["status"] | string;
  usageTimeframe?: unknown;
  promotionTimeframe?: unknown;
  anchorOccurrences?: AnchorOccurrences;
};

const resolvePhaseStatus = (
  promotion: PromotionServerModel | null | undefined,
  phaseId: string | undefined,
  phaseStatusOverride: RewardAccessLogicParams["phaseStatus"]
) => {
  if (phaseStatusOverride) {
    return phaseStatusOverride;
  }

  if (!promotion || !phaseId) {
    return undefined;
  }

  return promotion.phases.find((phase) => phase.id === phaseId)?.status;
};

export function useRewardAccessLogic({
  isPersisted,
  rewardType,
  rewardStatus,
  claimMethod,
  qualifyConditionStatuses,
  promotion,
  phaseId,
  promotionStatus,
  phaseStatus,
  usageTimeframe,
  promotionTimeframe,
  anchorOccurrences,
}: RewardAccessLogicParams) {
  return useMemo(() => {
    const resolvedPromotionStatus = promotionStatus ?? promotion?.status;
    const resolvedPhaseStatus = resolvePhaseStatus(
      promotion,
      phaseId,
      phaseStatus
    );

    const parsedUsageTimeframe = TimeframeSchema.safeParse(usageTimeframe);
    const parsedPromotionTimeframe = TimeframeSchema.safeParse(
      promotionTimeframe ?? promotion?.timeframe,
    );
    const usageTimeframeState = evaluateTimeframeState({
      timeframe: parsedUsageTimeframe.success ? parsedUsageTimeframe.data : null,
      promotionTimeframe: parsedPromotionTimeframe.success
        ? parsedPromotionTimeframe.data
        : null,
      anchorOccurrences,
    });

    const lifecycle = getRewardLifecyclePolicy({
      isPersisted,
      rewardType,
      rewardStatus,
      claimMethod,
      promotionStatus: resolvedPromotionStatus,
      phaseStatus: resolvedPhaseStatus,
      qualifyConditionStatuses,
      usageTimeframeState,
    });

    return {
      supportsBetUsage: lifecycle.supportsBetUsage,
      canLaunchBetEntry: lifecycle.betEntry.enabled,
      betEntryDisabledReason:
        lifecycle.betEntry.reasons.map((reason) => reason.message).join(" ") ||
        undefined,
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
    claimMethod,
    isPersisted,
    anchorOccurrences,
    phaseId,
    phaseStatus,
    promotion,
    promotionTimeframe,
    promotionStatus,
    qualifyConditionStatuses,
    rewardStatus,
    rewardType,
    usageTimeframe,
  ]);
}

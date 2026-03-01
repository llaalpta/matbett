import {
  evaluateTimeframeState,
  getQualifyConditionLifecyclePolicy,
  type AnchorOccurrences,
  TimeframeSchema,
} from "@matbett/shared";
import { useMemo } from "react";

import type {
  PromotionServerModel,
  RewardQualifyConditionServerModel,
  RewardServerModel,
} from "@/types/hooks";

type QualifyConditionAccessLogicParams = {
  isPersisted: boolean;
  conditionId?: string;
  conditionType?: RewardQualifyConditionServerModel["type"] | string;
  conditionStatus?: RewardQualifyConditionServerModel["status"] | string;
  promotion?: PromotionServerModel | null;
  rewardStatus?: RewardServerModel["status"] | string;
  promotionStatus?: NonNullable<PromotionServerModel>["status"] | string;
  phaseStatus?: NonNullable<PromotionServerModel>["phases"][number]["status"] | string;
  timeframe?: unknown;
  promotionTimeframe?: unknown;
  anchorOccurrences?: AnchorOccurrences;
  allowRetries?: boolean;
  maxAttempts?: number;
  currentAttempts?: number;
};

const resolveParentContexts = (
  promotion: PromotionServerModel | null | undefined,
  conditionId: string | undefined
) => {
  if (!promotion || !conditionId) {
    return [];
  }

  const parentContexts: Array<{
    rewardStatus?: RewardServerModel["status"] | string;
    phaseStatus?: NonNullable<PromotionServerModel>["phases"][number]["status"] | string;
    promotionStatus?: NonNullable<PromotionServerModel>["status"] | string;
  }> = [];

  for (const phase of promotion.phases) {
    for (const reward of phase.rewards) {
      if (reward.qualifyConditions.some((condition) => condition.id === conditionId)) {
        parentContexts.push({
          rewardStatus: reward.status,
          phaseStatus: phase.status,
          promotionStatus: promotion.status,
        });
      }
    }
  }

  return parentContexts;
};

const dedupeParentContexts = (
  parentContexts: ReturnType<typeof resolveParentContexts>
) => {
  const seen = new Set<string>();
  return parentContexts.filter((parentContext) => {
    const key = `${parentContext.promotionStatus ?? ""}:${parentContext.phaseStatus ?? ""}:${parentContext.rewardStatus ?? ""}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export function useQualifyConditionAccessLogic({
  isPersisted,
  conditionId,
  conditionType,
  conditionStatus,
  promotion,
  rewardStatus,
  promotionStatus,
  phaseStatus,
  timeframe,
  promotionTimeframe,
  anchorOccurrences,
  allowRetries,
  maxAttempts,
  currentAttempts,
}: QualifyConditionAccessLogicParams) {
  return useMemo(() => {
    const resolvedParentContexts =
      rewardStatus || promotionStatus || phaseStatus
        ? [
            {
              rewardStatus,
              promotionStatus: promotionStatus ?? promotion?.status,
              phaseStatus,
            },
          ]
        : dedupeParentContexts(resolveParentContexts(promotion, conditionId));

    const parsedTimeframe = TimeframeSchema.safeParse(timeframe);
    const parsedPromotionTimeframe = TimeframeSchema.safeParse(
      promotionTimeframe ?? promotion?.timeframe,
    );
    const timeframeState = evaluateTimeframeState({
      timeframe: parsedTimeframe.success ? parsedTimeframe.data : null,
      promotionTimeframe: parsedPromotionTimeframe.success
        ? parsedPromotionTimeframe.data
        : null,
      anchorOccurrences,
    });
    const noRetriesRemaining =
      typeof currentAttempts === "number" &&
      currentAttempts > 0 &&
      (allowRetries === false ||
        (allowRetries === true &&
          typeof maxAttempts === "number" &&
          currentAttempts >= maxAttempts));

    const lifecycle = getQualifyConditionLifecyclePolicy({
      isPersisted,
      conditionType,
      conditionStatus,
      parents: resolvedParentContexts,
      noRetriesRemaining,
      timeframeState,
    });

    return {
      supportsBetRegistration: lifecycle.supportsBetRegistration,
      supportsDepositRegistration: lifecycle.supportsDepositRegistration,
      canRegisterTrackingAction: lifecycle.trackingAction.enabled,
      trackingActionDisabledReason:
        lifecycle.trackingAction.reasons.map((reason) => reason.message).join(" ") ||
        undefined,
      canLaunchBetEntry: lifecycle.betEntry.enabled,
      betEntryDisabledReason:
        lifecycle.betEntry.reasons.map((reason) => reason.message).join(" ") ||
        undefined,
      canLaunchDepositEntry: lifecycle.depositEntry.enabled,
      depositEntryDisabledReason:
        lifecycle.depositEntry.reasons.map((reason) => reason.message).join(" ") ||
        undefined,
      isDefinitionEditable: lifecycle.canEditStructure,
      definitionLockedReason:
        lifecycle.structureReasons.map((reason) => reason.message).join(" ") ||
        undefined,
      canEditStatus: lifecycle.canEditStatus,
      statusLockedReason:
        lifecycle.statusReasons.map((reason) => reason.message).join(" ") ||
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
    conditionId,
    conditionStatus,
    conditionType,
    allowRetries,
    anchorOccurrences,
    currentAttempts,
    isPersisted,
    maxAttempts,
    phaseStatus,
    promotion,
    promotionTimeframe,
    promotionStatus,
    rewardStatus,
    timeframe,
  ]);
}

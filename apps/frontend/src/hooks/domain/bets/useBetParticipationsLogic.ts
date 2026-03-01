"use client";

import { useCallback, useMemo } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import type {
  QualifyTrackingContext,
  RewardUsageContext,
} from "@/components/molecules/bets/types";
import { useAvailableBetPromotionContexts } from "@/hooks/api/useBets";
import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";

type UseBetParticipationsLogicArgs = {
  legIndex: number;
};

type BetParticipation =
  NonNullable<BetBatchFormValues["legs"][number]["participations"]>[number];

function createParticipationKey() {
  return `pk_${crypto.randomUUID()}`;
}

function getParticipationObjectiveKey(
  participation: BetParticipation | undefined
): string | undefined {
  if (!participation) {
    return undefined;
  }

  return participation.kind === "QUALIFY_TRACKING"
    ? `QUALIFY_TRACKING:${participation.qualifyConditionId}`
    : `REWARD_USAGE:${participation.usageTrackingId}`;
}

function getQualifyTrackingObjectiveKey(context: QualifyTrackingContext) {
  return `QUALIFY_TRACKING:${context.qualifyConditionId}`;
}

function getRewardUsageObjectiveKey(context: RewardUsageContext) {
  return `REWARD_USAGE:${context.usageTrackingId}`;
}

export function useBetParticipationsLogic({
  legIndex,
}: UseBetParticipationsLogicArgs) {
  const form = useFormContext<BetBatchFormValues>();
  const watchedLegs = useWatch({ control: form.control, name: "legs" });
  const legs = useMemo(() => watchedLegs ?? [], [watchedLegs]);
  const leg = legs[legIndex];
  const participationsFieldArray = useFieldArray({
    control: form.control,
    name: `legs.${legIndex}.participations`,
  });
  const availableContexts = useAvailableBetPromotionContexts(
    leg?.bookmakerAccountId || undefined
  );

  const qualifyTrackingContexts = useMemo(
    () => availableContexts.data?.qualifyTrackingContexts ?? [],
    [availableContexts.data?.qualifyTrackingContexts]
  );
  const rewardUsageContexts = useMemo(
    () => availableContexts.data?.rewardUsageContexts ?? [],
    [availableContexts.data?.rewardUsageContexts]
  );

  const contributesByObjective = useMemo(() => {
    const next = new Map<string, number>();

    for (const currentLeg of legs) {
      for (const participation of currentLeg?.participations ?? []) {
        if (!participation.contributesToTracking) {
          continue;
        }

        const objectiveKey = getParticipationObjectiveKey(participation);
        if (!objectiveKey) {
          continue;
        }

        next.set(objectiveKey, (next.get(objectiveKey) ?? 0) + 1);
      }
    }

    return next;
  }, [legs]);

  const appendQualifyParticipation = useCallback(() => {
    const context = qualifyTrackingContexts[0];
    const firstReward = context?.rewards[0];

    if (!context || !firstReward) {
      return;
    }

    const objectiveKey = getQualifyTrackingObjectiveKey(context);

    participationsFieldArray.append({
      participationKey: createParticipationKey(),
      kind: "QUALIFY_TRACKING",
      rewardType: firstReward.rewardType,
      contributesToTracking: !contributesByObjective.has(objectiveKey),
      qualifyConditionId: context.qualifyConditionId,
      rewardIds: context.rewards.map((reward) => reward.rewardId),
      calculationRewardId: firstReward.rewardId,
    });
  }, [
    contributesByObjective,
    participationsFieldArray,
    qualifyTrackingContexts,
  ]);

  const appendRewardUsageParticipation = useCallback(() => {
    const context = rewardUsageContexts[0];

    if (!context) {
      return;
    }

    const objectiveKey = getRewardUsageObjectiveKey(context);

    participationsFieldArray.append({
      participationKey: createParticipationKey(),
      kind: "REWARD_USAGE",
      rewardType: context.rewardType,
      contributesToTracking: !contributesByObjective.has(objectiveKey),
      usageTrackingId: context.usageTrackingId,
      rewardId: context.rewardId,
    });
  }, [contributesByObjective, participationsFieldArray, rewardUsageContexts]);

  const handleContributionChange = useCallback(
    (participationIndex: number, nextValue: boolean) => {
      const currentParticipation = legs[legIndex]?.participations?.[participationIndex];
      const objectiveKey = getParticipationObjectiveKey(currentParticipation);

      if (!currentParticipation || !objectiveKey) {
        return;
      }

      const currentPath =
        `legs.${legIndex}.participations.${participationIndex}.contributesToTracking` as const;

      if (!nextValue) {
        const hasOtherContributor = legs.some((candidateLeg, candidateLegIndex) =>
          (candidateLeg?.participations ?? []).some(
            (candidateParticipation, candidateParticipationIndex) =>
              !(
                candidateLegIndex === legIndex &&
                candidateParticipationIndex === participationIndex
              ) &&
              candidateParticipation.contributesToTracking &&
              getParticipationObjectiveKey(candidateParticipation) === objectiveKey
          )
        );

        if (!hasOtherContributor) {
          form.setValue(currentPath, true);
        }

        return;
      }

      for (let candidateLegIndex = 0; candidateLegIndex < legs.length; candidateLegIndex += 1) {
        const candidateLeg = legs[candidateLegIndex];

        for (
          let candidateParticipationIndex = 0;
          candidateParticipationIndex < (candidateLeg?.participations?.length ?? 0);
          candidateParticipationIndex += 1
        ) {
          if (
            candidateLegIndex === legIndex &&
            candidateParticipationIndex === participationIndex
          ) {
            continue;
          }

          const candidateParticipation =
            candidateLeg?.participations?.[candidateParticipationIndex];

          if (
            getParticipationObjectiveKey(candidateParticipation) !== objectiveKey ||
            !candidateParticipation?.contributesToTracking
          ) {
            continue;
          }

          form.setValue(
            `legs.${candidateLegIndex}.participations.${candidateParticipationIndex}.contributesToTracking`,
            false
          );
        }
      }
    },
    [form, legIndex, legs]
  );

  return {
    leg,
    participations: leg?.participations ?? [],
    removeParticipation: participationsFieldArray.remove,
    qualifyTrackingContexts,
    rewardUsageContexts,
    appendQualifyParticipation,
    appendRewardUsageParticipation,
    handleContributionChange,
  };
}

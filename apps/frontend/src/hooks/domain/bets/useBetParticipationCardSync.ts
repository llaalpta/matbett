"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import type {
  QualifyTrackingContext,
  RewardUsageContext,
} from "@/components/molecules/bets/types";
import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";

type UseBetParticipationCardSyncArgs = {
  legIndex: number;
  participationIndex: number;
  participation:
    | NonNullable<BetBatchFormValues["legs"][number]["participations"]>[number]
    | undefined;
  qualifyTrackingContexts: QualifyTrackingContext[];
  rewardUsageContexts: RewardUsageContext[];
};

type BetParticipation =
  NonNullable<BetBatchFormValues["legs"][number]["participations"]>[number];

type BetParticipationSyncUpdate =
  | {
      field: "rewardIds";
      value: string[];
    }
  | {
      field: "calculationRewardId";
      value: string;
    }
  | {
      field: "rewardType";
      value: BetParticipation["rewardType"];
    }
  | {
      field: "rewardId";
      value: string;
    };

function getBetParticipationSyncUpdates(args: {
  participation: BetParticipation | undefined;
  qualifyTrackingContexts: QualifyTrackingContext[];
  rewardUsageContexts: RewardUsageContext[];
}): BetParticipationSyncUpdate[] {
  const { participation, qualifyTrackingContexts, rewardUsageContexts } = args;
  if (!participation) {
    return [];
  }

  if (participation.kind === "QUALIFY_TRACKING") {
    return getQualifyTrackingSyncUpdates(participation, qualifyTrackingContexts);
  }

  return getRewardUsageSyncUpdates(participation, rewardUsageContexts);
}

function getQualifyTrackingSyncUpdates(
  participation: Extract<BetParticipation, { kind: "QUALIFY_TRACKING" }>,
  qualifyTrackingContexts: QualifyTrackingContext[]
): BetParticipationSyncUpdate[] {
  const selectedContext = qualifyTrackingContexts.find(
    (context) => context.qualifyConditionId === participation.qualifyConditionId
  );
  const fallbackReward = selectedContext?.rewards[0];
  const updates: BetParticipationSyncUpdate[] = [];

  if (selectedContext) {
    const rewardIds = selectedContext.rewards.map((reward) => reward.rewardId);
    if (!areStringArraysEqual(participation.rewardIds, rewardIds)) {
      updates.push({
        field: "rewardIds",
        value: rewardIds,
      });
    }
  }

  if (
    selectedContext &&
    !selectedContext.rewards.some(
      (reward) => reward.rewardId === participation.calculationRewardId
    )
  ) {
    updates.push({
      field: "calculationRewardId",
      value: fallbackReward?.rewardId ?? "",
    });
  }

  const rewardType =
    selectedContext?.rewards.find(
      (reward) => reward.rewardId === participation.calculationRewardId
    )?.rewardType ?? fallbackReward?.rewardType;

  if (rewardType && rewardType !== participation.rewardType) {
    updates.push({
      field: "rewardType",
      value: rewardType,
    });
  }

  return updates;
}

function getRewardUsageSyncUpdates(
  participation: Extract<BetParticipation, { kind: "REWARD_USAGE" }>,
  rewardUsageContexts: RewardUsageContext[]
): BetParticipationSyncUpdate[] {
  const selectedContext = rewardUsageContexts.find(
    (context) => context.usageTrackingId === participation.usageTrackingId
  );

  if (!selectedContext) {
    return [];
  }

  const updates: BetParticipationSyncUpdate[] = [];
  if (selectedContext.rewardId !== participation.rewardId) {
    updates.push({
      field: "rewardId",
      value: selectedContext.rewardId,
    });
  }
  if (selectedContext.rewardType !== participation.rewardType) {
    updates.push({
      field: "rewardType",
      value: selectedContext.rewardType,
    });
  }

  return updates;
}

function areStringArraysEqual(
  left: readonly string[] | undefined,
  right: readonly string[]
) {
  if (!left || left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

export function useBetParticipationCardSync({
  legIndex,
  participationIndex,
  participation,
  qualifyTrackingContexts,
  rewardUsageContexts,
}: UseBetParticipationCardSyncArgs) {
  const form = useFormContext<BetBatchFormValues>();

  useEffect(() => {
    for (const update of getBetParticipationSyncUpdates({
      participation,
      qualifyTrackingContexts,
      rewardUsageContexts,
    })) {
      switch (update.field) {
        case "rewardIds":
          form.setValue(
            `legs.${legIndex}.participations.${participationIndex}.rewardIds`,
            update.value
          );
          break;
        case "calculationRewardId":
          form.setValue(
            `legs.${legIndex}.participations.${participationIndex}.calculationRewardId`,
            update.value
          );
          break;
        case "rewardType":
          form.setValue(
            `legs.${legIndex}.participations.${participationIndex}.rewardType`,
            update.value
          );
          break;
        case "rewardId":
          form.setValue(
            `legs.${legIndex}.participations.${participationIndex}.rewardId`,
            update.value
          );
          break;
      }
    }
  }, [
    form,
    legIndex,
    participation,
    participationIndex,
    qualifyTrackingContexts,
    rewardUsageContexts,
  ]);
}

"use client";

import {
  betParticipationKindOptions,
  getLabel,
  qualifyConditionTypeOptions,
  rewardTypeOptions,
} from "@matbett/shared";
import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";
import type { BetAvailablePromotionContexts } from "@/types/hooks";
import { getBetOperationBetSummary } from "@/utils/bets";

type BetParticipation =
  NonNullable<BetBatchFormValues["legs"][number]["participations"]>[number];

export type QualifyTrackingContext =
  BetAvailablePromotionContexts["qualifyTrackingContexts"][number];
export type RewardUsageContext =
  BetAvailablePromotionContexts["rewardUsageContexts"][number];

export type BetPromotionContextSummary = {
  key: string;
  kind: BetParticipation["kind"];
  rewardType: BetParticipation["rewardType"];
  label: string;
  description: string;
  contributorLegIndex: number | null;
  targetParticipationKey: string | undefined;
};

function createParticipationKey() {
  return `pk_${crypto.randomUUID()}`;
}

function getObjectiveKey(participation: BetParticipation) {
  return participation.kind === "QUALIFY_TRACKING"
    ? `QUALIFY_TRACKING:${participation.qualifyConditionId}`
    : `REWARD_USAGE:${participation.usageTrackingId}`;
}

function getQualifyContextKey(context: QualifyTrackingContext) {
  return `QUALIFY_TRACKING:${context.qualifyConditionId}`;
}

function getRewardUsageContextKey(context: RewardUsageContext) {
  return `REWARD_USAGE:${context.usageTrackingId}`;
}

function buildQualifyParticipation(
  context: QualifyTrackingContext,
  contributesToTracking: boolean
): BetParticipation {
  const reward = context.rewards[0];
  if (!reward) {
    throw new Error("Qualify tracking context has no rewards.");
  }

  return {
    participationKey: createParticipationKey(),
    kind: "QUALIFY_TRACKING",
    rewardType: reward.rewardType,
    contributesToTracking,
    qualifyConditionId: context.qualifyConditionId,
    rewardIds: context.rewards.map((candidate) => candidate.rewardId),
    calculationRewardId: reward.rewardId,
  };
}

function buildRewardUsageParticipation(
  context: RewardUsageContext,
  contributesToTracking: boolean
): BetParticipation {
  return {
    participationKey: createParticipationKey(),
    kind: "REWARD_USAGE",
    rewardType: context.rewardType,
    contributesToTracking,
    usageTrackingId: context.usageTrackingId,
    rewardId: context.rewardId,
  };
}

function getContextLabel(
  participation: BetParticipation,
  qualifyContextById: Map<string, QualifyTrackingContext>,
  rewardUsageContextById: Map<string, RewardUsageContext>
) {
  if (participation.kind === "QUALIFY_TRACKING") {
    const context = qualifyContextById.get(participation.qualifyConditionId);
    const rewardLabels =
      context?.rewards.map((reward) => getLabel(rewardTypeOptions, reward.rewardType)) ??
      [getLabel(rewardTypeOptions, participation.rewardType)];

    return {
      label: context?.promotionName ?? "Condición de calificación",
      description: context
        ? `${getLabel(
            qualifyConditionTypeOptions,
            context.qualifyConditionType
          )} para ${rewardLabels.join(", ")}`
        : getLabel(betParticipationKindOptions, participation.kind),
    };
  }

  const context = rewardUsageContextById.get(participation.usageTrackingId);
  return {
    label: context?.promotionName ?? "Uso de recompensa",
    description: context
      ? `${context.phaseName} · ${getLabel(rewardTypeOptions, context.rewardType)} · ${context.rewardValue}`
      : getLabel(betParticipationKindOptions, participation.kind),
  };
}

function buildContextSummaries(args: {
  legs: BetBatchFormValues["legs"];
  qualifyContexts: QualifyTrackingContext[];
  rewardUsageContexts: RewardUsageContext[];
}): BetPromotionContextSummary[] {
  const { legs, qualifyContexts, rewardUsageContexts } = args;
  const summaries = new Map<string, BetPromotionContextSummary>();
  const qualifyContextById = new Map(
    qualifyContexts.map((context) => [context.qualifyConditionId, context])
  );
  const rewardUsageContextById = new Map(
    rewardUsageContexts.map((context) => [context.usageTrackingId, context])
  );

  legs.forEach((leg, legIndex) => {
    (leg.participations ?? []).forEach((participation) => {
      const key = getObjectiveKey(participation);
      const existing = summaries.get(key);
      const label = getContextLabel(
        participation,
        qualifyContextById,
        rewardUsageContextById
      );

      summaries.set(key, {
        key,
        kind: participation.kind,
        rewardType: participation.rewardType,
        label: existing?.label ?? label.label,
        description: existing?.description ?? label.description,
        contributorLegIndex: participation.contributesToTracking
          ? legIndex
          : (existing?.contributorLegIndex ?? null),
        targetParticipationKey: participation.contributesToTracking
          ? participation.participationKey
          : existing?.targetParticipationKey,
      });
    });
  });

  return [...summaries.values()];
}

export function useBetPromotionContextAssignment({
  qualifyContexts = [],
  rewardUsageContexts = [],
}: {
  qualifyContexts?: QualifyTrackingContext[];
  rewardUsageContexts?: RewardUsageContext[];
} = {}) {
  const form = useFormContext<BetBatchFormValues>();
  const watchedLegs = useWatch({ control: form.control, name: "legs" });
  const legs = useMemo(() => watchedLegs ?? [], [watchedLegs]);
  const operation = useWatch({ control: form.control, name: "operation" });
  const strategy = useWatch({ control: form.control, name: "strategy" });
  const currentTarget = useWatch({
    control: form.control,
    name: "calculation.target.participationKey",
  });
  const summaries = useMemo(
    () =>
      buildContextSummaries({
        legs,
        qualifyContexts,
        rewardUsageContexts,
      }),
    [legs, qualifyContexts, rewardUsageContexts]
  );

  const getLegLabel = (legIndex: number) => {
    const leg = legs[legIndex];
    if (!leg) {
      return "Apuesta no disponible";
    }

    const summary = getBetOperationBetSummary({
      index: legIndex,
      operation,
      role: leg.legRole,
      strategy,
    });

    return `${summary.label} (${summary.description})`;
  };

  const hasContext = (contextKey: string) =>
    legs.some((leg) =>
      (leg.participations ?? []).some(
        (participation) => getObjectiveKey(participation) === contextKey
      )
    );

  const summariesByLegIndex = useMemo(() => {
    const result = new Map<number, BetPromotionContextSummary[]>();
    summaries.forEach((summary) => {
      if (summary.contributorLegIndex === null) {
        return;
      }

      result.set(summary.contributorLegIndex, [
        ...(result.get(summary.contributorLegIndex) ?? []),
        summary,
      ]);
    });

    return result;
  }, [summaries]);

  const getSummariesForLeg = (legIndex: number) =>
    summariesByLegIndex.get(legIndex) ?? [];

  const addParticipationToLeg = (
    legIndex: number,
    objectiveKey: string,
    buildParticipation: () => BetParticipation
  ) => {
    if (hasContext(objectiveKey)) {
      return;
    }

    const participation = buildParticipation();
    form.setValue(
      "legs",
      legs.map((leg, currentLegIndex) => ({
        ...leg,
        participations:
          currentLegIndex === legIndex
            ? [...(leg.participations ?? []), participation]
            : (leg.participations ?? []),
      })),
      { shouldDirty: true }
    );

    if (strategy.kind === "HEDGE" && !currentTarget) {
      form.setValue(
        "calculation.target",
        {
          participationKey: participation.participationKey,
        },
        { shouldDirty: true }
      );
    }
  };

  const addQualifyContextToLeg = (
    legIndex: number,
    context: QualifyTrackingContext
  ) => {
    addParticipationToLeg(legIndex, getQualifyContextKey(context), () =>
      buildQualifyParticipation(context, true)
    );
  };

  const addRewardUsageContextToLeg = (
    legIndex: number,
    context: RewardUsageContext
  ) => {
    addParticipationToLeg(legIndex, getRewardUsageContextKey(context), () =>
      buildRewardUsageParticipation(context, true)
    );
  };

  const removeContext = (summary: BetPromotionContextSummary) => {
    form.setValue(
      "legs",
      legs.map((leg) => ({
        ...leg,
        participations: (leg.participations ?? []).filter(
          (participation) => getObjectiveKey(participation) !== summary.key
        ),
      })),
      { shouldDirty: true }
    );

    if (currentTarget === summary.targetParticipationKey) {
      form.setValue("calculation.target", undefined, { shouldDirty: true });
    }
  };

  const removeContextsFromLeg = (legIndex: number) => {
    const removedParticipationKeys = new Set(
      (legs[legIndex]?.participations ?? []).map(
        (participation) => participation.participationKey
      )
    );

    if (removedParticipationKeys.size === 0) {
      return;
    }

    form.setValue(
      "legs",
      legs.map((leg, currentLegIndex) => ({
        ...leg,
        participations:
          currentLegIndex === legIndex ? [] : (leg.participations ?? []),
      })),
      { shouldDirty: true }
    );

    if (currentTarget && removedParticipationKeys.has(currentTarget)) {
      form.setValue("calculation.target", undefined, { shouldDirty: true });
    }
  };

  const markSummaryAsCalculationTarget = (
    summary: BetPromotionContextSummary
  ) => {
    if (!summary.targetParticipationKey) {
      return;
    }

    form.setValue(
      "calculation.target",
      {
        participationKey: summary.targetParticipationKey,
      },
      { shouldDirty: true }
    );
  };

  return {
    legs,
    strategy,
    currentTarget,
    summaries,
    getSummariesForLeg,
    getLegLabel,
    hasContext,
    getQualifyContextKey,
    getRewardUsageContextKey,
    addQualifyContextToLeg,
    addRewardUsageContextToLeg,
    removeContext,
    removeContextsFromLeg,
    markSummaryAsCalculationTarget,
  };
}

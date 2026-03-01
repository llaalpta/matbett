"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  UpdateBetsBatchSchema,
  type BatchEvent,
  type BetSelection,
  type LegRole,
  type UpdateBetLegInput,
  type UpdateBetsBatch,
} from "@matbett/shared";
import { useEffect, useMemo } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";

import type { BetBatchServerModel } from "@/types/hooks";

export type BetBatchFormValues = z.input<typeof UpdateBetsBatchSchema>;
type BetParticipation = NonNullable<
  BetBatchFormValues["legs"][number]["participations"]
>[number];

export type BetBatchInitialParticipation =
  | {
      kind: "QUALIFY_TRACKING";
      rewardType: BetParticipation["rewardType"];
      qualifyConditionId: string;
      rewardIds: string[];
      calculationRewardId: string;
    }
  | {
      kind: "REWARD_USAGE";
      rewardType: BetParticipation["rewardType"];
      usageTrackingId: string;
      rewardId: string;
    };

export type BetBatchInitialContext = {
  entryType: "qualify-condition" | "reward";
  bookmakerAccountId: string;
  promotionName?: string;
  sourceLabel?: string;
  phaseName?: string;
  returnHref?: string;
  returnLabel?: string;
  initialParticipation: BetBatchInitialParticipation;
};

const persistedParticipationPrefix = "persisted:";

function toPersistedParticipationKey(participationId: string) {
  return `${persistedParticipationPrefix}${participationId}`;
}

function createParticipationKey() {
  return `pk_${crypto.randomUUID()}`;
}

function buildInitialParticipation(
  initialContext: BetBatchInitialContext
): BetParticipation {
  if (initialContext.initialParticipation.kind === "QUALIFY_TRACKING") {
    return {
      participationKey: createParticipationKey(),
      kind: "QUALIFY_TRACKING",
      rewardType: initialContext.initialParticipation.rewardType,
      contributesToTracking: true,
      qualifyConditionId: initialContext.initialParticipation.qualifyConditionId,
      rewardIds: initialContext.initialParticipation.rewardIds,
      calculationRewardId: initialContext.initialParticipation.calculationRewardId,
    };
  }

  return {
    participationKey: createParticipationKey(),
    kind: "REWARD_USAGE",
    rewardType: initialContext.initialParticipation.rewardType,
    contributesToTracking: true,
    usageTrackingId: initialContext.initialParticipation.usageTrackingId,
    rewardId: initialContext.initialParticipation.rewardId,
  };
}

function createDefaultBatchEvent(index: number): BatchEvent {
  return {
    eventName: `Evento ${index + 1}`,
    marketName: "",
    eventOptions: "TWO_OPTIONS",
  };
}

function createDefaultLeg(
  legOrder: number,
  role: LegRole | undefined,
  eventCount: number,
  bookmakerAccountId = ""
): UpdateBetLegInput {
  return {
    betId: undefined,
    legRole: role,
    legOrder,
    bookmakerAccountId,
    selections: buildSelections(role, eventCount, eventCount > 1),
    stake: 0,
    odds: 0,
    commission: 0,
    profit: 0,
    risk: 0,
    yield: 0,
    status: "PENDING",
    placedAt: new Date(),
    settledAt: null,
    participations: [],
  };
}

function buildBetBatchEditorDefaults(
  initialData?: BetBatchServerModel,
  defaultBookmakerAccountId = "",
  initialContext?: BetBatchInitialContext
): UpdateBetsBatch {
  if (!initialData) {
    const contextualParticipation = initialContext
      ? buildInitialParticipation(initialContext)
      : undefined;

    return {
      strategy: { kind: "NONE" },
      calculation: contextualParticipation
        ? {
            target: {
              participationKey: contextualParticipation.participationKey,
            },
          }
        : {},
      events: [createDefaultBatchEvent(0)],
      legs: [
        {
          ...createDefaultLeg(
            0,
            undefined,
            1,
            initialContext?.bookmakerAccountId ?? defaultBookmakerAccountId
          ),
          participations: contextualParticipation ? [contextualParticipation] : [],
        },
      ],
      profit: 0,
      risk: 0,
      yield: 0,
    };
  }

  return {
    strategy: initialData.strategy,
    calculation: initialData.calculationParticipationId
      ? {
          scenarioId: initialData.scenarioId,
          target: {
            participationKey: toPersistedParticipationKey(
              initialData.calculationParticipationId
            ),
          },
        }
      : {
          scenarioId: initialData.scenarioId,
        },
    events: initialData.events,
    profit: initialData.profit,
    risk: initialData.risk,
    yield: initialData.yield,
    legs: initialData.legs.map((leg) => ({
      betId: leg.id,
      legRole: leg.legRole,
      legOrder: leg.legOrder,
      bookmakerAccountId: leg.bookmakerAccountId,
      selections: leg.selections,
      stake: leg.stake,
      odds: leg.odds,
      commission: leg.commission,
      profit: leg.profit,
      risk: leg.risk,
      yield: leg.yield,
      status: leg.status,
      placedAt: leg.placedAt,
      settledAt: leg.settledAt ?? null,
      enhancedOdds: leg.enhancedOdds,
      participations: leg.participations.map((participation) =>
        participation.kind === "QUALIFY_TRACKING"
          ? {
              participationKey: toPersistedParticipationKey(participation.id),
              kind: participation.kind,
              rewardType: participation.rewardType,
              contributesToTracking: participation.contributesToTracking,
              qualifyConditionId: participation.qualifyConditionId,
              rewardIds: participation.rewardIds,
              calculationRewardId: participation.calculationRewardId,
            }
          : {
              participationKey: toPersistedParticipationKey(participation.id),
              kind: participation.kind,
              rewardType: participation.rewardType,
              contributesToTracking: participation.contributesToTracking,
              usageTrackingId: participation.usageTrackingId,
              rewardId: participation.rewardId,
            }
      ),
    })),
  };
}

function buildSelections(
  role: LegRole | undefined,
  eventCount: number,
  isCombined: boolean,
  existingSelections?: BetSelection[]
) {
  const byEventIndex = new Map(
    (existingSelections ?? []).map((selection) => [selection.eventIndex, selection])
  );

  if (!isCombined) {
    const selection = byEventIndex.get(0);

    return [
      {
        eventIndex: 0,
        selection: selection?.selection ?? "",
      },
    ];
  }

  if (role === "MAIN") {
    return Array.from({ length: eventCount }, (_, eventIndex) => {
      const selection = byEventIndex.get(eventIndex);

      return {
        eventIndex,
        selection: selection?.selection ?? "",
        odds: selection?.odds,
      };
    });
  }

  const eventIndex = role === "HEDGE1" ? 0 : role === "HEDGE2" ? 1 : 2;
  const selection = byEventIndex.get(eventIndex);

  return [
    {
      eventIndex,
      selection: selection?.selection ?? "",
    },
  ];
}

export const useBetBatchForm = (
  initialData?: BetBatchServerModel,
  defaultBookmakerAccountId = "",
  initialContext?: BetBatchInitialContext
): UseFormReturn<BetBatchFormValues, undefined, UpdateBetsBatch> => {
  const defaultValues = useMemo(
    () =>
      buildBetBatchEditorDefaults(
        initialData ?? undefined,
        defaultBookmakerAccountId,
        initialContext
      ),
    [defaultBookmakerAccountId, initialContext, initialData]
  );

  const form = useForm<BetBatchFormValues, undefined, UpdateBetsBatch>({
    resolver: zodResolver(UpdateBetsBatchSchema),
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const { reset } = form;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return form;
};

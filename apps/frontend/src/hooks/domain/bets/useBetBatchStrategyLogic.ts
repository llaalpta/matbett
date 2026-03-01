"use client";

import {
  BatchEvent,
  BetSelection,
  LegRole,
  UpdateBetLegInputSchema,
  betLineModeOptions,
  getExpectedLegRolesForStrategy,
  getAvailableScenarioOptions,
  getExpectedEventCount,
  hedgeModeOptions,
  strategyTypeOptions,
} from "@matbett/shared";
import { useEffect, useMemo } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { z } from "zod";

import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";

type UseBetBatchStrategyLogicOptions = {
  mode: "create" | "edit";
  defaultBookmakerAccountId: string;
};

type BetBatchStrategy = BetBatchFormValues["strategy"];
type BetBatchLeg = BetBatchFormValues["legs"][number];
type BetBatchEvent = BetBatchFormValues["events"][number];
type BetBatchOperation = "create" | "update";
type BetLegFormValue = z.input<typeof UpdateBetLegInputSchema>;

type NormalizeHedgeStrategyArgs = {
  strategy: Extract<BetBatchStrategy, { kind: "HEDGE" }>;
  operation: BetBatchOperation;
  mode: "create" | "edit";
};

type BuildExpectedLegsArgs = {
  legs: BetBatchFormValues["legs"];
  strategy: Extract<BetBatchStrategy, { kind: "HEDGE" }>;
  operation: BetBatchOperation;
  eventCount: number;
  defaultBookmakerAccountId: string;
};

type CreateDefaultLegOptions = {
  defaultCommission?: number;
};

function createParticipationKey() {
  return `pk_${crypto.randomUUID()}`;
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
  bookmakerAccountId = "",
  options?: CreateDefaultLegOptions
): BetBatchLeg {
  return {
    betId: undefined,
    legRole: role,
    legOrder,
    bookmakerAccountId,
    selections: buildSelections(role, eventCount, eventCount > 1),
    stake: 0,
    odds: 0,
    commission: options?.defaultCommission ?? 0,
    profit: 0,
    risk: 0,
    yield: 0,
    status: "PENDING",
    placedAt: new Date(),
    settledAt: null,
    participations: [],
  };
}

function syncLegShape(
  leg: BetLegFormValue | undefined,
  legOrder: number,
  role: LegRole | undefined,
  eventCount: number,
  bookmakerAccountId = "",
  options?: CreateDefaultLegOptions
): BetBatchLeg {
  const nextSelections = buildSelections(
    role,
    eventCount,
    eventCount > 1,
    leg?.selections
  );

  return {
    ...createDefaultLeg(legOrder, role, eventCount, bookmakerAccountId, options),
    ...leg,
    legRole: role,
    legOrder,
    bookmakerAccountId: leg?.bookmakerAccountId || bookmakerAccountId,
    selections: nextSelections,
    participations:
      (leg?.participations ?? []).map((participation) => ({
        ...participation,
        participationKey: participation.participationKey || createParticipationKey(),
      })),
  };
}

function buildSelections(
  role: LegRole | undefined,
  eventCount: number,
  isCombined: boolean,
  existingSelections?: BetSelection[]
): BetSelection[] {
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

function normalizeBetBatchStrategy(
  strategy: BetBatchStrategy,
  operation: BetBatchOperation,
  mode: "create" | "edit"
): BetBatchStrategy {
  if (strategy.kind === "NONE") {
    return strategy;
  }

  return normalizeHedgeStrategy({ strategy, operation, mode });
}

function areBetBatchStrategiesEqual(
  left: BetBatchStrategy,
  right: BetBatchStrategy
): boolean {
  if (left.kind !== right.kind) {
    return false;
  }

  if (left.kind === "NONE" && right.kind === "NONE") {
    return true;
  }

  if (left.kind !== "HEDGE" || right.kind !== "HEDGE") {
    return false;
  }

  return (
    left.strategyType === right.strategyType &&
    left.lineMode === right.lineMode &&
    left.mode === right.mode &&
    left.dutchingOptionsCount === right.dutchingOptionsCount &&
    left.hedgeAdjustmentType === right.hedgeAdjustmentType
  );
}

function buildExpectedBatchEvents(
  events: BetBatchFormValues["events"],
  eventCount: number
): BetBatchEvent[] {
  return Array.from(
    { length: eventCount },
    (_, index) => events[index] ?? createDefaultBatchEvent(index)
  );
}

function needsStandaloneLegSync(legs: BetBatchFormValues["legs"]): boolean {
  return (
    legs.length !== 1 ||
    legs[0]?.legRole !== undefined ||
    legs[0]?.selections.length !== 1
  );
}

function buildStandaloneBatchLegs(
  legs: BetBatchFormValues["legs"],
  defaultBookmakerAccountId: string
): BetBatchLeg[] {
  return [
    syncLegShape(legs[0], 0, undefined, 1, defaultBookmakerAccountId, {
      defaultCommission: 0,
    }),
  ];
}

function buildExpectedBatchLegs({
  legs,
  strategy,
  operation,
  eventCount,
  defaultBookmakerAccountId,
}: BuildExpectedLegsArgs): BetBatchLeg[] {
  const nextRoles = getExpectedLegRolesForStrategy(strategy, operation);

  return nextRoles.map((role, index) => {
    const existingLeg =
      legs.find((candidate) => candidate.legRole === role) ?? legs[index];

    return syncLegShape(
      existingLeg,
      index,
      role,
      eventCount,
      defaultBookmakerAccountId,
      {
        defaultCommission: getDefaultLegCommissionForStrategy(strategy, role),
      }
    );
  });
}

function needsBatchLegShapeSync(
  currentLegs: BetBatchFormValues["legs"],
  nextLegs: BetBatchFormValues["legs"]
): boolean {
  return (
    currentLegs.length !== nextLegs.length ||
    nextLegs.some((nextLeg, index) => {
      const currentLeg = currentLegs[index];
      return (
        currentLeg?.legRole !== nextLeg.legRole ||
        currentLeg?.selections.length !== nextLeg.selections.length ||
        currentLeg?.legOrder !== nextLeg.legOrder
      );
    })
  );
}

function normalizeHedgeStrategy({
  strategy,
  operation,
  mode,
}: NormalizeHedgeStrategyArgs): Extract<BetBatchStrategy, { kind: "HEDGE" }> {
  const baseAvailability = getAvailableScenarioOptions({ operation });
  const strategyType = baseAvailability.strategyTypes.includes(strategy.strategyType)
    ? strategy.strategyType
    : baseAvailability.strategyTypes[0];

  const typeAvailability = getAvailableScenarioOptions({
    operation,
    strategyType,
  });
  const lineMode = typeAvailability.lineModes.includes(strategy.lineMode)
    ? strategy.lineMode
    : typeAvailability.lineModes[0];

  const lineModeAvailability = getAvailableScenarioOptions({
    operation,
    strategyType,
    lineMode,
  });
  const modeValue = lineModeAvailability.modes.includes(strategy.mode)
    ? strategy.mode
    : lineModeAvailability.modes[0];

  const dutchingOptionsCount =
    strategyType === "DUTCHING" && lineMode === "SINGLE"
      ? strategy.dutchingOptionsCount !== undefined &&
        lineModeAvailability.dutchingOptionsCounts.includes(
          strategy.dutchingOptionsCount
        )
        ? strategy.dutchingOptionsCount
        : lineModeAvailability.dutchingOptionsCounts[0]
      : undefined;

  const hedgeAdjustmentType =
    mode === "edit" &&
    lineMode === "SINGLE" &&
    strategy.hedgeAdjustmentType &&
    lineModeAvailability.hedgeAdjustmentTypes.includes(
      strategy.hedgeAdjustmentType
    )
      ? strategy.hedgeAdjustmentType
      : undefined;

  return {
    kind: "HEDGE",
    strategyType,
    lineMode,
    mode: modeValue,
    dutchingOptionsCount,
    hedgeAdjustmentType,
  };
}

function getDefaultLegCommissionForStrategy(
  strategy: Extract<BetBatchStrategy, { kind: "HEDGE" }>,
  role: BetBatchLeg["legRole"]
): number {
  return strategy.strategyType === "MATCHED_BETTING" && role && role !== "MAIN"
    ? 2
    : 0;
}

export function useBetBatchStrategyLogic({
  mode,
  defaultBookmakerAccountId,
}: UseBetBatchStrategyLogicOptions) {
  const operation = mode === "edit" ? "update" : "create";
  const form = useFormContext<BetBatchFormValues>();
  const strategy = useWatch({ control: form.control, name: "strategy" });
  const watchedLegs = useWatch({ control: form.control, name: "legs" });
  const watchedEvents = useWatch({ control: form.control, name: "events" });
  const legs = useMemo(() => watchedLegs ?? [], [watchedLegs]);
  const events = useMemo(() => watchedEvents ?? [], [watchedEvents]);
  const eventsFieldArray = useFieldArray({
    control: form.control,
    name: "events",
  });
  const legsFieldArray = useFieldArray({
    control: form.control,
    name: "legs",
  });
  const baseAvailability = useMemo(
    () => getAvailableScenarioOptions({ operation }),
    [operation]
  );
  const normalizedStrategy = useMemo(
    () => normalizeBetBatchStrategy(strategy, operation, mode),
    [mode, operation, strategy]
  );

  const availability = useMemo(
    () =>
      normalizedStrategy.kind === "HEDGE"
        ? getAvailableScenarioOptions({
            operation,
            strategyType: normalizedStrategy.strategyType,
            lineMode: normalizedStrategy.lineMode,
            mode: normalizedStrategy.mode,
            dutchingOptionsCount: normalizedStrategy.dutchingOptionsCount,
            hedgeAdjustmentType:
              mode === "edit"
                ? normalizedStrategy.hedgeAdjustmentType
                : undefined,
          })
        : undefined,
    [mode, normalizedStrategy, operation]
  );
  const modeAvailability = useMemo(
    () =>
      normalizedStrategy.kind === "HEDGE"
        ? getAvailableScenarioOptions({
            operation,
            strategyType: normalizedStrategy.strategyType,
            lineMode: normalizedStrategy.lineMode,
          })
        : undefined,
    [normalizedStrategy, operation]
  );

  useEffect(() => {
    if (strategy.kind === "NONE") {
      const nextEvents = buildExpectedBatchEvents(events, 1);
      if (events.length !== 1) {
        eventsFieldArray.replace(nextEvents);
      }

      if (needsStandaloneLegSync(legs)) {
        legsFieldArray.replace(
          buildStandaloneBatchLegs(legs, defaultBookmakerAccountId)
        );
      }

      if (form.getValues("calculation.target")) {
        form.setValue("calculation.target", undefined);
      }
      if (form.getValues("calculation.scenarioId")) {
        form.setValue("calculation.scenarioId", undefined);
      }
      return;
    }

    if (!areBetBatchStrategiesEqual(strategy, normalizedStrategy)) {
      form.setValue("strategy", normalizedStrategy);
      return;
    }

    if (normalizedStrategy.kind !== "HEDGE") {
      return;
    }

    const eventCount = getExpectedEventCount(normalizedStrategy);
    if (events.length !== eventCount) {
      eventsFieldArray.replace(buildExpectedBatchEvents(events, eventCount));
    }

    const nextLegs = buildExpectedBatchLegs({
      legs,
      strategy: normalizedStrategy,
      operation,
      eventCount,
      defaultBookmakerAccountId,
    });

    if (needsBatchLegShapeSync(legs, nextLegs)) {
      legsFieldArray.replace(nextLegs);
    }
  }, [
    defaultBookmakerAccountId,
    events,
    eventsFieldArray,
    form,
    legs,
    legsFieldArray,
    normalizedStrategy,
    operation,
    strategy,
  ]);

  const strategyTypeOptionsFiltered =
    strategy.kind === "HEDGE"
      ? strategyTypeOptions.filter((option) =>
          baseAvailability.strategyTypes.includes(option.value)
        )
      : [];
  const lineModeOptionsFiltered =
    strategy.kind === "HEDGE" && availability
      ? betLineModeOptions.filter((option) =>
          availability.lineModes.includes(option.value)
        )
      : [];
  const modeOptionsFiltered =
    strategy.kind === "HEDGE" && modeAvailability
      ? hedgeModeOptions.filter((option) =>
          modeAvailability.modes.includes(option.value)
        )
      : [];
  return {
    strategy,
    availability,
    strategyTypeOptionsFiltered,
    lineModeOptionsFiltered,
    modeOptionsFiltered,
  };
}

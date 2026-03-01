import type {
  BatchEvent,
  BetBatchSummary,
  BetLegInput,
  BetListItem,
  BetPromotionContext,
  BetParticipation,
  BetRegistrationBatch,
  PromotionParticipationInput,
  RegisterBetsBatch,
  StrategyContext,
  UpdateBetLegInput,
  UpdateBetsBatch,
} from '@matbett/shared';
import {
  BetLineModeSchema,
  BatchEventSchema,
  BetParticipationSchema,
  BetRegistrationBatchSchema,
  BetSchema,
  BetStatusSchema,
  HedgeAdjustmentTypeSchema,
  HedgeModeSchema,
  RewardTypeSchema,
  ScenarioIdSchema,
  StrategyTypeSchema,
} from '@matbett/shared';
import { Prisma } from '@prisma/client';

import type {
  BetBatchWithRelations,
  BetWithRelations,
} from '@/repositories/bet.repository';
import { toInputJson } from '@/utils/prisma-json';

type ExistingParticipation = BetBatchWithRelations['bets'][number]['participations'][number];
type BetListParticipation = BetWithRelations['participations'][number];
const persistedParticipationPrefix = 'persisted:';

export type BetLegCreateDiff = {
  input: UpdateBetLegInput;
};

export type BetLegUpdateDiff = {
  betId: string;
  input: UpdateBetLegInput;
  participationUpdates: {
    creates: PromotionParticipationInput[];
    updates: Array<{
      id: string;
      input: PromotionParticipationInput;
    }>;
    deletes: string[];
  };
};

export type BetBatchUpdateDiff = {
  creates: BetLegCreateDiff[];
  updates: BetLegUpdateDiff[];
  deletes: string[];
};

export function toBetBatchCreateInput(
  input: RegisterBetsBatch,
  userId: string,
): Prisma.BetRegistrationBatchUncheckedCreateInput {
  return {
    userId,
    strategyKind: input.strategy.kind,
    strategyType: input.strategy.kind === 'HEDGE' ? input.strategy.strategyType : null,
    lineMode: input.strategy.kind === 'HEDGE' ? input.strategy.lineMode : null,
    mode: input.strategy.kind === 'HEDGE' ? input.strategy.mode : null,
    dutchingOptionsCount:
      input.strategy.kind === 'HEDGE' ? input.strategy.dutchingOptionsCount ?? null : null,
    hedgeAdjustmentType:
      input.strategy.kind === 'HEDGE' ? input.strategy.hedgeAdjustmentType ?? null : null,
    scenarioId: input.calculation.scenarioId ?? null,
    events: toInputJson(input.events),
    profit: input.profit,
    risk: input.risk,
    yield: input.yield,
  };
}

export function toBetBatchUpdateInput(
  input: UpdateBetsBatch,
  calculationParticipationId: string | null,
): Prisma.BetRegistrationBatchUncheckedUpdateInput {
  return {
    strategyKind: input.strategy.kind,
    strategyType: input.strategy.kind === 'HEDGE' ? input.strategy.strategyType : null,
    lineMode: input.strategy.kind === 'HEDGE' ? input.strategy.lineMode : null,
    mode: input.strategy.kind === 'HEDGE' ? input.strategy.mode : null,
    dutchingOptionsCount:
      input.strategy.kind === 'HEDGE' ? input.strategy.dutchingOptionsCount ?? null : null,
    hedgeAdjustmentType:
      input.strategy.kind === 'HEDGE' ? input.strategy.hedgeAdjustmentType ?? null : null,
    scenarioId: input.calculation.scenarioId ?? null,
    calculationParticipationId,
    events: toInputJson(input.events),
    profit: input.profit,
    risk: input.risk,
    yield: input.yield,
  };
}

export function toBetCreateInput(
  input: BetLegInput | UpdateBetLegInput,
  userId: string,
  batchId: string,
): Prisma.BetUncheckedCreateInput {
  return {
    batchId,
    userId,
    bookmakerAccountId: input.bookmakerAccountId,
    legRole: input.legRole ?? null,
    legOrder: input.legOrder,
    selections: toInputJson(input.selections),
    stake: input.stake,
    odds: input.odds,
    commission: input.commission,
    profit: input.profit,
    risk: input.risk,
    yield: input.yield,
    status: input.status,
    placedAt: input.placedAt ?? new Date(),
    settledAt: input.settledAt ?? null,
    enhancedOdds: input.enhancedOdds ? toInputJson(input.enhancedOdds) : Prisma.DbNull,
  };
}

export function toBetUpdateInput(
  input: UpdateBetLegInput,
): Prisma.BetUncheckedUpdateInput {
  return {
    bookmakerAccountId: input.bookmakerAccountId,
    legRole: input.legRole ?? null,
    legOrder: input.legOrder,
    selections: toInputJson(input.selections),
    stake: input.stake,
    odds: input.odds,
    commission: input.commission,
    profit: input.profit,
    risk: input.risk,
    yield: input.yield,
    status: input.status,
    placedAt: input.placedAt ?? new Date(),
    settledAt: input.settledAt ?? null,
    enhancedOdds: input.enhancedOdds ? toInputJson(input.enhancedOdds) : Prisma.DbNull,
  };
}

export function toBetParticipationCreateInput(
  input: PromotionParticipationInput,
  resolved: {
    betId: string;
    batchId: string;
    promotionId: string;
    phaseId?: string;
  },
): Prisma.BetParticipationUncheckedCreateInput {
  return {
    betId: resolved.betId,
    batchId: resolved.batchId,
    kind: input.kind,
    promotionId: resolved.promotionId,
    phaseId: resolved.phaseId ?? null,
    rewardId: input.kind === 'REWARD_USAGE' ? input.rewardId : null,
    rewardIds: input.kind === 'QUALIFY_TRACKING' ? [...input.rewardIds] : [],
    calculationRewardId:
      input.kind === 'QUALIFY_TRACKING' ? input.calculationRewardId : null,
    rewardType: input.rewardType,
    qualifyConditionId:
      input.kind === 'QUALIFY_TRACKING' ? input.qualifyConditionId : null,
    usageTrackingId: input.kind === 'REWARD_USAGE' ? input.usageTrackingId : null,
    contributesToTracking: input.contributesToTracking,
  };
}

export function toBetParticipationUpdateInput(
  input: PromotionParticipationInput,
  resolved: {
    promotionId: string;
    phaseId?: string;
  },
  snapshots?: {
    stakeAmount?: number;
    rolloverContribution?: number;
  },
): Prisma.BetParticipationUncheckedUpdateInput {
  return {
    kind: input.kind,
    promotionId: resolved.promotionId,
    phaseId: resolved.phaseId ?? null,
    rewardId: input.kind === 'REWARD_USAGE' ? input.rewardId : null,
    rewardIds: input.kind === 'QUALIFY_TRACKING' ? [...input.rewardIds] : [],
    calculationRewardId:
      input.kind === 'QUALIFY_TRACKING' ? input.calculationRewardId : null,
    rewardType: input.rewardType,
    qualifyConditionId:
      input.kind === 'QUALIFY_TRACKING' ? input.qualifyConditionId : null,
    usageTrackingId: input.kind === 'REWARD_USAGE' ? input.usageTrackingId : null,
    contributesToTracking: input.contributesToTracking,
    stakeAmount: snapshots?.stakeAmount ?? null,
    rolloverContribution: snapshots?.rolloverContribution ?? null,
  };
}

export function toBetBatchUpdateDiff(
  existing: BetBatchWithRelations,
  input: UpdateBetsBatch,
): BetBatchUpdateDiff {
  const existingBetsById = new Map(existing.bets.map((bet) => [bet.id, bet]));
  const seenBetIds = new Set<string>();
  const creates: BetLegCreateDiff[] = [];
  const updates: BetLegUpdateDiff[] = [];

  for (const leg of input.legs) {
    if (!leg.betId) {
      creates.push({ input: leg });
      continue;
    }

    const existingBet = existingBetsById.get(leg.betId);
    if (!existingBet) {
      creates.push({ input: leg });
      continue;
    }

    seenBetIds.add(leg.betId);
    updates.push({
      betId: leg.betId,
      input: leg,
      participationUpdates: diffParticipations(existingBet.participations, leg.participations),
    });
  }

  const deletes = existing.bets
    .filter((bet) => !seenBetIds.has(bet.id))
    .map((bet) => bet.id);

  return {
    creates,
    updates,
    deletes,
  };
}

export function toBetBatchEntity(batch: BetBatchWithRelations): BetRegistrationBatch {
  return BetRegistrationBatchSchema.parse({
    id: batch.id,
    strategy: toStrategyContext(batch),
    scenarioId: batch.scenarioId ?? undefined,
    calculationParticipationId: batch.calculationParticipationId ?? undefined,
    events: parseBatchEvents(batch.events),
    legs: batch.bets
      .slice()
      .sort((left, right) => left.legOrder - right.legOrder)
      .map((bet) => toBetEntity(bet)),
    profit: batch.profit,
    risk: batch.risk,
    yield: batch.yield,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
  });
}

export function toBetBatchSummary(batch: BetBatchWithRelations): BetBatchSummary {
  return {
    id: batch.id,
    strategy: toStrategyContext(batch),
    scenarioId: batch.scenarioId ? ScenarioIdSchema.parse(batch.scenarioId) : undefined,
    calculationParticipationId: batch.calculationParticipationId ?? undefined,
    legsCount: batch.bets.length,
    bookmakerAccountIds: unique(batch.bets.map((bet) => bet.bookmakerAccountId)),
    statuses: unique(batch.bets.map((bet) => BetStatusSchema.parse(bet.status))),
    profit: batch.profit,
    risk: batch.risk,
    yield: batch.yield,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
  };
}

export function toBetListItem(bet: BetWithRelations): BetListItem {
  return {
    ...toBetEntity(bet),
    strategy: toStrategyContext(bet.batch),
    scenarioId: bet.batch.scenarioId ? ScenarioIdSchema.parse(bet.batch.scenarioId) : undefined,
    events: parseBatchEvents(bet.batch.events),
    batchCreatedAt: bet.batch.createdAt,
    batchUpdatedAt: bet.batch.updatedAt,
    promotionContext: resolveBetPromotionContext(bet.participations),
    balance: resolveBetBalance(bet.status, bet.profit, bet.risk),
  };
}

function toBetEntity(
  bet: {
    id: string;
    batchId: string;
    bookmakerAccountId: string;
    legRole: string | null;
    legOrder: number;
    selections: Prisma.JsonValue;
    stake: number;
    odds: number;
    commission: number;
    profit: number;
    risk: number;
    yield: number;
    status: string;
    placedAt: Date;
    settledAt: Date | null;
    enhancedOdds: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
    participations: ExistingParticipation[] | BetListParticipation[];
  },
) {
  return BetSchema.parse({
    id: bet.id,
    batchId: bet.batchId,
    bookmakerAccountId: bet.bookmakerAccountId,
    legRole: bet.legRole ?? undefined,
    legOrder: bet.legOrder,
    selections: parseSelections(bet.selections),
    stake: bet.stake,
    odds: bet.odds,
    commission: bet.commission,
    profit: bet.profit,
    risk: bet.risk,
    yield: bet.yield,
    status: BetStatusSchema.parse(bet.status),
    placedAt: bet.placedAt,
    settledAt: bet.settledAt ?? null,
    enhancedOdds: parseEnhancedOdds(bet.enhancedOdds),
    participations: bet.participations.map(toBetParticipationEntity),
    createdAt: bet.createdAt,
    updatedAt: bet.updatedAt,
  });
}

function toBetParticipationEntity(
  participation: ExistingParticipation,
): BetParticipation {
  return BetParticipationSchema.parse({
    id: participation.id,
    batchId: participation.batchId,
    betId: participation.betId,
    kind: participation.kind,
    promotionId: participation.promotionId,
    phaseId: participation.phaseId ?? undefined,
    rewardId: participation.rewardId ?? undefined,
    rewardIds: participation.rewardIds,
    calculationRewardId: participation.calculationRewardId ?? undefined,
    rewardType: participation.rewardType,
    qualifyConditionId: participation.qualifyConditionId ?? undefined,
    usageTrackingId: participation.usageTrackingId ?? undefined,
    contributesToTracking: participation.contributesToTracking,
    stakeAmount: participation.stakeAmount ?? undefined,
    rolloverContribution: participation.rolloverContribution ?? undefined,
    createdAt: participation.createdAt,
    updatedAt: participation.updatedAt,
  });
}

function resolveBetPromotionContext(
  participations: BetListParticipation[],
): BetPromotionContext | undefined {
  const primaryParticipation =
    participations.find((participation) => participation.contributesToTracking) ??
    participations[0];

  if (!primaryParticipation?.promotion) {
    return undefined;
  }

  const reward =
    primaryParticipation.kind === 'QUALIFY_TRACKING'
      ? primaryParticipation.calculationReward
      : primaryParticipation.reward;

  return {
    promotionId: primaryParticipation.promotionId,
    promotionName: primaryParticipation.promotion.name,
    rewardId: reward?.id ?? undefined,
    rewardType: reward?.type ? RewardTypeSchema.parse(reward.type) : undefined,
    phaseId: primaryParticipation.phaseId ?? undefined,
    phaseName: primaryParticipation.phase?.name ?? undefined,
    role:
      primaryParticipation.kind === 'QUALIFY_TRACKING'
        ? 'QUALIFICATION'
        : 'USAGE',
  };
}

function resolveBetBalance(
  status: string,
  profit: number,
  risk: number,
): number | null {
  switch (status) {
    case 'WON':
    case 'CASHOUT':
      return profit;
    case 'LOST':
      return risk;
    case 'VOID':
      return 0;
    default:
      return null;
  }
}

function diffParticipations(
  existing: ExistingParticipation[],
  incoming: PromotionParticipationInput[],
): BetLegUpdateDiff['participationUpdates'] {
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const seenIds = new Set<string>();
  const creates: PromotionParticipationInput[] = [];
  const updates: Array<{ id: string; input: PromotionParticipationInput }> = [];

  for (const participation of incoming) {
    const existingMatch = resolveExistingParticipation(existingById, participation);

    if (!existingMatch) {
      creates.push(participation);
      continue;
    }

    seenIds.add(existingMatch.id);
    updates.push({
      id: existingMatch.id,
      input: participation,
    });
  }

  const deletes = existing
    .filter((participation) => !seenIds.has(participation.id))
    .map((participation) => participation.id);

  return {
    creates,
    updates,
    deletes,
  };
}

function resolveExistingParticipation(
  existingById: ReadonlyMap<string, ExistingParticipation>,
  participation: PromotionParticipationInput,
) {
  if (!isPersistedParticipationKey(participation.participationKey)) {
    return undefined;
  }

  return existingById.get(
    extractPersistedParticipationId(participation.participationKey),
  );
}

function isPersistedParticipationKey(participationKey: string) {
  return participationKey.startsWith(persistedParticipationPrefix);
}

function extractPersistedParticipationId(participationKey: string) {
  return participationKey.slice(persistedParticipationPrefix.length);
}

function toStrategyContext(
  batch: Pick<
    BetBatchWithRelations,
    | 'strategyKind'
    | 'strategyType'
    | 'lineMode'
    | 'mode'
    | 'dutchingOptionsCount'
    | 'hedgeAdjustmentType'
  >,
): StrategyContext {
  if (batch.strategyKind === 'NONE') {
    return { kind: 'NONE' };
  }

  return {
    kind: 'HEDGE',
    strategyType: StrategyTypeSchema.parse(batch.strategyType),
    lineMode: BetLineModeSchema.parse(batch.lineMode),
    mode: HedgeModeSchema.parse(batch.mode),
    dutchingOptionsCount:
      batch.dutchingOptionsCount === 2 || batch.dutchingOptionsCount === 3
        ? batch.dutchingOptionsCount
        : undefined,
    hedgeAdjustmentType: batch.hedgeAdjustmentType
      ? HedgeAdjustmentTypeSchema.parse(batch.hedgeAdjustmentType)
      : undefined,
  };
}

function parseBatchEvents(value: Prisma.JsonValue): BatchEvent[] {
  const rawEvents = Array.isArray(value) ? value : [];

  return rawEvents.map((event) => {
    const rawEvent = isJsonObject(event) ? event : {};
    const eventDate = rawEvent.eventDate;

    return BatchEventSchema.parse({
      ...rawEvent,
      eventDate: typeof eventDate === 'string' ? new Date(eventDate) : eventDate,
    });
  });
}

function parseSelections(value: Prisma.JsonValue) {
  return Array.isArray(value) ? value : [];
}

function parseEnhancedOdds(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const originalOdds = value.originalOdds;
  if (typeof originalOdds !== 'number') {
    return undefined;
  }

  return {
    originalOdds,
  };
}

function isJsonObject(value: Prisma.JsonValue | null): value is Prisma.JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

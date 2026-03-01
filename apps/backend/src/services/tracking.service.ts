import {
  BetConditionsSpecificSchema,
  BonusRolloverUsageConditionsSchema,
  CasinoSpinsUsageConditionsSchema,
  FreeBetTypeSpecificFieldsSchema,
} from '@matbett/shared';
import type { Prisma } from '@prisma/client';

import {
  TrackingRepository,
  type TrackingBetParticipation,
  type TrackingQualifyCondition,
  type TrackingUsageTracking,
} from '@/repositories/tracking.repository';
import { toInputJson } from '@/utils/prisma-json';

type TrackingTargets = {
  qualifyConditionIds: string[];
  usageTrackingIds: string[];
};

type QualifyConditionResolution = {
  successfulBetId?: string;
};

export class TrackingService {
  private readonly repository: TrackingRepository;

  constructor() {
    this.repository = new TrackingRepository();
  }

  async recalculate(
    tx: Prisma.TransactionClient,
    targets: TrackingTargets,
  ): Promise<void> {
    const affectedRewardIds = new Set<string>();

    for (const qualifyConditionId of targets.qualifyConditionIds) {
      const rewardIds = await this.recalculateQualifyCondition(tx, qualifyConditionId);
      for (const rewardId of rewardIds) {
        affectedRewardIds.add(rewardId);
      }
    }

    for (const usageTrackingId of targets.usageTrackingIds) {
      const rewardId = await this.recalculateUsageTracking(tx, usageTrackingId);
      if (rewardId) {
        affectedRewardIds.add(rewardId);
      }
    }

    if (affectedRewardIds.size === 0) {
      return;
    }

    await this.recalculateRewardBalances(tx, [...affectedRewardIds]);
  }

  private async recalculateQualifyCondition(
    tx: Prisma.TransactionClient,
    qualifyConditionId: string,
  ): Promise<string[]> {
    const condition = await this.repository.findQualifyConditionForRecalculation(
      qualifyConditionId,
      tx,
    );

    if (!condition) {
      return [];
    }

    const participations = await this.repository.findQualifyTrackingParticipations(
      qualifyConditionId,
      tx,
    );
    const totals = aggregateBetMetrics(participations.map((participation) => participation.bet));
    const resolution = resolveQualifyConditionResolution(condition, participations);
    const trackingData = buildQualifyTrackingData(
      condition,
      participations,
      totals,
      resolution,
    );

    await this.repository.updateQualifyConditionTracking(
      qualifyConditionId,
      {
        balance: totals.balance,
        trackingData: toInputJson(trackingData),
      },
      tx,
    );

    return condition.rewards.map((reward) => reward.id);
  }

  private async recalculateUsageTracking(
    tx: Prisma.TransactionClient,
    usageTrackingId: string,
  ): Promise<string | null> {
    const usageTracking = await this.repository.findUsageTrackingForRecalculation(
      usageTrackingId,
      tx,
    );

    if (!usageTracking) {
      return null;
    }

    const participations = await this.repository.findUsageTrackingParticipations(
      usageTrackingId,
      tx,
    );

    await this.syncUsageParticipationSnapshots(tx, usageTracking.type, participations);

    const trackedParticipations = participations.filter(
      (participation) => participation.contributesToTracking,
    );
    const totals = aggregateBetMetrics(trackedParticipations.map((participation) => participation.bet));
    const totalUsed = trackedParticipations.reduce(
      (sum, participation) => sum + participation.bet.stake,
      0,
    );
    const usageData = buildUsageTrackingData(
      usageTracking,
      trackedParticipations,
      totals,
      totalUsed,
    );

    await this.repository.updateUsageTracking(
      usageTrackingId,
      {
        balance: totals.balance,
        usageData: toInputJson(usageData),
      },
      tx,
    );

    return usageTracking.rewardId;
  }

  private async syncUsageParticipationSnapshots(
    tx: Prisma.TransactionClient,
    usageTrackingType: string,
    participations: TrackingBetParticipation[],
  ): Promise<void> {
    for (const participation of participations) {
      await this.repository.updateParticipationUsageMetrics(
        participation.id,
        {
          stakeAmount: participation.bet.stake,
          rolloverContribution:
            usageTrackingType === 'BET_BONUS_ROLLOVER' ? participation.bet.stake : 0,
        },
        tx,
      );
    }
  }

  private async recalculateRewardBalances(
    tx: Prisma.TransactionClient,
    rewardIds: string[],
  ): Promise<void> {
    const rewards = await this.repository.findRewardsForBalanceRecalculation(
      rewardIds,
      tx,
    );
    const phaseIds = new Set<string>();
    const promotionIds = new Set<string>();

    for (const reward of rewards) {
      const qualifyBalance = reward.qualifyConditions.reduce(
        (sum, qualifyCondition) => sum + qualifyCondition.balance,
        0,
      );
      const usageBalance = reward.usageTracking?.balance ?? 0;
      const totalBalance = qualifyBalance + usageBalance;

      await this.repository.updateRewardTotalBalance(reward.id, totalBalance, tx);

      phaseIds.add(reward.phaseId);
      promotionIds.add(reward.promotionId);
    }

    await this.recalculatePhaseBalances(tx, [...phaseIds]);
    await this.recalculatePromotionBalances(tx, [...promotionIds]);
  }

  private async recalculatePhaseBalances(
    tx: Prisma.TransactionClient,
    phaseIds: string[],
  ): Promise<void> {
    for (const phaseId of phaseIds) {
      const phaseRewards = await this.repository.findRewardBalancesByPhaseId(phaseId, tx);
      await this.repository.updatePhaseTotalBalance(
        phaseId,
        phaseRewards.reduce((sum, reward) => sum + reward.totalBalance, 0),
        tx,
      );
    }
  }

  private async recalculatePromotionBalances(
    tx: Prisma.TransactionClient,
    promotionIds: string[],
  ): Promise<void> {
    for (const promotionId of promotionIds) {
      const phases = await this.repository.findPhaseBalancesByPromotionId(promotionId, tx);
      await this.repository.updatePromotionTotalBalance(
        promotionId,
        phases.reduce((sum, phase) => sum + phase.totalBalance, 0),
        tx,
      );
    }
  }

}

function buildQualifyTrackingData(
  condition: TrackingQualifyCondition,
  participations: TrackingBetParticipation[],
  totals: ReturnType<typeof aggregateBetMetrics>,
  resolution: QualifyConditionResolution,
): Prisma.JsonObject {
  if (condition.type === 'BET') {
    return {
      type: 'BET',
      currentAttempts: participations.length,
      attemptedBets: participations.map((participation) => toTrackingBetRef(participation.bet)),
      successfulBetId: resolution.successfulBetId,
      ...totals,
    };
  }

  if (condition.type === 'LOSSES_CASHBACK') {
    const totalStakes = participations.reduce(
      (sum, participation) => sum + participation.bet.stake,
      0,
    );
    const totalWinnings = participations.reduce(
      (sum, participation) =>
        sum + (participation.bet.profit > 0 ? participation.bet.profit : 0),
      0,
    );
    const totalLosses = participations.reduce(
      (sum, participation) =>
        sum + (participation.bet.profit < 0 ? Math.abs(participation.bet.profit) : 0),
      0,
    );

    return {
      type: 'LOSSES_CASHBACK',
      qualifyingBets: participations.map((participation) => toTrackingBetRef(participation.bet)),
      totalStakes,
      totalWinnings,
      totalLosses,
      calculatedCashbackAmount: 0,
      appliedMaxLimit: 0,
      ...totals,
    };
  }

  return isJsonObject(condition.trackingData) ? condition.trackingData : {};
}

function resolveQualifyConditionResolution(
  condition: TrackingQualifyCondition,
  participations: TrackingBetParticipation[],
): QualifyConditionResolution {
  if (condition.type !== 'BET') {
    return {};
  }

  const parsedConditions = BetConditionsSpecificSchema.safeParse(condition.conditions);

  if (!parsedConditions.success) {
    return {};
  }

  const betConditions = parsedConditions.data;
  const successfulParticipation = participations.find((participation) =>
    doesBetSatisfyQualifyCondition(participation.bet, betConditions),
  );
  if (successfulParticipation) {
    return {
      successfulBetId: successfulParticipation.bet.id,
    };
  }

  return {};
}

function doesBetSatisfyQualifyCondition(
  bet: TrackingBetParticipation['bet'],
  betConditions: ReturnType<typeof BetConditionsSpecificSchema.parse>,
) {
  if (
    betConditions.oddsRestriction?.minOdds !== undefined &&
    bet.odds < betConditions.oddsRestriction.minOdds
  ) {
    return false;
  }

  if (
    betConditions.oddsRestriction?.maxOdds !== undefined &&
    bet.odds > betConditions.oddsRestriction.maxOdds
  ) {
    return false;
  }

  if (
    'targetStake' in betConditions &&
    betConditions.targetStake !== undefined &&
    bet.stake < betConditions.targetStake
  ) {
    return false;
  }

  if (
    'stakeRestriction' in betConditions &&
    betConditions.stakeRestriction.minStake !== undefined &&
    bet.stake < betConditions.stakeRestriction.minStake
  ) {
    return false;
  }

  if (
    'stakeRestriction' in betConditions &&
    betConditions.stakeRestriction.maxStake !== undefined &&
    bet.stake > betConditions.stakeRestriction.maxStake
  ) {
    return false;
  }

  switch (betConditions.requiredBetOutcome) {
    case 'ANY':
      return true;
    case 'WIN':
      return bet.status === 'WON';
    case 'LOSE':
      return bet.status === 'LOST';
    case 'VOID':
      return bet.status === 'VOID';
    default:
      return false;
  }
}


function isStakeNotReturned(typeSpecificFields: unknown): boolean {
  const parsed = FreeBetTypeSpecificFieldsSchema.safeParse(typeSpecificFields);
  return parsed.success ? parsed.data.stakeNotReturned : true;
}

function getRequiredRollover(usageConditions: unknown, rewardValue: number): number {
  const parsed = BonusRolloverUsageConditionsSchema.safeParse(usageConditions);
  return parsed.success ? (parsed.data.multiplier ?? 1) * rewardValue : rewardValue;
}

function getRemainingSpins(usageConditions: unknown, usedSpins: number): number {
  const parsed = CasinoSpinsUsageConditionsSchema.safeParse(usageConditions);
  const totalSpins = parsed.success ? parsed.data.spinsCount ?? 0 : 0;
  return Math.max(totalSpins - usedSpins, 0);
}

function buildUsageTrackingData(
  usageTracking: TrackingUsageTracking,
  trackedParticipations: TrackingBetParticipation[],
  totals: ReturnType<typeof aggregateBetMetrics>,
  totalUsed: number,
) {
  switch (usageTracking.type) {
    case 'FREEBET': {
      const isSnr = isStakeNotReturned(usageTracking.reward.typeSpecificFields);
      const remainingBalance = Math.max(usageTracking.reward.value - totalUsed, 0);

      return {
        type: 'FREEBET',
        totalUsed,
        remainingBalance,
        ...totals,
        isSnr,
      };
    }
    case 'BET_BONUS_ROLLOVER': {
      const rolloverProgress = trackedParticipations.reduce(
        (sum, participation) =>
          sum + (participation.rolloverContribution ?? participation.bet.stake),
        0,
      );
      const requiredRollover = getRequiredRollover(
        usageTracking.reward.usageConditions,
        usageTracking.reward.value,
      );

      return {
        type: 'BET_BONUS_ROLLOVER',
        totalUsed,
        rolloverProgress,
        remainingRollover: Math.max(requiredRollover - rolloverProgress, 0),
        ...totals,
      };
    }
    case 'BET_BONUS_NO_ROLLOVER':
      return {
        type: 'BET_BONUS_NO_ROLLOVER',
        totalUsed,
        ...totals,
      };
    case 'CASHBACK_FREEBET':
      return {
        type: 'CASHBACK_FREEBET',
        totalCashback: Math.max(totals.balance, 0),
        ...totals,
      };
    case 'ENHANCED_ODDS':
      return {
        type: 'ENHANCED_ODDS',
        oddsUsed: trackedParticipations.length,
        ...totals,
      };
    case 'CASINO_SPINS': {
      const remainingSpins = getRemainingSpins(
        usageTracking.reward.usageConditions,
        trackedParticipations.length,
      );

      return {
        type: 'CASINO_SPINS',
        spinsUsed: trackedParticipations.length,
        remainingSpins,
        ...totals,
      };
    }
    default:
      return {
        ...totals,
      };
  }
}

function isJsonObject(value: Prisma.JsonValue | null): value is Prisma.JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function aggregateBetMetrics(
  bets: Array<{
    profit: number;
    risk: number;
    yield: number;
  }>,
) {
  const totalRisk = bets.reduce((sum, bet) => sum + bet.risk, 0);
  const totalProfit = bets.reduce((sum, bet) => sum + bet.profit, 0);
  const balance = totalProfit + totalRisk;

  return {
    totalRisk,
    totalProfit,
    balance,
    yield: totalRisk === 0 ? 0 : (balance / Math.abs(totalRisk)) * 100,
  };
}

function toTrackingBetRef(
  bet: TrackingBetParticipation['bet'],
): Prisma.JsonObject {
  return {
    betId: bet.id,
    batchId: bet.batchId,
    stake: bet.stake,
    odds: bet.odds,
    profit: bet.profit,
    risk: bet.risk,
    yield: bet.yield,
    status: bet.status,
    legRole: bet.legRole ?? undefined,
    placedAt: bet.placedAt.toISOString(),
  };
}

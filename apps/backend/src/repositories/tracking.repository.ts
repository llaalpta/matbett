import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

const trackingQualifyConditionInclude = {
  rewards: {
    select: {
      id: true,
    },
  },
} satisfies Prisma.RewardQualifyConditionInclude;

const trackingUsageTrackingInclude = {
  reward: {
    select: {
      id: true,
      value: true,
      type: true,
      usageConditions: true,
      typeSpecificFields: true,
      phaseId: true,
      promotionId: true,
    },
  },
} satisfies Prisma.RewardUsageTrackingInclude;

const trackingBetParticipationInclude = {
  bet: {
    select: {
      id: true,
      batchId: true,
      stake: true,
      odds: true,
      profit: true,
      risk: true,
      yield: true,
      status: true,
      legRole: true,
      placedAt: true,
    },
  },
} satisfies Prisma.BetParticipationInclude;

const trackingRewardBalanceInclude = {
  qualifyConditions: {
    select: {
      balance: true,
    },
  },
  usageTracking: {
    select: {
      balance: true,
    },
  },
} satisfies Prisma.RewardInclude;

export type TrackingQualifyCondition = Prisma.RewardQualifyConditionGetPayload<{
  include: typeof trackingQualifyConditionInclude;
}>;

export type TrackingUsageTracking = Prisma.RewardUsageTrackingGetPayload<{
  include: typeof trackingUsageTrackingInclude;
}>;

export type TrackingBetParticipation = Prisma.BetParticipationGetPayload<{
  include: typeof trackingBetParticipationInclude;
}>;

export type TrackingRewardBalance = Prisma.RewardGetPayload<{
  include: typeof trackingRewardBalanceInclude;
}>;

export class TrackingRepository {
  async findQualifyConditionForRecalculation(
    qualifyConditionId: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<TrackingQualifyCondition | null> {
    return tx.rewardQualifyCondition.findUnique({
      where: { id: qualifyConditionId },
      include: trackingQualifyConditionInclude,
    });
  }

  async findQualifyTrackingParticipations(
    qualifyConditionId: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<TrackingBetParticipation[]> {
    return tx.betParticipation.findMany({
      where: {
        kind: 'QUALIFY_TRACKING',
        qualifyConditionId,
        contributesToTracking: true,
      },
      include: trackingBetParticipationInclude,
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async updateQualifyConditionTracking(
    qualifyConditionId: string,
    data: Prisma.RewardQualifyConditionUncheckedUpdateInput,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return tx.rewardQualifyCondition.update({
      where: { id: qualifyConditionId },
      data,
    });
  }

  async findUsageTrackingForRecalculation(
    usageTrackingId: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<TrackingUsageTracking | null> {
    return tx.rewardUsageTracking.findUnique({
      where: { id: usageTrackingId },
      include: trackingUsageTrackingInclude,
    });
  }

  async findUsageTrackingParticipations(
    usageTrackingId: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<TrackingBetParticipation[]> {
    return tx.betParticipation.findMany({
      where: {
        kind: 'REWARD_USAGE',
        usageTrackingId,
      },
      include: trackingBetParticipationInclude,
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async updateParticipationUsageMetrics(
    participationId: string,
    data: Prisma.BetParticipationUncheckedUpdateInput,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return tx.betParticipation.update({
      where: { id: participationId },
      data,
    });
  }

  async updateUsageTracking(
    usageTrackingId: string,
    data: Prisma.RewardUsageTrackingUncheckedUpdateInput,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return tx.rewardUsageTracking.update({
      where: { id: usageTrackingId },
      data,
    });
  }

  async findRewardsForBalanceRecalculation(
    rewardIds: string[],
    tx: Prisma.TransactionClient = prisma,
  ): Promise<TrackingRewardBalance[]> {
    if (rewardIds.length === 0) {
      return [];
    }

    return tx.reward.findMany({
      where: {
        id: {
          in: rewardIds,
        },
      },
      include: trackingRewardBalanceInclude,
    });
  }

  async updateRewardTotalBalance(
    rewardId: string,
    totalBalance: number,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return tx.reward.update({
      where: { id: rewardId },
      data: {
        totalBalance,
      },
    });
  }

  async findRewardBalancesByPhaseId(
    phaseId: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<Array<{ totalBalance: number }>> {
    return tx.reward.findMany({
      where: { phaseId },
      select: {
        totalBalance: true,
      },
    });
  }

  async updatePhaseTotalBalance(
    phaseId: string,
    totalBalance: number,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return tx.phase.update({
      where: { id: phaseId },
      data: {
        totalBalance,
      },
    });
  }

  async findPhaseBalancesByPromotionId(
    promotionId: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<Array<{ totalBalance: number }>> {
    return tx.phase.findMany({
      where: { promotionId },
      select: {
        totalBalance: true,
      },
    });
  }

  async updatePromotionTotalBalance(
    promotionId: string,
    totalBalance: number,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return tx.promotion.update({
      where: { id: promotionId },
      data: {
        totalBalance,
      },
    });
  }
}

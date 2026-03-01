/**
 * Promotion Repository
 *
 * Maneja el acceso a datos de promociones con Prisma.
 * Proporciona metodos CRUD con soporte para paginacion, filtrado y ordenamiento.
 */

import type { Prisma, Promotion } from '@prisma/client';

import { prisma } from '@/lib/prisma';

const promotionQualifyConditionCountSelect = {
  rewards: true,
  depositParticipations: true,
  betParticipations: true,
} satisfies Prisma.RewardQualifyConditionCountOutputTypeSelect;

const promotionAvailableQualifyConditionsInclude = {
  _count: {
    select: promotionQualifyConditionCountSelect,
  },
  rewards: {
    select: {
      id: true,
      type: true,
      status: true,
      phase: {
        select: {
          id: true,
          name: true,
          status: true,
          promotion: {
            select: {
              status: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.RewardQualifyConditionInclude;

const promotionRewardInclude = {
  qualifyConditions: {
    include: promotionAvailableQualifyConditionsInclude,
  },
  usageTracking: true,
} satisfies Prisma.RewardInclude;

const promotionPhasesInclude = {
  orderBy: { createdAt: 'asc' },
  include: {
    rewards: {
      include: promotionRewardInclude,
    },
  },
} satisfies Prisma.PhaseFindManyArgs;

const promotionInclude = {
  bookmakerAccount: true,
  availableQualifyConditions: {
    include: promotionAvailableQualifyConditionsInclude,
  },
  phases: promotionPhasesInclude,
} satisfies Prisma.PromotionInclude;

export type PromotionWithRelations = Prisma.PromotionGetPayload<{
  include: typeof promotionInclude;
}>;

export interface FindManyParams {
  where?: Prisma.PromotionWhereInput;
  orderBy?: Prisma.PromotionOrderByWithRelationInput;
  skip?: number;
  take?: number;
}

export class PromotionRepository {
  async getBetOperationalSummaries(
    promotionIds: string[],
    tx: Prisma.TransactionClient = prisma,
  ): Promise<
    Array<{
      promotionId: string;
      totalLegs: number;
      totalStake: number;
      totalBalance: number;
      aggregateYield: number;
    }>
  > {
    if (promotionIds.length === 0) {
      return [];
    }

    const participations = await tx.betParticipation.findMany({
      where: {
        promotionId: {
          in: promotionIds,
        },
      },
      select: {
        kind: true,
        promotionId: true,
        bet: {
          select: {
            id: true,
            stake: true,
            profit: true,
            risk: true,
            status: true,
          },
        },
      },
    });

    const summaries = new Map<
      string,
      {
        betIds: Set<string>;
        totalStake: number;
        totalBalance: number;
      }
    >();

    const stakeBetIdsByPromotion = new Map<string, Set<string>>();

    for (const participation of participations) {
      const summary =
        summaries.get(participation.promotionId) ??
        {
          betIds: new Set<string>(),
          totalStake: 0,
          totalBalance: 0,
        };
      const stakeBetIds =
        stakeBetIdsByPromotion.get(participation.promotionId) ?? new Set<string>();

      if (!summary.betIds.has(participation.bet.id)) {
        summary.betIds.add(participation.bet.id);
        summary.totalBalance += resolveBetBalanceFromStatus(
          participation.bet.status,
          participation.bet.profit,
          participation.bet.risk,
        );
      }

      if (
        participation.kind === 'QUALIFY_TRACKING' &&
        !stakeBetIds.has(participation.bet.id)
      ) {
        stakeBetIds.add(participation.bet.id);
        summary.totalStake += participation.bet.stake;
      }

      stakeBetIdsByPromotion.set(participation.promotionId, stakeBetIds);
      summaries.set(participation.promotionId, summary);
    }

    return [...summaries.entries()].map(([promotionId, summary]) => ({
      promotionId,
      totalLegs: summary.betIds.size,
      totalStake: summary.totalStake,
      totalBalance: summary.totalBalance,
      aggregateYield:
        summary.totalStake > 0
          ? (summary.totalBalance / summary.totalStake) * 100
          : 0,
    }));
  }

  async getRewardOperationalSummariesByPromotionIds(
    promotionIds: string[],
    tx: Prisma.TransactionClient = prisma,
  ): Promise<
    Array<{
      promotionId: string;
      rewardId: string;
      totalStake: number;
      totalBalance: number;
      aggregateYield: number;
    }>
  > {
    if (promotionIds.length === 0) {
      return [];
    }

    const participations = await tx.betParticipation.findMany({
      where: {
        promotionId: {
          in: promotionIds,
        },
      },
      select: {
        kind: true,
        promotionId: true,
        rewardId: true,
        rewardIds: true,
        calculationRewardId: true,
        bet: {
          select: {
            id: true,
            stake: true,
            profit: true,
            risk: true,
            status: true,
          },
        },
      },
    });

    const summaries = new Map<
      string,
      {
        promotionId: string;
        rewardId: string;
        balanceBetIds: Set<string>;
        stakeBetIds: Set<string>;
        totalStake: number;
        totalBalance: number;
      }
    >();

    for (const participation of participations) {
      const relatedRewardIds =
        participation.kind === 'QUALIFY_TRACKING'
          ? [
              ...new Set(
                [...participation.rewardIds, participation.calculationRewardId].filter(
                  (rewardId): rewardId is string => Boolean(rewardId),
                ),
              ),
            ]
          : participation.rewardId
            ? [participation.rewardId]
            : [];

      for (const rewardId of relatedRewardIds) {
        const summaryKey = `${participation.promotionId}:${rewardId}`;
        const summary =
          summaries.get(summaryKey) ??
          {
            promotionId: participation.promotionId,
            rewardId,
            balanceBetIds: new Set<string>(),
            stakeBetIds: new Set<string>(),
            totalStake: 0,
            totalBalance: 0,
          };

        if (!summary.balanceBetIds.has(participation.bet.id)) {
          summary.balanceBetIds.add(participation.bet.id);
          summary.totalBalance += resolveBetBalanceFromStatus(
            participation.bet.status,
            participation.bet.profit,
            participation.bet.risk,
          );
        }

        if (
          participation.kind === 'QUALIFY_TRACKING' &&
          !summary.stakeBetIds.has(participation.bet.id)
        ) {
          summary.stakeBetIds.add(participation.bet.id);
          summary.totalStake += participation.bet.stake;
        }

        summaries.set(summaryKey, summary);
      }
    }

    return [...summaries.values()].map((summary) => ({
      promotionId: summary.promotionId,
      rewardId: summary.rewardId,
      totalStake: summary.totalStake,
      totalBalance: summary.totalBalance,
      aggregateYield:
        summary.totalStake > 0
          ? (summary.totalBalance / summary.totalStake) * 100
          : 0,
    }));
  }

  async getDepositCountsByPromotionIds(
    promotionIds: string[],
    tx: Prisma.TransactionClient = prisma,
  ): Promise<Array<{ promotionId: string; totalDeposits: number }>> {
    if (promotionIds.length === 0) {
      return [];
    }

    const participations = await tx.depositParticipation.findMany({
      where: {
        promotionId: {
          in: promotionIds,
        },
      },
      select: {
        promotionId: true,
        depositId: true,
      },
    });

    const summaries = new Map<string, Set<string>>();
    for (const participation of participations) {
      const deposits = summaries.get(participation.promotionId) ?? new Set<string>();
      deposits.add(participation.depositId);
      summaries.set(participation.promotionId, deposits);
    }

    return [...summaries.entries()].map(([promotionId, depositIds]) => ({
      promotionId,
      totalDeposits: depositIds.size,
    }));
  }

  async findAvailableQualifyConditionsByPromotionId(
    promotionId: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<PromotionWithRelations['availableQualifyConditions'] | null> {
    const promotion = await tx.promotion.findUnique({
      where: { id: promotionId },
      select: {
        availableQualifyConditions: {
          include: promotionAvailableQualifyConditionsInclude,
        },
      },
    });

    return promotion?.availableQualifyConditions ?? null;
  }

  async findMany(
    params: FindManyParams = {},
    tx: Prisma.TransactionClient = prisma,
  ): Promise<PromotionWithRelations[]> {
    const { where, orderBy, skip, take } = params;

    return tx.promotion.findMany({
      where,
      orderBy,
      skip,
      take,
      include: promotionInclude,
    });
  }

  async count(
    params: { where?: Prisma.PromotionWhereInput } = {},
    tx: Prisma.TransactionClient = prisma,
  ): Promise<number> {
    const { where } = params;

    return tx.promotion.count({ where });
  }

  async findById(
    id: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<PromotionWithRelations | null> {
    return tx.promotion.findUnique({
      where: { id },
      include: promotionInclude,
    });
  }

  async create(
    data: Prisma.PromotionCreateInput,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<PromotionWithRelations> {
    return tx.promotion.create({
      data,
      include: promotionInclude,
    });
  }

  async update(
    id: string,
    data: Prisma.PromotionUpdateInput,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<PromotionWithRelations> {
    return tx.promotion.update({
      where: { id },
      data,
      include: promotionInclude,
    });
  }

  async delete(
    id: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<Promotion> {
    return tx.promotion.delete({
      where: { id },
    });
  }

  async findBookmakerAccountSnapshotForUser(
    userId: string,
    bookmakerAccountId: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<{ id: string; bookmaker: string } | null> {
    return tx.bookmakerAccount.findFirst({
      where: {
        id: bookmakerAccountId,
        userId,
      },
      select: {
        id: true,
        bookmaker: true,
      },
    });
  }
}

function resolveBetBalanceFromStatus(
  status: string,
  profit: number,
  risk: number,
) {
  switch (status) {
    case 'WON':
    case 'CASHOUT':
      return profit;
    case 'LOST':
      return risk;
    case 'VOID':
      return 0;
    default:
      return 0;
  }
}

import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

const betBatchInclude = {
  calculationParticipation: true,
  bets: {
    include: {
      bookmakerAccount: true,
      participations: true,
    },
    orderBy: {
      legOrder: 'asc',
    },
  },
} satisfies Prisma.BetRegistrationBatchInclude;

const betListInclude = {
  bookmakerAccount: true,
  batch: true,
  participations: {
    include: {
      promotion: {
        select: {
          id: true,
          name: true,
        },
      },
      phase: {
        select: {
          id: true,
          name: true,
        },
      },
      reward: {
        select: {
          id: true,
          type: true,
        },
      },
      calculationReward: {
        select: {
          id: true,
          type: true,
        },
      },
    },
  },
} satisfies Prisma.BetInclude;

const betReferenceQualifyConditionInclude = {
  promotion: {
    select: {
      id: true,
      name: true,
      bookmakerAccountId: true,
      status: true,
    },
  },
  rewards: {
    include: {
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

const betReferenceUsageTrackingInclude = {
  reward: {
    include: {
      phase: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      promotion: {
        select: {
          id: true,
          name: true,
          bookmakerAccountId: true,
          status: true,
        },
      },
    },
  },
} satisfies Prisma.RewardUsageTrackingInclude;

const betAvailableRewardUsageTrackingInclude = {
  reward: {
    include: {
      promotion: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      phase: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  },
} satisfies Prisma.RewardUsageTrackingInclude;

const betAvailableQualifyConditionInclude = {
  promotion: {
    select: {
      id: true,
      name: true,
    },
  },
  rewards: {
    include: {
      phase: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.RewardQualifyConditionInclude;

export type BetBatchWithRelations = Prisma.BetRegistrationBatchGetPayload<{
  include: typeof betBatchInclude;
}>;

export type BetWithRelations = Prisma.BetGetPayload<{
  include: typeof betListInclude;
}>;

export type BetReferenceQualifyCondition = Prisma.RewardQualifyConditionGetPayload<{
  include: typeof betReferenceQualifyConditionInclude;
}>;

export type BetReferenceUsageTracking = Prisma.RewardUsageTrackingGetPayload<{
  include: typeof betReferenceUsageTrackingInclude;
}>;

export type BetAvailableRewardUsageTracking = Prisma.RewardUsageTrackingGetPayload<{
  include: typeof betAvailableRewardUsageTrackingInclude;
}>;

export type BetAvailableQualifyCondition = Prisma.RewardQualifyConditionGetPayload<{
  include: typeof betAvailableQualifyConditionInclude;
}>;

export class BetRepository {
  async createBatch(
    data: Prisma.BetRegistrationBatchUncheckedCreateInput,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<BetBatchWithRelations> {
    return tx.betRegistrationBatch.create({
      data,
      include: betBatchInclude,
    });
  }

  async updateBatch(
    id: string,
    data: Prisma.BetRegistrationBatchUncheckedUpdateInput,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<BetBatchWithRelations> {
    return tx.betRegistrationBatch.update({
      where: { id },
      data,
      include: betBatchInclude,
    });
  }

  async deleteBatch(
    id: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<BetBatchWithRelations> {
    return tx.betRegistrationBatch.delete({
      where: { id },
      include: betBatchInclude,
    });
  }

  async findBatchByIdForUser(
    id: string,
    userId: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<BetBatchWithRelations | null> {
    return tx.betRegistrationBatch.findFirst({
      where: {
        id,
        userId,
      },
      include: betBatchInclude,
    });
  }

  async findManyBatchesForUser(
    userId: string,
    params: {
      where?: Prisma.BetRegistrationBatchWhereInput;
      orderBy?: Prisma.BetRegistrationBatchOrderByWithRelationInput;
      skip?: number;
      take?: number;
    } = {},
    tx: Prisma.TransactionClient = prisma,
  ): Promise<BetBatchWithRelations[]> {
    return tx.betRegistrationBatch.findMany({
      where: {
        userId,
        ...(params.where ?? {}),
      },
      include: betBatchInclude,
      orderBy: params.orderBy ?? { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });
  }

  async countBatchesForUser(
    userId: string,
    where: Prisma.BetRegistrationBatchWhereInput = {},
    tx: Prisma.TransactionClient = prisma,
  ): Promise<number> {
    return tx.betRegistrationBatch.count({
      where: {
        userId,
        ...where,
      },
    });
  }

  async createBet(
    data: Prisma.BetUncheckedCreateInput,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<BetWithRelations> {
    return tx.bet.create({
      data,
      include: betListInclude,
    });
  }

  async updateBet(
    id: string,
    data: Prisma.BetUncheckedUpdateInput,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<BetWithRelations> {
    return tx.bet.update({
      where: { id },
      data,
      include: betListInclude,
    });
  }

  async deleteBets(
    ids: string[],
    tx: Prisma.TransactionClient = prisma,
  ): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    const result = await tx.bet.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return result.count;
  }

  async createParticipation(
    data: Prisma.BetParticipationUncheckedCreateInput,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return tx.betParticipation.create({
      data,
    });
  }

  async updateParticipation(
    id: string,
    data: Prisma.BetParticipationUncheckedUpdateInput,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return tx.betParticipation.update({
      where: { id },
      data,
    });
  }

  async deleteParticipations(
    ids: string[],
    tx: Prisma.TransactionClient = prisma,
  ): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    const result = await tx.betParticipation.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return result.count;
  }

  async findManyBetsForUser(
    userId: string,
    params: {
      where?: Prisma.BetWhereInput;
      orderBy?: Prisma.BetOrderByWithRelationInput;
      skip?: number;
      take?: number;
    } = {},
    tx: Prisma.TransactionClient = prisma,
  ): Promise<BetWithRelations[]> {
    return tx.bet.findMany({
      where: {
        userId,
        ...(params.where ?? {}),
      },
      include: betListInclude,
      orderBy: params.orderBy ?? { placedAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });
  }

  async countBetsForUser(
    userId: string,
    where: Prisma.BetWhereInput = {},
    tx: Prisma.TransactionClient = prisma,
  ): Promise<number> {
    return tx.bet.count({
      where: {
        userId,
        ...where,
      },
    });
  }

  async findReferenceBookmakerAccountsForUser(
    userId: string,
    ids: string[],
    tx: Prisma.TransactionClient = prisma,
  ): Promise<Array<{ id: string }>> {
    if (ids.length === 0) {
      return [];
    }

    return tx.bookmakerAccount.findMany({
      where: {
        id: { in: ids },
        userId,
      },
      select: {
        id: true,
      },
    });
  }

  async findReferenceQualifyConditionsForUser(
    userId: string,
    ids: string[],
    tx: Prisma.TransactionClient = prisma,
  ): Promise<BetReferenceQualifyCondition[]> {
    if (ids.length === 0) {
      return [];
    }

    return tx.rewardQualifyCondition.findMany({
      where: {
        id: { in: ids },
        promotion: { userId },
      },
      include: betReferenceQualifyConditionInclude,
    });
  }

  async findReferenceUsageTrackingsForUser(
    userId: string,
    ids: string[],
    tx: Prisma.TransactionClient = prisma,
  ): Promise<BetReferenceUsageTracking[]> {
    if (ids.length === 0) {
      return [];
    }

    return tx.rewardUsageTracking.findMany({
      where: {
        id: { in: ids },
        reward: { promotion: { userId } },
      },
      include: betReferenceUsageTrackingInclude,
    });
  }

  async findBookmakerAccountForUser(
    userId: string,
    bookmakerAccountId: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<{ id: string } | null> {
    return tx.bookmakerAccount.findFirst({
      where: {
        id: bookmakerAccountId,
        userId,
      },
      select: {
        id: true,
      },
    });
  }

  async findAvailableRewardUsageTrackingsForBookmakerAccount(
    userId: string,
    bookmakerAccountId: string,
  ): Promise<BetAvailableRewardUsageTracking[]> {
    return prisma.rewardUsageTracking.findMany({
      where: {
        reward: {
          promotion: {
            userId,
            bookmakerAccountId,
          },
        },
      },
      include: betAvailableRewardUsageTrackingInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAvailableQualifyTrackingConditionsForBookmakerAccount(
    userId: string,
    bookmakerAccountId: string,
  ): Promise<BetAvailableQualifyCondition[]> {
    return prisma.rewardQualifyCondition.findMany({
      where: {
        promotion: {
          userId,
          bookmakerAccountId,
        },
        type: {
          in: ['BET', 'LOSSES_CASHBACK'],
        },
        status: {
          in: ['PENDING', 'QUALIFYING'],
        },
      },
      include: betAvailableQualifyConditionInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getDashboardAggregatesForUser(userId: string) {
    const [totalBatches, betAggregate, byStatus, byBookmaker] =
      await prisma.$transaction([
        prisma.betRegistrationBatch.count({
          where: {
            userId,
          },
        }),
        prisma.bet.aggregate({
          where: {
            userId,
          },
          _count: {
            id: true,
          },
          _sum: {
            profit: true,
            risk: true,
          },
          _avg: {
            yield: true,
          },
        }),
        prisma.bet.groupBy({
          by: ['status'],
          where: {
            userId,
          },
          _count: {
            _all: true,
          },
          orderBy: {
            status: 'asc',
          },
        }),
        prisma.bet.groupBy({
          by: ['bookmakerAccountId'],
          where: {
            userId,
          },
          _count: {
            _all: true,
          },
          orderBy: {
            bookmakerAccountId: 'asc',
          },
        }),
      ]);

    return {
      totalBatches,
      betAggregate,
      byStatus,
      byBookmaker,
    };
  }
}

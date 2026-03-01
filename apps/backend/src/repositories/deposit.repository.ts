import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

const depositInclude = {
  user: true,
  bookmakerAccount: true,
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
    },
  },
} satisfies Prisma.DepositInclude;

const depositQualifyConditionInclude = {
  promotion: {
    select: {
      bookmakerAccountId: true,
    },
  },
  rewards: {
    select: {
      id: true,
      valueType: true,
      phaseId: true,
      promotionId: true,
    },
  },
} satisfies Prisma.RewardQualifyConditionInclude;

export type DepositWithRelations = Prisma.DepositGetPayload<{
  include: typeof depositInclude;
}>;

export type DepositQualifyConditionForSync = Prisma.RewardQualifyConditionGetPayload<{
  include: typeof depositQualifyConditionInclude;
}>;

export class DepositRepository {
  async findMany(
    userId: string,
    options?: {
      where?: Prisma.DepositWhereInput;
      orderBy?: Prisma.DepositOrderByWithRelationInput;
      skip?: number;
      take?: number;
    },
    tx: Prisma.TransactionClient = prisma,
  ): Promise<DepositWithRelations[]> {
    const where: Prisma.DepositWhereInput = {
      userId,
      ...(options?.where ?? {}),
    };

    return tx.deposit.findMany({
      where,
      include: depositInclude,
      orderBy: options?.orderBy ?? { createdAt: 'desc' },
      skip: options?.skip,
      take: options?.take,
    });
  }

  async count(
    userId: string,
    where: Prisma.DepositWhereInput = {},
    tx: Prisma.TransactionClient = prisma,
  ): Promise<number> {
    return tx.deposit.count({
      where: {
        userId,
        ...where,
      },
    });
  }

  async findById(
    id: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<DepositWithRelations | null> {
    return tx.deposit.findUnique({
      where: { id },
      include: depositInclude,
    });
  }

  async create(
    data: Prisma.DepositCreateInput,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<DepositWithRelations> {
    return tx.deposit.create({
      data,
      include: depositInclude,
    });
  }

  async update(
    id: string,
    data: Prisma.DepositUpdateInput,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<DepositWithRelations> {
    return tx.deposit.update({
      where: { id },
      data,
      include: depositInclude,
    });
  }

  async delete(
    id: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<DepositWithRelations> {
    return tx.deposit.delete({
      where: { id },
      include: depositInclude,
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

  async incrementBookmakerRealBalance(
    bookmakerAccountId: string,
    amountDelta: number,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<number> {
    if (amountDelta === 0) {
      return 0;
    }

    const result = await tx.bookmakerAccount.updateMany({
      where: {
        id: bookmakerAccountId,
      },
      data: {
        realBalance: {
          increment: amountDelta,
        },
      },
    });

    return result.count;
  }

  async findContextualParticipationByQualifyCondition(
    qualifyConditionId: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<{ id: string } | null> {
    return tx.depositParticipation.findFirst({
      where: {
        qualifyConditionId,
      },
      select: {
        id: true,
      },
    });
  }

  async findDepositQualifyConditionForSync(
    qualifyConditionId: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<DepositQualifyConditionForSync | null> {
    return tx.rewardQualifyCondition.findUnique({
      where: { id: qualifyConditionId },
      include: depositQualifyConditionInclude,
    });
  }

  async updateQualifyCondition(
    qualifyConditionId: string,
    data: Prisma.RewardQualifyConditionUncheckedUpdateInput,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<void> {
    await tx.rewardQualifyCondition.update({
      where: { id: qualifyConditionId },
      data,
    });
  }

  async updateRewardValue(
    rewardId: string,
    value: number,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<void> {
    await tx.reward.update({
      where: { id: rewardId },
      data: { value },
    });
  }

  async incrementRewardsTotalBalance(
    rewardIds: string[],
    amountDelta: number,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<void> {
    if (rewardIds.length === 0 || amountDelta === 0) {
      return;
    }

    await tx.reward.updateMany({
      where: {
        id: {
          in: rewardIds,
        },
      },
      data: {
        totalBalance: {
          increment: amountDelta,
        },
      },
    });
  }

  async incrementPhasesTotalBalance(
    phaseIds: string[],
    amountDelta: number,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<void> {
    if (phaseIds.length === 0 || amountDelta === 0) {
      return;
    }

    await tx.phase.updateMany({
      where: {
        id: {
          in: phaseIds,
        },
      },
      data: {
        totalBalance: {
          increment: amountDelta,
        },
      },
    });
  }

  async incrementPromotionsTotalBalance(
    promotionIds: string[],
    amountDelta: number,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<void> {
    if (promotionIds.length === 0 || amountDelta === 0) {
      return;
    }

    await tx.promotion.updateMany({
      where: {
        id: {
          in: promotionIds,
        },
      },
      data: {
        totalBalance: {
          increment: amountDelta,
        },
      },
    });
  }
}

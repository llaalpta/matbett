import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export type QualifyConditionWithPromotion = Prisma.RewardQualifyConditionGetPayload<{
  include: {
    _count: {
      select: {
        rewards: true;
        deposits: true;
        bets: true;
      };
    };
    promotion: {
      select: {
        userId: true;
      };
    };
  };
}>;

export class QualifyConditionRepository {
  async findManyForUser(
    userId: string,
    options: {
      where?: Prisma.RewardQualifyConditionWhereInput;
      orderBy?: Prisma.RewardQualifyConditionOrderByWithRelationInput;
      skip?: number;
      take?: number;
    },
    tx: Prisma.TransactionClient = prisma
  ): Promise<QualifyConditionWithPromotion[]> {
    const { where, orderBy, skip, take } = options;

    return tx.rewardQualifyCondition.findMany({
      where: {
        promotion: {
          userId,
        },
        ...where,
      },
      orderBy,
      skip,
      take,
      include: {
        _count: {
          select: {
            rewards: true,
            deposits: true,
            bets: true,
          },
        },
        promotion: {
          select: {
            userId: true,
          },
        },
      },
    });
  }

  async countForUser(
    userId: string,
    where?: Prisma.RewardQualifyConditionWhereInput,
    tx: Prisma.TransactionClient = prisma
  ): Promise<number> {
    return tx.rewardQualifyCondition.count({
      where: {
        promotion: {
          userId,
        },
        ...where,
      },
    });
  }

  async findByIdForUser(id: string, userId: string): Promise<QualifyConditionWithPromotion | null> {
    return prisma.rewardQualifyCondition.findFirst({
      where: {
        id,
        promotion: {
          userId,
        },
      },
      include: {
        _count: {
          select: {
            rewards: true,
            deposits: true,
            bets: true,
          },
        },
        promotion: {
          select: {
            userId: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Prisma.RewardQualifyConditionUpdateInput): Promise<QualifyConditionWithPromotion> {
    return prisma.rewardQualifyCondition.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            rewards: true,
            deposits: true,
            bets: true,
          },
        },
        promotion: {
          select: {
            userId: true,
          },
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.rewardQualifyCondition.delete({
      where: { id },
    });
  }
}

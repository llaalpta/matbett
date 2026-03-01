import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

const qualifyConditionInclude = {
  _count: {
    select: {
      rewards: true,
      depositParticipations: true,
      betParticipations: true,
    },
  },
  promotion: {
    select: {
      userId: true,
      status: true,
      name: true,
    },
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
              phases: {
                select: {
                  id: true,
                },
                orderBy: {
                  createdAt: 'asc',
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.RewardQualifyConditionInclude;

export type QualifyConditionWithPromotion = Prisma.RewardQualifyConditionGetPayload<{
  include: typeof qualifyConditionInclude;
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
    tx: Prisma.TransactionClient = prisma,
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
      include: qualifyConditionInclude,
    });
  }

  async countForUser(
    userId: string,
    where?: Prisma.RewardQualifyConditionWhereInput,
    tx: Prisma.TransactionClient = prisma,
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

  async findByIdForUser(
    id: string,
    userId: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<QualifyConditionWithPromotion | null> {
    return tx.rewardQualifyCondition.findFirst({
      where: {
        id,
        promotion: {
          userId,
        },
      },
      include: qualifyConditionInclude,
    });
  }

  async update(
    id: string,
    data: Prisma.RewardQualifyConditionUpdateInput,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<QualifyConditionWithPromotion> {
    return tx.rewardQualifyCondition.update({
      where: { id },
      data,
      include: qualifyConditionInclude,
    });
  }

  async create(
    data: Prisma.RewardQualifyConditionCreateInput,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<QualifyConditionWithPromotion> {
    return tx.rewardQualifyCondition.create({
      data,
      include: qualifyConditionInclude,
    });
  }

  async delete(
    id: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<void> {
    await tx.rewardQualifyCondition.delete({
      where: { id },
    });
  }
}

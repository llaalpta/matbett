import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const rewardInclude = {
  qualifyConditions: {
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      _count: {
        select: {
          rewards: true,
          depositParticipations: true,
          betParticipations: true,
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
                },
              },
            },
          },
        },
      },
    },
  },
  usageTracking: true,
  phase: {
    select: {
      id: true,
      name: true,
      promotionId: true,
      status: true,
      promotion: {
        select: {
          userId: true,
          status: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.RewardInclude;

export type RewardWithRelations = Prisma.RewardGetPayload<{
  include: typeof rewardInclude;
}>;

export type RewardPhaseContext = Prisma.PhaseGetPayload<{
  select: {
    id: true;
    status: true;
    promotionId: true;
    promotion: {
      select: {
        id: true;
        status: true;
        userId: true;
      };
    };
  };
}>;

export type RewardQualifyConditionForUpdate = Prisma.RewardQualifyConditionGetPayload<{
  include: {
    _count: {
      select: {
        rewards: true;
        depositParticipations: true;
        betParticipations: true;
      };
    };
    rewards: {
      include: {
        phase: {
          select: {
            id: true;
            name: true;
            status: true;
            promotion: {
              select: {
                status: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export class RewardRepository {
  async findManyForUser(
    userId: string,
    options: {
      where?: Prisma.RewardWhereInput;
      orderBy?: Prisma.RewardOrderByWithRelationInput;
      skip?: number;
      take?: number;
    },
    tx: Prisma.TransactionClient = prisma,
  ): Promise<RewardWithRelations[]> {
    const { where, orderBy, skip, take } = options;

    return tx.reward.findMany({
      where: {
        promotion: {
          userId,
        },
        ...where,
      },
      orderBy,
      skip,
      take,
      include: rewardInclude,
    });
  }

  async countForUser(
    userId: string,
    where?: Prisma.RewardWhereInput,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<number> {
    return tx.reward.count({
      where: {
        promotion: {
          userId,
        },
        ...where,
      },
    });
  }

  async findPromotionIdByPhaseId(
    phaseId: string,
    tx: Prisma.TransactionClient = prisma
  ): Promise<string | null> {
    const phase = await tx.phase.findUnique({
      where: { id: phaseId },
      select: { promotionId: true },
    });
    return phase?.promotionId ?? null;
  }

  async findPhaseContextForUser(
    userId: string,
    phaseId: string,
    promotionId: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<RewardPhaseContext | null> {
    return tx.phase.findFirst({
      where: {
        id: phaseId,
        promotionId,
        promotion: {
          userId,
        },
      },
      select: {
        id: true,
        status: true,
        promotionId: true,
        promotion: {
          select: {
            id: true,
            status: true,
            userId: true,
          },
        },
      },
    });
  }

  async findById(id: string, tx: Prisma.TransactionClient = prisma): Promise<RewardWithRelations | null> {
    return tx.reward.findUnique({
      where: { id },
      include: rewardInclude,
    });
  }

  async findByIdForUser(
    userId: string,
    id: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<RewardWithRelations | null> {
    return tx.reward.findFirst({
      where: {
        id,
        promotion: {
          userId,
        },
      },
      include: rewardInclude,
    });
  }

  async create(data: Prisma.RewardCreateInput, tx: Prisma.TransactionClient = prisma): Promise<RewardWithRelations> {
    return tx.reward.create({
      data,
      include: rewardInclude,
    });
  }

  async update(id: string, data: Prisma.RewardUpdateInput, tx: Prisma.TransactionClient = prisma): Promise<RewardWithRelations> {
    return tx.reward.update({
      where: { id },
      data,
      include: rewardInclude,
    });
  }

  async createUsageTracking(
    data: Prisma.RewardUsageTrackingUncheckedCreateInput,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<void> {
    await tx.rewardUsageTracking.create({
      data,
    });
  }

  async delete(id: string, tx: Prisma.TransactionClient = prisma): Promise<void> {
    await tx.reward.delete({
      where: { id },
    });
  }

  async findQualifyConditionSummary(
    id: string,
    tx: Prisma.TransactionClient = prisma
  ): Promise<RewardQualifyConditionForUpdate | null> {
    return tx.rewardQualifyCondition.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            rewards: true,
            depositParticipations: true,
            betParticipations: true,
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
      },
    });
  }

  async updateQualifyCondition(
    id: string,
    data: Prisma.RewardQualifyConditionUpdateInput,
    tx: Prisma.TransactionClient = prisma
  ): Promise<void> {
    await tx.rewardQualifyCondition.update({
      where: { id },
      data,
    });
  }

  async createQualifyCondition(
    data: Prisma.RewardQualifyConditionCreateInput,
    tx: Prisma.TransactionClient = prisma
  ): Promise<void> {
    await tx.rewardQualifyCondition.create({
      data,
    });
  }

  async findOrphanQualifyConditionIds(
    promotionId: string,
    tx: Prisma.TransactionClient = prisma
  ): Promise<string[]> {
    const orphanConditions = await tx.rewardQualifyCondition.findMany({
      where: {
        promotionId,
        rewards: { none: {} },
      },
      select: { id: true },
    });

    return orphanConditions.map((condition) => condition.id);
  }

  async deleteOrphanQualifyConditions(
    promotionId: string,
    ids: string[],
    tx: Prisma.TransactionClient = prisma
  ): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await tx.rewardQualifyCondition.deleteMany({
      where: {
        promotionId,
        id: { in: ids },
        rewards: { none: {} },
      },
    });
  }
}

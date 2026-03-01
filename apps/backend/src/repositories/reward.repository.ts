import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { Reward as PrismaReward, RewardQualifyCondition as PrismaRewardQualifyCondition, Phase as PrismaPhase } from '@prisma/client';

export type RewardWithRelations = PrismaReward & {
  qualifyConditions: Array<
    PrismaRewardQualifyCondition & {
      _count: {
        rewards: number;
        deposits: number;
        bets: number;
      };
    }
  >;
  phase: Pick<PrismaPhase, 'promotionId'>; // Incluir phase para obtener promotionId
};

export class RewardRepository {
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

  async findById(id: string, tx: Prisma.TransactionClient = prisma): Promise<RewardWithRelations | null> {
    return tx.reward.findUnique({
      where: { id },
      include: {
        qualifyConditions: {
          include: {
            _count: {
              select: {
                rewards: true,
                deposits: true,
                bets: true,
              },
            },
          },
        }, // Incluir condiciones para el transformer
        phase: {
          select: { promotionId: true }, // Incluir promotionId de la phase
        },
      },
    });
  }

  async create(data: Prisma.RewardCreateInput, tx: Prisma.TransactionClient = prisma): Promise<RewardWithRelations> {
    return tx.reward.create({
      data,
      include: {
        qualifyConditions: {
          include: {
            _count: {
              select: {
                rewards: true,
                deposits: true,
                bets: true,
              },
            },
          },
        },
        phase: {
          select: { promotionId: true },
        },
      },
    });
  }

  async update(id: string, data: Prisma.RewardUpdateInput, tx: Prisma.TransactionClient = prisma): Promise<RewardWithRelations> {
    return tx.reward.update({
      where: { id },
      data,
      include: {
        qualifyConditions: {
          include: {
            _count: {
              select: {
                rewards: true,
                deposits: true,
                bets: true,
              },
            },
          },
        },
        phase: {
          select: { promotionId: true },
        },
      },
    });
  }

  async delete(id: string, tx: Prisma.TransactionClient = prisma): Promise<void> {
    await tx.reward.delete({
      where: { id },
    });
  }
}

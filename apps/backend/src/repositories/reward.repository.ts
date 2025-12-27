import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { Reward as PrismaReward, RewardQualifyCondition as PrismaRewardQualifyCondition, Phase as PrismaPhase } from '@prisma/client';

export type RewardWithRelations = PrismaReward & {
  qualifyConditions: PrismaRewardQualifyCondition[];
  phase: Pick<PrismaPhase, 'promotionId'>; // Incluir phase para obtener promotionId
};

export class RewardRepository {
  async findById(id: string, tx: Prisma.TransactionClient = prisma): Promise<RewardWithRelations | null> {
    return tx.reward.findUnique({
      where: { id },
      include: {
        qualifyConditions: true, // Incluir condiciones para el transformer
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
        qualifyConditions: true,
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
        qualifyConditions: true,
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

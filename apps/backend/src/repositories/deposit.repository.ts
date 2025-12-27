import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type DepositWithRelations = Prisma.DepositGetPayload<{
  include: {
    user: true;
    qualifyCondition: true;
  };
}>;

export class DepositRepository {
  /**
   * Finds many deposits with flexible options for pagination and filtering.
   */
  async findMany(
    userId: string,
    options?: {
      where?: Prisma.DepositWhereInput;
      orderBy?: Prisma.DepositOrderByWithRelationInput;
      skip?: number;
      take?: number;
    },
    tx: Prisma.TransactionClient = prisma
  ): Promise<DepositWithRelations[]> {
    const where: Prisma.DepositWhereInput = {
      userId,
      ...(options?.where || {}),
    };

    return tx.deposit.findMany({
      where,
      include: {
        user: true,
        qualifyCondition: true,
      },
      orderBy: options?.orderBy || { createdAt: 'desc' },
      skip: options?.skip,
      take: options?.take,
    });
  }

  /**
   * Finds a deposit by its ID.
   */
  async findById(id: string, tx: Prisma.TransactionClient = prisma): Promise<DepositWithRelations | null> {
    return tx.deposit.findUnique({
      where: { id },
      include: {
        user: true,
        qualifyCondition: true,
      },
    });
  }

  /**
   * Creates a new deposit.
   */
  async create(data: Prisma.DepositCreateInput, tx: Prisma.TransactionClient = prisma): Promise<DepositWithRelations> {
    return tx.deposit.create({
      data,
      include: {
        user: true,
        qualifyCondition: true,
      },
    });
  }

  /**
   * Updates an existing deposit.
   */
  async update(id: string, data: Prisma.DepositUpdateInput, tx: Prisma.TransactionClient = prisma): Promise<DepositWithRelations> {
    return tx.deposit.update({
      where: { id },
      data,
      include: {
        user: true,
        qualifyCondition: true,
      },
    });
  }

  /**
   * Deletes a deposit.
   */
  async delete(id: string, tx: Prisma.TransactionClient = prisma): Promise<DepositWithRelations> {
    return tx.deposit.delete({
      where: { id },
      include: {
        user: true,
        qualifyCondition: true,
      },
    });
  }
}

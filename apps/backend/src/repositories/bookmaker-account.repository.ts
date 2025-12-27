/**
 * Bookmaker Account Repository
 * Handles data access for bookmaker accounts using Prisma
 */

import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export class BookmakerAccountRepository {
  /**
   * Lists all bookmaker accounts for a given user with pagination options
   */
  async findMany(
    userId: string,
    options?: {
      where?: Prisma.BookmakerAccountWhereInput;
      orderBy?: Prisma.BookmakerAccountOrderByWithRelationInput;
      skip?: number;
      take?: number;
    },
    tx: Prisma.TransactionClient = prisma
  ) {
    const where: Prisma.BookmakerAccountWhereInput = {
      userId,
      ...(options?.where || {}),
    };

    return tx.bookmakerAccount.findMany({
      where,
      orderBy: options?.orderBy || { bookmaker: 'asc' },
      skip: options?.skip,
      take: options?.take,
    });
  }

  /**
   * Counts bookmaker accounts for pagination metadata
   */
  async count(
    userId: string,
    options?: {
      where?: Prisma.BookmakerAccountWhereInput;
    },
    tx: Prisma.TransactionClient = prisma
  ) {
    const where: Prisma.BookmakerAccountWhereInput = {
      userId,
      ...(options?.where || {}),
    };

    return tx.bookmakerAccount.count({ where });
  }

  /**
   * Finds a single bookmaker account by its ID
   */
  async findById(id: string) {
    return prisma.bookmakerAccount.findUnique({
      where: { id },
    });
  }

  /**
   * Finds a bookmaker account by user and bookmaker name
   */
  async findByUserAndBookmaker(userId: string, bookmaker: string) {
    return prisma.bookmakerAccount.findUnique({
      where: {
        userId_bookmaker: {
          userId,
          bookmaker,
        },
      },
    });
  }

  /**
   * Creates a new bookmaker account
   */
  async create(data: Prisma.BookmakerAccountCreateInput) {
    return prisma.bookmakerAccount.create({
      data,
    });
  }

  /**
   * Updates a bookmaker account
   */
  async update(id: string, data: Prisma.BookmakerAccountUpdateInput) {
    return prisma.bookmakerAccount.update({
      where: { id },
      data,
    });
  }

  /**
   * Deletes a bookmaker account
   */
  async delete(id: string) {
    return prisma.bookmakerAccount.delete({
      where: { id },
    });
  }
}

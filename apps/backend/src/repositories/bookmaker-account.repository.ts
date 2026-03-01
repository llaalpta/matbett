/**
 * Bookmaker Account Repository
 * Handles data access for bookmaker accounts using Prisma
 */

import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export class BookmakerAccountRepository {
  async findMany(
    userId: string,
    options?: {
      where?: Prisma.BookmakerAccountWhereInput;
      orderBy?: Prisma.BookmakerAccountOrderByWithRelationInput;
      skip?: number;
      take?: number;
    },
    tx: Prisma.TransactionClient = prisma,
  ) {
    const where: Prisma.BookmakerAccountWhereInput = {
      userId,
      ...(options?.where ?? {}),
    };

    return tx.bookmakerAccount.findMany({
      where,
      orderBy: options?.orderBy ?? { bookmaker: 'asc' },
      skip: options?.skip,
      take: options?.take,
    });
  }

  async count(
    userId: string,
    options?: {
      where?: Prisma.BookmakerAccountWhereInput;
    },
    tx: Prisma.TransactionClient = prisma,
  ) {
    const where: Prisma.BookmakerAccountWhereInput = {
      userId,
      ...(options?.where ?? {}),
    };

    return tx.bookmakerAccount.count({ where });
  }

  async findById(
    id: string,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return tx.bookmakerAccount.findUnique({
      where: { id },
    });
  }

  async findByUserBookmakerAndIdentifier(
    userId: string,
    bookmaker: string,
    accountIdentifier: string,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return tx.bookmakerAccount.findFirst({
      where: {
        userId,
        bookmaker,
        accountIdentifier,
      },
    });
  }

  async create(
    data: Prisma.BookmakerAccountCreateInput,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return tx.bookmakerAccount.create({
      data,
    });
  }

  async update(
    id: string,
    data: Prisma.BookmakerAccountUpdateInput,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return tx.bookmakerAccount.update({
      where: { id },
      data,
    });
  }

  async delete(
    id: string,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return tx.bookmakerAccount.delete({
      where: { id },
    });
  }
}

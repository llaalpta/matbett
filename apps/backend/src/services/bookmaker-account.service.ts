import { 
  type BookmakerAccount, 
  type BookmakerAccountEntity, 
  BookmakerAccountSchema,
  type BookmakerAccountListInput,
  type PaginatedResponse 
} from '@matbett/shared';
import { AppError, BadRequestError } from '@/utils/errors';
import type { IBookmakerAccountService } from '@matbett/api';

import { BookmakerAccountRepository } from '@/repositories/bookmaker-account.repository';
import { 
  toBookmakerAccountCreateInput, 
  toBookmakerAccountUpdateInput, 
  toBookmakerAccountEntity 
} from '@/lib/transformers/bookmaker-account.transformer';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

/**
 * Service for managing Bookmaker Accounts
 */
export class BookmakerAccountService implements IBookmakerAccountService {
  private repository: BookmakerAccountRepository;

  constructor() {
    this.repository = new BookmakerAccountRepository();
  }

  /**
   * Lists bookmaker accounts for a user with pagination
   */
  async list(userId: string, input: BookmakerAccountListInput): Promise<PaginatedResponse<BookmakerAccountEntity>> {
    const { pageIndex, pageSize, sorting } = input;

    // Default sorting by bookmaker name asc
    let orderBy: Prisma.BookmakerAccountOrderByWithRelationInput = { bookmaker: 'asc' };
    
    if (sorting && sorting.length > 0 && sorting[0]) {
      const { id, desc } = sorting[0];
      const direction = desc ? 'desc' : 'asc';
      // Allow sorting by valid fields
      if (['bookmaker', 'realBalance', 'bonusBalance', 'freebetBalance', 'updatedAt'].includes(id)) {
        orderBy = { [id]: direction };
      }
    }

    const [accounts, total] = await prisma.$transaction(async (tx) => {
      const dataPromise = this.repository.findMany(
        userId,
        {
          orderBy,
          skip: pageIndex * pageSize,
          take: pageSize,
        },
        tx
      );

      const countPromise = this.repository.count(userId, {}, tx);

      return Promise.all([dataPromise, countPromise]);
    });

    const accountEntities = accounts.map(toBookmakerAccountEntity);
    const pageCount = Math.ceil(total / pageSize);

    return {
      data: accountEntities,
      meta: {
        pageCount,
        rowCount: total,
        pageIndex,
        pageSize,
      },
    };
  }

  /**
   * Gets a single bookmaker account by ID
   */
  async getById(id: string): Promise<BookmakerAccountEntity> {
    const account = await this.repository.findById(id);

    if (!account) {
      throw new AppError('Bookmaker account not found', 404);
    }

    return toBookmakerAccountEntity(account);
  }

  /**
   * Creates a new bookmaker account
   */
  async create(data: BookmakerAccount, userId: string): Promise<BookmakerAccountEntity> {
    // Validate that the user doesn't already have an account for this bookmaker
    const existing = await this.repository.findByUserAndBookmaker(userId, data.bookmaker);
    
    if (existing) {
      throw new BadRequestError(`Account for ${data.bookmaker} already exists for this user.`);
    }

    const prismaData = toBookmakerAccountCreateInput(data, userId);
    const newAccount = await this.repository.create(prismaData);

    return toBookmakerAccountEntity(newAccount);
  }

  /**
   * Updates an existing bookmaker account
   */
  async update(id: string, data: Partial<BookmakerAccount>): Promise<BookmakerAccountEntity> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new AppError('Bookmaker account not found', 404);
    }

    // Validate with partial Zod schema
    const validatedData = BookmakerAccountSchema.partial().parse(data);

    // Transform to Prisma format
    const prismaData = toBookmakerAccountUpdateInput(validatedData);

    // Update in DB
    const updated = await this.repository.update(id, prismaData);

    return toBookmakerAccountEntity(updated);
  }

  /**
   * Deletes a bookmaker account
   */
  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new AppError('Bookmaker account not found', 404);
    }

    await this.repository.delete(id);
  }
}

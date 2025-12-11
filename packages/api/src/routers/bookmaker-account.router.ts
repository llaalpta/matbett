/**
 * Bookmaker Account tRPC Router
 * Defines procedures for CRUD operations on bookmaker accounts
 */

import { z } from 'zod';
import { 
  BookmakerAccountSchema, 
  BookmakerAccountEntitySchema, 
  UpdateBookmakerAccountInputSchema,
  BookmakerAccountListInputSchema,
  createPaginatedResponseSchema 
} from '@matbett/shared';

import { publicProcedure, router } from '../trpc';

/**
 * tRPC router for bookmaker accounts with typed procedures
 */
export const bookmakerAccountRouter = router({
  /**
   * Get all bookmaker accounts for the user with pagination
   */
  list: publicProcedure
    .input(BookmakerAccountListInputSchema)
    .output(createPaginatedResponseSchema(BookmakerAccountEntitySchema))
    .query(async ({ ctx, input }) => {
      const result = await ctx.bookmakerAccountService.list(ctx.userId, input);
      return result;
    }),

  /**
   * Get a single bookmaker account by its ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(BookmakerAccountEntitySchema.nullable())
    .query(async ({ ctx, input }) => {
      const account = await ctx.bookmakerAccountService.getById(input.id);
      return account;
    }),

  /**
   * Create a new bookmaker account
   */
  create: publicProcedure
    .input(BookmakerAccountSchema)
    .output(BookmakerAccountEntitySchema)
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.bookmakerAccountService.create(input, ctx.userId);
      return account;
    }),

  /**
   * Update an existing bookmaker account
   */
  update: publicProcedure
    .input(UpdateBookmakerAccountInputSchema)
    .output(BookmakerAccountEntitySchema)
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.bookmakerAccountService.update(input.id, input.data);
      return account;
    }),

  /**
   * Delete a bookmaker account
   */
  delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.bookmakerAccountService.delete(input.id);
    return { success: true };
  }),
});

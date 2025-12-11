/**
 * Deposit tRPC Router
 * Defines procedures for CRUD operations on deposits
 */

import { z } from 'zod';
import { 
  DepositSchema, 
  DepositEntitySchema, 
  UpdateDepositInputSchema,
  DepositListInputSchema,
  createPaginatedResponseSchema 
} from '@matbett/shared';

import { publicProcedure, router } from '../trpc';

/**
 * tRPC router for deposits with typed procedures
 */
export const depositRouter = router({
  /**
   * Get all deposits for the user with pagination
   */
  list: publicProcedure
    .input(DepositListInputSchema)
    .output(createPaginatedResponseSchema(DepositEntitySchema))
    .query(async ({ ctx, input }) => {
      const result = await ctx.depositService.list(ctx.userId, input);
      return result;
    }),

  /**
   * Get a single deposit by its ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(DepositEntitySchema.nullable())
    .query(async ({ ctx, input }) => {
      const deposit = await ctx.depositService.getById(input.id);
      return deposit;
    }),

  /**
   * Create a new deposit
   */
  create: publicProcedure
    .input(DepositSchema)
    .output(DepositEntitySchema)
    .mutation(async ({ ctx, input }) => {
      const deposit = await ctx.depositService.create(input, ctx.userId);
      return deposit;
    }),

  /**
   * Update an existing deposit
   */
  update: publicProcedure
    .input(UpdateDepositInputSchema)
    .output(DepositEntitySchema)
    .mutation(async ({ ctx, input }) => {
      const deposit = await ctx.depositService.update(input.id, input.data);
      return deposit;
    }),

  /**
   * Delete a deposit
   */
  delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.depositService.delete(input.id);
    return { success: true };
  }),
});

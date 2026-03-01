import { z } from 'zod';
import {
  AvailablePromotionContextsSchema,
  BetBatchListInputSchema,
  BetDashboardTotalsSchema,
  BetListInputSchema,
  BetRegistrationBatchSchema,
  DeleteBetBatchResultSchema,
  PaginatedBetBatchResponseSchema,
  PaginatedBetListResponseSchema,
  RegisterBetsBatchSchema,
  UpdateBetsBatchSchema,
} from '@matbett/shared';

import { publicProcedure, router } from '../trpc';

const BetScopedListInputSchema = z.object({
  id: z.string(),
  filters: BetListInputSchema.optional(),
});

export const betRouter = router({
  registerBetsBatch: publicProcedure
    .input(RegisterBetsBatchSchema)
    .output(BetRegistrationBatchSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.betService.registerBetsBatch(ctx.userId, input);
    }),

  updateBatch: publicProcedure
    .input(z.object({ id: z.string(), data: UpdateBetsBatchSchema }))
    .output(BetRegistrationBatchSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.betService.updateBatch(ctx.userId, input.id, input.data);
    }),

  deleteBatch: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(DeleteBetBatchResultSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.betService.deleteBatch(ctx.userId, input.id);
    }),

  getBatch: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(BetRegistrationBatchSchema.nullable())
    .query(async ({ ctx, input }) => {
      return ctx.betService.getBatch(ctx.userId, input.id);
    }),

  listBatches: publicProcedure
    .input(BetBatchListInputSchema)
    .output(PaginatedBetBatchResponseSchema)
    .query(async ({ ctx, input }) => {
      return ctx.betService.listBatches(ctx.userId, input);
    }),

  listBets: publicProcedure
    .input(BetListInputSchema)
    .output(PaginatedBetListResponseSchema)
    .query(async ({ ctx, input }) => {
      return ctx.betService.listBets(ctx.userId, input);
    }),

  listBetsByPromotion: publicProcedure
    .input(BetScopedListInputSchema)
    .output(PaginatedBetListResponseSchema)
    .query(async ({ ctx, input }) => {
      return ctx.betService.listBetsByPromotion(
        ctx.userId,
        input.id,
        input.filters ?? BetListInputSchema.parse({}),
      );
    }),

  listBetsByQC: publicProcedure
    .input(BetScopedListInputSchema)
    .output(PaginatedBetListResponseSchema)
    .query(async ({ ctx, input }) => {
      return ctx.betService.listBetsByQualifyCondition(
        ctx.userId,
        input.id,
        input.filters ?? BetListInputSchema.parse({}),
      );
    }),

  listBetsByUsageTracking: publicProcedure
    .input(BetScopedListInputSchema)
    .output(PaginatedBetListResponseSchema)
    .query(async ({ ctx, input }) => {
      return ctx.betService.listBetsByUsageTracking(
        ctx.userId,
        input.id,
        input.filters ?? BetListInputSchema.parse({}),
      );
    }),

  getAvailablePromotionContexts: publicProcedure
    .input(z.object({ bookmakerAccountId: z.string() }))
    .output(AvailablePromotionContextsSchema)
    .query(async ({ ctx, input }) => {
      return ctx.betService.getAvailablePromotionContexts(ctx.userId, input.bookmakerAccountId);
    }),

  getDashboardTotals: publicProcedure
    .input(z.void())
    .output(BetDashboardTotalsSchema)
    .query(async ({ ctx }) => {
      return ctx.betService.getDashboardTotals(ctx.userId);
    }),
});

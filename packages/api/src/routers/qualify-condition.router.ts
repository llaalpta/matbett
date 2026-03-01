import { z } from 'zod';
import {
  CreateQualifyConditionForRewardInputSchema,
  QualifyConditionListInputSchema,
  createPaginatedResponseSchema,
  QualifyConditionEntitySchema,
  QualifyConditionSchema,
} from '@matbett/shared';

import { publicProcedure, router } from '../trpc';

export const qualifyConditionRouter = router({
  list: publicProcedure
    .input(QualifyConditionListInputSchema)
    .output(createPaginatedResponseSchema(QualifyConditionEntitySchema))
    .query(async ({ ctx, input }) => {
      return ctx.qualifyConditionService.list(ctx.userId, input);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(QualifyConditionEntitySchema.nullable())
    .query(async ({ ctx, input }) => {
      return ctx.qualifyConditionService.getById(input.id, ctx.userId);
    }),

  createForReward: publicProcedure
    .input(CreateQualifyConditionForRewardInputSchema)
    .output(QualifyConditionEntitySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.qualifyConditionService.createForReward(
        ctx.userId,
        input.rewardId,
        input.data,
      );
    }),

  update: publicProcedure
    .input(z.object({ id: z.string(), data: QualifyConditionSchema }))
    .output(QualifyConditionEntitySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.qualifyConditionService.update(input.id, input.data, ctx.userId);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.qualifyConditionService.delete(input.id, ctx.userId);
      return { success: true };
    }),
});

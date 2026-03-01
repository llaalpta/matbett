import { z } from 'zod';
import {
  PromotionSchema,
  PromotionEntitySchema,
  PromotionListInputSchema,
  UpdatePromotionInputSchema,
  createPaginatedResponseSchema,
  AnchorCatalogSchema,
  AnchorOccurrencesSchema,
  QualifyConditionEntitySchema,
} from '@matbett/shared';

import { publicProcedure, router } from '../trpc';

export const promotionRouter = router({
  list: publicProcedure
    .input(PromotionListInputSchema)
    .output(createPaginatedResponseSchema(PromotionEntitySchema))
    .query(async ({ ctx, input }) => {
      return ctx.promotionService.list(ctx.userId, input);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(PromotionEntitySchema.nullable())
    .query(async ({ ctx, input }) => {
      return ctx.promotionService.getById(input.id);
    }),

  create: publicProcedure
    .input(PromotionSchema)
    .output(PromotionEntitySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.promotionService.create(input, ctx.userId);
    }),

  update: publicProcedure
    .input(UpdatePromotionInputSchema)
    .output(PromotionEntitySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.promotionService.update(input.id, input.data);
    }),

  delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.promotionService.delete(input.id);
    return { success: true };
  }),

  getAnchorCatalog: publicProcedure
    .input(z.object({ promotionId: z.string() }))
    .output(AnchorCatalogSchema)
    .query(async ({ ctx, input }) => {
      return ctx.promotionService.getAnchorCatalog(input.promotionId);
    }),

  getAnchorOccurrences: publicProcedure
    .input(z.object({ promotionId: z.string() }))
    .output(AnchorOccurrencesSchema)
    .query(async ({ ctx, input }) => {
      return ctx.promotionService.getAnchorOccurrences(input.promotionId);
    }),

  getAvailableQualifyConditions: publicProcedure
    .input(z.object({ promotionId: z.string() }))
    .output(z.array(QualifyConditionEntitySchema))
    .query(async ({ ctx, input }) => {
      return ctx.promotionService.getAvailableQualifyConditions(input.promotionId);
    }),
});

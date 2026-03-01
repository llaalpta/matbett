/**
 * Reward tRPC Router
 * Define procedures para operaciones CRUD de recompensas
 */

import { z } from 'zod';
import {
  createPaginatedResponseSchema,
  CreateRewardInputSchema,
  RewardEntitySchema,
  RewardListInputSchema,
  RewardRelatedTrackingSchema,
  UpdateRewardInputSchema,
} from '@matbett/shared';

import { publicProcedure, router } from '../trpc';

/**
 * Router de recompensas con procedures tipados
 */
export const rewardRouter = router({
  /**
   * Listar recompensas persistidas
   */
  list: publicProcedure
    .input(RewardListInputSchema)
    .output(createPaginatedResponseSchema(RewardEntitySchema))
    .query(async ({ ctx, input }) => {
      return ctx.rewardService.list(ctx.userId, input);
    }),

  /**
   * Obtener una recompensa por ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(RewardEntitySchema.nullable())
    .query(async ({ ctx, input }) => {
      // Asumimos que el rewardService tiene un getById
      const reward = await ctx.rewardService.getById(input.id);
      return reward;
    }),

  getRelatedTracking: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(RewardRelatedTrackingSchema)
    .query(async ({ ctx, input }) => {
      return ctx.rewardService.getRelatedTracking(ctx.userId, input.id);
    }),

  /**
   * Crear recompensa dentro de una fase existente
   */
  create: publicProcedure
    .input(CreateRewardInputSchema)
    .output(RewardEntitySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.rewardService.create(ctx.userId, input);
    }),

  /**
   * Actualizar recompensa existente
   */
  update: publicProcedure
    .input(UpdateRewardInputSchema)
    .output(RewardEntitySchema)
    .mutation(async ({ ctx, input }) => {
      // Asumimos que el rewardService tiene un update
      const reward = await ctx.rewardService.update(input.id, input.data);
      return reward;
    }),

  /**
   * Eliminar recompensa
   */
  delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    // Asumimos que el rewardService tiene un delete
    await ctx.rewardService.delete(input.id);
    return { success: true };
  }),

  // [TODO]: Podría haber procedimientos para actualizar el tracking de uso, cumplir condiciones, etc.
});

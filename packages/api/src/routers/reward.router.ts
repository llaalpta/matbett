/**
 * Reward tRPC Router
 * Define procedures para operaciones CRUD de recompensas
 */

import { z } from 'zod';
import {
  RewardSchema,
  RewardEntitySchema,
  UpdateRewardInputSchema,
  // RewardListInputSchema, // Si tuviéramos un listado independiente
  // createPaginatedResponseSchema, // [TODO]: Descomentar cuando se implemente el endpoint list (paginación)
} from '@matbett/shared';

import { publicProcedure, router } from '../trpc';

/**
 * Router de recompensas con procedures tipados
 */
export const rewardRouter = router({
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

  /**
   * Crear nueva recompensa (raro, normalmente via Promotion)
   */
  create: publicProcedure
    .input(RewardSchema)
    .output(RewardEntitySchema)
    .mutation(async ({ ctx, input }) => {
      // Asumimos que el rewardService tiene un create
      // ctx.userId es necesario si el reward se asigna directamente a un usuario
      const reward = await ctx.rewardService.create(input, ctx.userId);
      return reward;
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

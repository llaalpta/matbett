/**
 * Promotion tRPC Router
 * Define procedures para operaciones CRUD de promociones
 */

import { z } from 'zod';
import {
  PromotionSchema,
  PromotionEntitySchema,
  PromotionListInputSchema,
  UpdatePromotionInputSchema,
  createPaginatedResponseSchema,
  AvailableTimeframesSchema,
} from '@matbett/shared';

import { publicProcedure, router } from '../trpc';

/**
 * Router de promociones con procedures tipados
 */
export const promotionRouter = router({
  /**
   * Obtener todas las promociones con paginación
   * Compatible con TanStack Table
   */
  list: publicProcedure
    .input(PromotionListInputSchema)
    .output(createPaginatedResponseSchema(PromotionEntitySchema))
    .query(async ({ ctx, input }) => {
      const result = await ctx.promotionService.list(input);
      return result;
    }),

  /**
   * Obtener una promoción por ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(PromotionEntitySchema.nullable())
    .query(async ({ ctx, input }) => {
      const promotion = await ctx.promotionService.getById(input.id);
      return promotion;
    }),

  /**
   * Crear nueva promoción
   */
  create: publicProcedure
    .input(PromotionSchema)
    .output(PromotionEntitySchema)
    .mutation(async ({ ctx, input }) => {
      const promotion = await ctx.promotionService.create(input);
      return promotion;
    }),

  /**
   * Actualizar promoción existente
   */
  update: publicProcedure
    .input(UpdatePromotionInputSchema)
    .output(PromotionEntitySchema)
    .mutation(async ({ ctx, input }) => {
      const promotion = await ctx.promotionService.update(input.id, input.data);
      return promotion;
    }),

  /**
   * Eliminar promoción
   */
  delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    await ctx.promotionService.delete(input.id);
    return { success: true };
  }),

  /**
   * Obtener timeframes disponibles para una promoción
   * Usado para configurar timeframes relativos en cualquier nivel de la jerarquía
   */
  getAvailableTimeframes: publicProcedure
    .input(z.object({ promotionId: z.string() }))
    .output(AvailableTimeframesSchema)
    .query(async ({ ctx, input }) => {
      const availableTimeframes = await ctx.promotionService.getAvailableTimeframes(input.promotionId);
      return availableTimeframes;
    }),
});

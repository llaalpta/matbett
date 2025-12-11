/**
 * @matbett/api
 *
 * Paquete compartido que contiene la definición del router tRPC.
 * Consumido por:
 * - apps/frontend (para tipos e inferencia)
 * - apps/backend (para servir el router)
 */

// Re-exportar el router principal
export { appRouter } from './root';
export type { AppRouter } from './root';

// Re-exportar utilidades de tRPC
export { publicProcedure, router, middleware, loggerMiddleware } from './trpc';

// Re-exportar tipos de contexto
export type { Context, IBookmakerAccountService, IPromotionService, IDepositService, IRewardService } from './context';

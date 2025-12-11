/**
 * App Router
 * Router principal que combina todos los sub-routers
 */

import { router } from './trpc';
import { promotionRouter } from './routers/promotion.router';
import { depositRouter } from './routers/deposit.router';
import { bookmakerAccountRouter } from './routers/bookmaker-account.router';
import { rewardRouter } from './routers/reward.router'; // Importar el nuevo router

/**
 * Router principal de la aplicación
 * Exporta el tipo para usar en el frontend
 */
export const appRouter = router({
  promotion: promotionRouter,
  deposit: depositRouter,
  bookmakerAccount: bookmakerAccountRouter,
  reward: rewardRouter, // Añadir el router de recompensa
  // Aquí irán más routers: user, bet, etc.
});

/**
 * Tipo del router para usar en el cliente tRPC
 */
export type AppRouter = typeof appRouter;

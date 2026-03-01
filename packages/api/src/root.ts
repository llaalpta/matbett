import { bookmakerAccountRouter } from './routers/bookmaker-account.router';
import { betRouter } from './routers/bet.router';
import { depositRouter } from './routers/deposit.router';
import { promotionRouter } from './routers/promotion.router';
import { qualifyConditionRouter } from './routers/qualify-condition.router';
import { rewardRouter } from './routers/reward.router';
import { router } from './trpc';

export const appRouter = router({
  promotion: promotionRouter,
  deposit: depositRouter,
  bet: betRouter,
  bookmakerAccount: bookmakerAccountRouter,
  reward: rewardRouter,
  qualifyCondition: qualifyConditionRouter,
});

export type AppRouter = typeof appRouter;

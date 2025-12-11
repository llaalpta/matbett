/**
 * tRPC Initialization
 * Configura tRPC y exporta helpers para crear routers y procedures
 */

import { initTRPC } from '@trpc/server';
import { ZodError } from 'zod';
import superjson from 'superjson';

import { Context } from './context';

/**
 * Inicializa tRPC con el contexto
 *
 * Usamos superjson como transformer para preservar tipos no-serializables
 * en JSON (Date, Map, Set, undefined, BigInt, etc.)
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Exporta helpers para crear routers y procedures
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

/**
 * Middleware para logging (opcional)
 */
export const loggerMiddleware = middleware(async (opts) => {
  const start = Date.now();

  const result = await opts.next();

  const durationMs = Date.now() - start;
  const meta = { path: opts.path, type: opts.type, durationMs };

  if (result.ok) {
    // eslint-disable-next-line no-console
    console.log('✅ tRPC OK', meta);
  } else {
    console.error('❌ tRPC ERROR', meta, result.error);
  }

  return result;
});

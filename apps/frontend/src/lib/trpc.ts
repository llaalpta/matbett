/**
 * tRPC Client Configuration
 * Integración MODERNA con @trpc/tanstack-react-query
 *
 * Referencia: https://trpc.io/docs/client/react/tanstack-react-query
 */

import type { AppRouter } from '@matbett/api';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import superjson from 'superjson';

// =============================================
// 1. URL HELPER
// =============================================

function getBaseUrl() {
  if (typeof window !== 'undefined')
    // Browser: usa path relativo
    return '';

  if (process.env.VERCEL_URL)
    // SSR en Vercel
    return `https://${process.env.VERCEL_URL}`;

  // SSR local
  return `http://localhost:${process.env.NEXT_PUBLIC_API_PORT ?? 3001}`;
}

// =============================================
// 2. tRPC REACT CONTEXT
// =============================================

/**
 * Crea el contexto de tRPC para React.
 *
 * @export TRPCProvider - El componente <TRPCProvider> para envolver la app.
 * @export useTRPC - El hook principal. Devuelve el objeto 'trpc' para generar queryOptions.
 * @export useTRPCClient - Hook para acceder al cliente tRPC raw si es necesario.
 */
export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();

// =============================================
// 3. CLIENT FACTORY
// =============================================

/**
 * Función helper para crear el cliente tRPC.
 * Se usará en 'providers.tsx' o 'App.tsx' para instanciar el cliente dentro de un useState.
 */
export const createApiClient = () =>
  createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: getBaseUrl() + '/trpc',
        transformer: superjson, // Vital para manejo de Fechas
        async headers() {
          return {
            // 'x-user-id': '...' // Headers de auth si son necesarios
          };
        },
      }),
    ],
  });

// =============================================
// 4. TYPE INFERENCE HELPERS
// =============================================

/**
 * Tipos de ayuda para inferir entradas y salidas de los routers.
 * Uso: type Promotion = RouterOutputs['promotion']['getById']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
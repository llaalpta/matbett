'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { TRPCProvider, createApiClient } from '@/lib/trpc'; // Importamos la fábrica centralizada

// =============================================
// QUERY CLIENT FACTORY (SSR Friendly)
// =============================================

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minuto por defecto
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: siempre crear nuevo cliente para evitar compartir caché entre usuarios
    return makeQueryClient();
  }
  // Browser: singleton para mantener caché durante la navegación
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

// =============================================
// PROVIDER COMPONENT
// =============================================

export function AppTRPCProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  // Usamos la fábrica 'createApiClient' de lib/trpc.ts
  // Así la configuración (URL, SuperJSON, Headers) vive en un solo sitio.
  const [trpcClient] = useState(() => createApiClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
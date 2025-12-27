/**
 * Hooks de Promociones usando tRPC nativo
 * Usa el nuevo patrón @trpc/tanstack-react-query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useTRPC } from '@/lib/trpc';

// =============================================
// HOOKS DE QUERIES
// =============================================

/**
 * Hook para obtener una promoción por ID
 * Usa el nuevo patrón: useQuery(trpc.procedure.queryOptions())
 */
export const usePromotion = (id: string | undefined) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.promotion.getById.queryOptions(
      { id: id! },
      {
        enabled: !!id,
      }
    ),
  });
};

// Alias para mayor claridad en contexto de formularios
export const useGetPromotion = usePromotion;

/**
 * Hook para listar promociones con filtros opcionales
 */
export const usePromotions = (params?: { status?: string; bookmaker?: string }) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.promotion.list.queryOptions(params ?? {}),
  });
};

/**
 * Hook para obtener los timeframes disponibles de una promoción
 * Usado para configurar timeframes relativos en cualquier nivel de la jerarquía
 */
export const useAvailableTimeframes = (promotionId: string | undefined) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.promotion.getAvailableTimeframes.queryOptions(
      { promotionId: promotionId! },
      {
        enabled: !!promotionId,
      }
    ),
  });
};

// =============================================
// HOOKS DE MUTATIONS
// =============================================

/**
 * Hook para crear promoción
 * Invalida automáticamente el cache de listas
 */
export const useCreatePromotion = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.promotion.create.mutationOptions({
      onSuccess: (result) => {
        // Invalidar cache de listas
        queryClient.invalidateQueries({
          queryKey: trpc.promotion.list.queryKey(),
        });
        // Pre-popular cache para la promoción creada
        if (result?.id) {
          queryClient.setQueryData(
            trpc.promotion.getById.queryKey({ id: result.id }),
            result
          );
        }
      },
    }),
  });
};

/**
 * Hook para actualizar promoción
 */
export const useUpdatePromotion = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.promotion.update.mutationOptions({
      onSuccess: (result, variables) => {
        // Invalidar cache de listas
        queryClient.invalidateQueries({
          queryKey: trpc.promotion.list.queryKey(),
        });
        // Actualizar cache individual
        queryClient.setQueryData(
          trpc.promotion.getById.queryKey({ id: variables.id }),
          result
        );
      },
    }),
  });
};

/**
 * Hook para eliminar promoción
 */
export const useDeletePromotion = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.promotion.delete.mutationOptions({
      onSuccess: (_, variables) => {
        // Invalidar cache de listas
        queryClient.invalidateQueries({
          queryKey: trpc.promotion.list.queryKey(),
        });
        // Remover del cache individual
        queryClient.removeQueries({
          queryKey: trpc.promotion.getById.queryKey({ id: variables.id }),
        });
      },
    }),
  });
};

// =============================================
// DEPRECATED - Query Keys (ya no necesarios con tRPC)
// =============================================

/**
 * @deprecated Usar trpc.promotion.list.queryKey() directamente
 */
export const promotionQueryKeys = {
  all: ['promotion'] as const,
  lists: () => [...promotionQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...promotionQueryKeys.lists(), filters] as const,
  details: () => [...promotionQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...promotionQueryKeys.details(), id] as const,
};

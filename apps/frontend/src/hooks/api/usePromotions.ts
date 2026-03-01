/**
 * Hooks de Promociones usando tRPC nativo
 * Usa el nuevo patrón @trpc/tanstack-react-query
 */

import type { PromotionListInput } from '@matbett/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useTRPC } from '@/lib/trpc';

const invalidatePromotionDerivedQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  trpc: ReturnType<typeof useTRPC>,
  promotionId: string | undefined,
) => {
  if (!promotionId) {
    return;
  }

  queryClient.invalidateQueries({
    queryKey: trpc.promotion.getById.queryKey({ id: promotionId }),
  });
  queryClient.invalidateQueries({
    queryKey: trpc.promotion.getAnchorCatalog.queryKey({ promotionId }),
  });
  queryClient.invalidateQueries({
    queryKey: trpc.promotion.getAnchorOccurrences.queryKey({ promotionId }),
  });
  queryClient.invalidateQueries({
    queryKey: trpc.promotion.getAvailableQualifyConditions.queryKey({ promotionId }),
  });
};

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

/**
 * Hook para listar promociones con filtros opcionales
 */
export const usePromotions = (params?: PromotionListInput) => {
  const trpc = useTRPC();
  const safeParams: PromotionListInput = params ?? {
    pageIndex: 0,
    pageSize: 20,
  };

  return useQuery({
    ...trpc.promotion.list.queryOptions(safeParams),
  });
};

/**
 * Hook para obtener el catalogo de anchors de una promocion
 * Usado para configurar timeframes relativos en cualquier nivel de la jerarquia
 */
export const useAnchorCatalog = (promotionId: string | undefined) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.promotion.getAnchorCatalog.queryOptions(
      { promotionId: promotionId! },
      {
        enabled: !!promotionId,
      }
    ),
  });
};

export const useAnchorOccurrences = (promotionId: string | undefined) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.promotion.getAnchorOccurrences.queryOptions(
      { promotionId: promotionId! },
      {
        enabled: !!promotionId,
      }
    ),
  });
};


/**
 * Hook para obtener el pool de qualify conditions de una promoción
 * Usado por formularios standalone de reward para reutilizar condiciones
 */
export const useAvailableQualifyConditions = (
  promotionId: string | undefined
) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.promotion.getAvailableQualifyConditions.queryOptions(
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
        queryClient.invalidateQueries({
          queryKey: trpc.promotion.list.queryKey(),
        });
        invalidatePromotionDerivedQueries(queryClient, trpc, variables.id);
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
        queryClient.invalidateQueries({
          queryKey: trpc.promotion.list.queryKey(),
        });
        queryClient.removeQueries({
          queryKey: trpc.promotion.getAnchorCatalog.queryKey({
            promotionId: variables.id,
          }),
        });
        queryClient.removeQueries({
          queryKey: trpc.promotion.getAnchorOccurrences.queryKey({
            promotionId: variables.id,
          }),
        });
        queryClient.removeQueries({
          queryKey: trpc.promotion.getAvailableQualifyConditions.queryKey({
            promotionId: variables.id,
          }),
        });
        queryClient.removeQueries({
          queryKey: trpc.promotion.getById.queryKey({ id: variables.id }),
        });
      },
    }),
  });
};



/**
 * Hooks de Depósitos usando tRPC nativo
 * Reemplaza al antiguo servicio REST
 */

import type { DepositEntity, DepositListInput } from '@matbett/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useTRPC } from '@/lib/trpc';

const collectDepositRelatedIds = (deposit: DepositEntity | null | undefined) => {
  const bookmakerAccountIds = new Set<string>();
  const promotionIds = new Set<string>();
  const qualifyConditionIds = new Set<string>();
  const rewardIds = new Set<string>();

  if (deposit?.bookmakerAccountId) {
    bookmakerAccountIds.add(deposit.bookmakerAccountId);
  }

  for (const participation of deposit?.participations ?? []) {
    promotionIds.add(participation.promotionId);
    qualifyConditionIds.add(participation.qualifyConditionId);

    if (participation.rewardId) {
      rewardIds.add(participation.rewardId);
    }
  }

  return {
    bookmakerAccountIds: [...bookmakerAccountIds].filter(Boolean),
    promotionIds: [...promotionIds],
    qualifyConditionIds: [...qualifyConditionIds],
    rewardIds: [...rewardIds],
  };
};

const invalidateDepositDerivedQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  trpc: ReturnType<typeof useTRPC>,
  deposit: DepositEntity | null | undefined
) => {
  const {
    bookmakerAccountIds,
    promotionIds,
    qualifyConditionIds,
    rewardIds,
  } = collectDepositRelatedIds(deposit);

  for (const bookmakerAccountId of bookmakerAccountIds) {
    queryClient.invalidateQueries({
      queryKey: trpc.bookmakerAccount.getById.queryKey({ id: bookmakerAccountId }),
    });
  }

  for (const promotionId of promotionIds) {
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
  }

  for (const qualifyConditionId of qualifyConditionIds) {
    queryClient.invalidateQueries({
      queryKey: trpc.qualifyCondition.getById.queryKey({ id: qualifyConditionId }),
    });
  }

  for (const rewardId of rewardIds) {
    queryClient.invalidateQueries({
      queryKey: trpc.reward.getById.queryKey({ id: rewardId }),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.reward.getRelatedTracking.queryKey({ id: rewardId }),
    });
  }
};

const invalidateDepositListQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  trpc: ReturnType<typeof useTRPC>
) => {
  queryClient.invalidateQueries({
    queryKey: trpc.deposit.list.queryKey(),
  });
  queryClient.invalidateQueries({
    queryKey: trpc.bookmakerAccount.list.queryKey(),
  });
  queryClient.invalidateQueries({
    queryKey: trpc.promotion.list.queryKey(),
  });
  queryClient.invalidateQueries({
    queryKey: trpc.qualifyCondition.list.queryKey(),
  });
};

// =============================================
// HOOKS DE QUERIES
// =============================================

/**
 * Hook para obtener un depósito por ID
 */
export const useDeposit = (id: string | undefined) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.deposit.getById.queryOptions(
      { id: id! },
      { enabled: !!id }
    ),
  });
};

/**
 * Hook para listar depósitos con filtros y paginación
 */
export const useDepositsList = (params?: DepositListInput) => {
  const trpc = useTRPC();

  // Valores por defecto seguros si no se pasan params
  const safeParams: DepositListInput = params || {
    pageIndex: 0,
    pageSize: 20,
  };

  return useQuery({
    ...trpc.deposit.list.queryOptions(safeParams),
  });
};

export const useDepositsByQualifyCondition = (
  qualifyConditionId: string | undefined,
  params?: DepositListInput
) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.deposit.list.queryOptions(
      {
        pageIndex: 0,
        pageSize: 20,
        ...params,
        qualifyConditionId: qualifyConditionId!,
      },
      {
        enabled: Boolean(qualifyConditionId),
      }
    ),
  });
};

// =============================================
// HOOKS DE MUTATIONS
// =============================================

/**
 * Hook para crear depósito
 */
export const useCreateDeposit = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.deposit.create.mutationOptions({
      onSuccess: (result) => {
        invalidateDepositListQueries(queryClient, trpc);
        invalidateDepositDerivedQueries(queryClient, trpc, result);
      },
    }),
  });
};

/**
 * Hook para actualizar depósito
 */
export const useUpdateDeposit = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.deposit.update.mutationOptions({
      onSuccess: (result, variables) => {
        const cachedDeposit = queryClient.getQueryData<DepositEntity | undefined>(
          trpc.deposit.getById.queryKey({ id: variables.id })
        );

        invalidateDepositListQueries(queryClient, trpc);
        invalidateDepositDerivedQueries(queryClient, trpc, cachedDeposit);
        invalidateDepositDerivedQueries(queryClient, trpc, result);
        queryClient.setQueryData(
          trpc.deposit.getById.queryKey({ id: variables.id }),
          result
        );
      },
    }),
  });
};

/**
 * Hook para eliminar depósito
 */
export const useDeleteDeposit = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.deposit.delete.mutationOptions({
      onSuccess: (result, variables) => {
        const cachedDeposit = queryClient.getQueryData<DepositEntity | undefined>(
          trpc.deposit.getById.queryKey({ id: variables.id })
        );

        invalidateDepositListQueries(queryClient, trpc);
        invalidateDepositDerivedQueries(queryClient, trpc, cachedDeposit);

        queryClient.removeQueries({
          queryKey: trpc.deposit.getById.queryKey({ id: variables.id }),
        });

        if (result.promotionId) {
          queryClient.invalidateQueries({
            queryKey: trpc.promotion.getById.queryKey({ id: result.promotionId }),
          });
          queryClient.invalidateQueries({
            queryKey: trpc.promotion.getAnchorCatalog.queryKey({
              promotionId: result.promotionId,
            }),
          });
          queryClient.invalidateQueries({
            queryKey: trpc.promotion.getAnchorOccurrences.queryKey({
              promotionId: result.promotionId,
            }),
          });
          queryClient.invalidateQueries({
            queryKey: trpc.promotion.getAvailableQualifyConditions.queryKey({
              promotionId: result.promotionId,
            }),
          });
        }
      },
    }),
  });
};

// =============================================
// COMPOSITE HOOK (Legacy Adapter)
// =============================================

/**
 * Hook unificado que mantiene la firma aproximada del anterior para facilitar migración,
 * pero usa internamente los nuevos hooks de tRPC.
 */
export const useDeposits = () => {
  // Hooks individuales
  const createMutation = useCreateDeposit();
  const updateMutation = useUpdateDeposit();
  const deleteMutation = useDeleteDeposit();
  
  // Nota: Los hooks de query (list/get) deben llamarse en el componente, no aquí dentro
  // si queremos respetar las reglas de hooks y reactividad de params.
  // Exponemos las mutaciones directamente.

  return {
    // Métodos (Mutations)
    createDeposit: createMutation.mutateAsync,
    updateDeposit: updateMutation.mutateAsync,
    deleteDeposit: deleteMutation.mutateAsync,
    
    // Estados
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Errores
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
};

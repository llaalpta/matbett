/**
 * Hooks de Depósitos usando tRPC nativo
 * Reemplaza al antiguo servicio REST
 */

import type { DepositListInput } from '@matbett/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useTRPC } from '@/lib/trpc';

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
      onSuccess: () => {
        // Invalidar todas las listas de depósitos
        queryClient.invalidateQueries({
          queryKey: trpc.deposit.list.queryKey(),
        });
        // TODO: Si el depósito afecta a una promoción (qualify condition), 
        // invalidar también queries de promoción relacionadas si es posible saberlo.
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
        // Invalidar listas
        queryClient.invalidateQueries({
          queryKey: trpc.deposit.list.queryKey(),
        });
        // Actualizar detalle individual
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
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: trpc.deposit.list.queryKey(),
        });
        queryClient.removeQueries({
          queryKey: trpc.deposit.getById.queryKey({ id: variables.id }),
        });
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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useTRPC } from '@/lib/trpc';

/**
 * Hook para obtener un Reward por ID
 */
export const useReward = (id: string | undefined) => {
  const trpc = useTRPC();

  return useQuery({
    // Asumimos que hay un endpoint 'reward.getById' en tRPC
    ...trpc.reward.getById.queryOptions(
      { id: id! },
      { enabled: !!id }
    ),
  });
};

/**
 * Hook para actualizar un Reward
 */
export const useUpdateReward = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.reward.update.mutationOptions({
      onSuccess: (result, variables) => {
        // Invalidar cache del reward individual
        queryClient.invalidateQueries({
          queryKey: trpc.reward.getById.queryKey({ id: variables.id }),
        });
        // Pre-popular cache con los datos actualizados
        queryClient.setQueryData(
          trpc.reward.getById.queryKey({ id: variables.id }),
          result
        );
        // TODO: Invalidar también cache de la promoción/fase si el reward es parte de una
        // Esto requeriría tener los promotionId/phaseId disponibles en el onSuccess
      },
    }),
  });
};

/**
 * Hook para crear un Reward (generalmente se crea dentro de una promoción, pero por si acaso)
 */
export const useCreateReward = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.reward.create.mutationOptions({
      onSuccess: () => {
        // TODO: Invalidar listas de Rewards si las hubiera, o de promociones si se asocia
      },
    }),
  });
};

// Puedes añadir un useRewardsList si tienes un endpoint de lista de rewards
// export const useRewardsList = (params?: RewardListInput) => { ... };
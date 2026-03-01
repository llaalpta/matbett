import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/lib/trpc";

export const useReward = (id: string | undefined) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.reward.getById.queryOptions(
      { id: id! },
      { enabled: Boolean(id) }
    ),
  });
};

export const useUpdateReward = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.reward.update.mutationOptions({
      onSuccess: (result, variables) => {
        queryClient.invalidateQueries({
          queryKey: trpc.reward.getById.queryKey({ id: variables.id }),
        });
        queryClient.setQueryData(
          trpc.reward.getById.queryKey({ id: variables.id }),
          result
        );

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
      },
    }),
  });
};

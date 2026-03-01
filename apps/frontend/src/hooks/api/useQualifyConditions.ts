import type { QualifyConditionListInput } from "@matbett/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/lib/trpc";

export const useQualifyConditions = (params?: QualifyConditionListInput) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.qualifyCondition.list.queryOptions(
      params ?? {
        pageIndex: 0,
        pageSize: 20,
      }
    ),
  });
};

export const useQualifyCondition = (id: string | undefined) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.qualifyCondition.getById.queryOptions(
      { id: id! },
      { enabled: Boolean(id) }
    ),
  });
};

export const useCreateQualifyConditionForReward = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.qualifyCondition.createForReward.mutationOptions({
      onSuccess: (result, variables) => {
        queryClient.invalidateQueries({
          queryKey: trpc.qualifyCondition.list.queryKey(),
        });
        queryClient.setQueryData(
          trpc.qualifyCondition.getById.queryKey({ id: result.id }),
          result
        );
        queryClient.invalidateQueries({
          queryKey: trpc.reward.getById.queryKey({ id: variables.rewardId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.reward.list.queryKey(),
        });
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

export const useUpdateQualifyCondition = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.qualifyCondition.update.mutationOptions({
      onSuccess: (result, variables) => {
        queryClient.invalidateQueries({
          queryKey: trpc.qualifyCondition.getById.queryKey({ id: variables.id }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.qualifyCondition.list.queryKey(),
        });
        queryClient.setQueryData(
          trpc.qualifyCondition.getById.queryKey({ id: variables.id }),
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

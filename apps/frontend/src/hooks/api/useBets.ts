import type {
  BetBatchListInput,
  BetListInput,
  BetRegistrationBatch,
} from "@matbett/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/lib/trpc";

function collectBatchRelatedIds(batch: BetRegistrationBatch | null | undefined) {
  const bookmakerAccountIds = new Set<string>();
  const promotionIds = new Set<string>();
  const rewardIds = new Set<string>();
  const qualifyConditionIds = new Set<string>();

  for (const leg of batch?.legs ?? []) {
    bookmakerAccountIds.add(leg.bookmakerAccountId);

    for (const participation of leg.participations) {
      promotionIds.add(participation.promotionId);

      if (participation.kind === "QUALIFY_TRACKING") {
        qualifyConditionIds.add(participation.qualifyConditionId);
        for (const rewardId of participation.rewardIds) {
          rewardIds.add(rewardId);
        }
        continue;
      }

      rewardIds.add(participation.rewardId);
    }
  }

  return {
    bookmakerAccountIds: [...bookmakerAccountIds],
    promotionIds: [...promotionIds],
    rewardIds: [...rewardIds],
    qualifyConditionIds: [...qualifyConditionIds],
  };
}

function invalidateBetDerivedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  trpc: ReturnType<typeof useTRPC>,
  batch: BetRegistrationBatch | null | undefined
) {
  const {
    bookmakerAccountIds,
    promotionIds,
    rewardIds,
    qualifyConditionIds,
  } = collectBatchRelatedIds(batch);

  queryClient.invalidateQueries({
    queryKey: trpc.promotion.list.queryKey(),
  });
  queryClient.invalidateQueries({
    queryKey: trpc.qualifyCondition.list.queryKey(),
  });

  for (const bookmakerAccountId of bookmakerAccountIds) {
    queryClient.invalidateQueries({
      queryKey: trpc.bet.getAvailablePromotionContexts.queryKey({
        bookmakerAccountId,
      }),
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
      queryKey: trpc.promotion.getAvailableQualifyConditions.queryKey({
        promotionId,
      }),
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

  for (const qualifyConditionId of qualifyConditionIds) {
    queryClient.invalidateQueries({
      queryKey: trpc.qualifyCondition.getById.queryKey({
        id: qualifyConditionId,
      }),
    });
  }
}

export const useBetBatch = (id: string | undefined) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.bet.getBatch.queryOptions(
      { id: id! },
      {
        enabled: Boolean(id),
      }
    ),
  });
};

export const useBetBatches = (params?: BetBatchListInput) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.bet.listBatches.queryOptions(
      params ?? {
        pageIndex: 0,
        pageSize: 20,
      }
    ),
  });
};

export const useFlatBets = (params?: BetListInput) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.bet.listBets.queryOptions(
      params ?? {
        pageIndex: 0,
        pageSize: 20,
      }
    ),
  });
};

export const useBetsByQualifyCondition = (
  id: string | undefined,
  filters?: BetListInput
) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.bet.listBetsByQC.queryOptions(
      {
        id: id!,
        filters: filters ?? {
          pageIndex: 0,
          pageSize: 20,
        },
      },
      {
        enabled: Boolean(id),
      }
    ),
  });
};

export const useBetsByUsageTracking = (
  id: string | undefined,
  filters?: BetListInput
) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.bet.listBetsByUsageTracking.queryOptions(
      {
        id: id!,
        filters: filters ?? {
          pageIndex: 0,
          pageSize: 20,
        },
      },
      {
        enabled: Boolean(id),
      }
    ),
  });
};

export const useAvailableBetPromotionContexts = (
  bookmakerAccountId: string | undefined
) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.bet.getAvailablePromotionContexts.queryOptions(
      { bookmakerAccountId: bookmakerAccountId! },
      {
        enabled: Boolean(bookmakerAccountId),
      }
    ),
  });
};

export const useBetDashboardTotals = () => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.bet.getDashboardTotals.queryOptions(),
  });
};

export const useCreateBetBatch = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.bet.registerBetsBatch.mutationOptions({
      onSuccess: (result) => {
        queryClient.invalidateQueries({
          queryKey: trpc.bet.listBatches.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.bet.listBets.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.bet.getDashboardTotals.queryKey(),
        });
        invalidateBetDerivedQueries(queryClient, trpc, result);
        queryClient.setQueryData(
          trpc.bet.getBatch.queryKey({ id: result.id }),
          result
        );
      },
    }),
  });
};

export const useUpdateBetBatch = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.bet.updateBatch.mutationOptions({
      onSuccess: (result, variables) => {
        const cachedBatch = queryClient.getQueryData<BetRegistrationBatch | null>(
          trpc.bet.getBatch.queryKey({ id: variables.id })
        );

        queryClient.invalidateQueries({
          queryKey: trpc.bet.listBatches.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.bet.listBets.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.bet.getDashboardTotals.queryKey(),
        });
        invalidateBetDerivedQueries(queryClient, trpc, cachedBatch);
        invalidateBetDerivedQueries(queryClient, trpc, result);
        queryClient.setQueryData(
          trpc.bet.getBatch.queryKey({ id: variables.id }),
          result
        );
      },
    }),
  });
};

export const useDeleteBetBatch = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.bet.deleteBatch.mutationOptions({
      onSuccess: (_, variables) => {
        const cachedBatch = queryClient.getQueryData<BetRegistrationBatch | null>(
          trpc.bet.getBatch.queryKey({ id: variables.id })
        );

        queryClient.invalidateQueries({
          queryKey: trpc.bet.listBatches.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.bet.listBets.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.bet.getDashboardTotals.queryKey(),
        });
        invalidateBetDerivedQueries(queryClient, trpc, cachedBatch);
        queryClient.removeQueries({
          queryKey: trpc.bet.getBatch.queryKey({ id: variables.id }),
        });
      },
    }),
  });
};

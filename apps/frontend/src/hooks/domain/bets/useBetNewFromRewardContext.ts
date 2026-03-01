"use client";

import { useCallback, useMemo } from "react";

import { useAvailableBetPromotionContexts } from "@/hooks/api/useBets";
import { usePromotion } from "@/hooks/api/usePromotions";
import { useReward } from "@/hooks/api/useRewards";
import type { BetBatchInitialContext } from "@/hooks/useBetBatchForm";

const supportedRewardTypes = new Set([
  "FREEBET",
  "CASHBACK_FREEBET",
  "BET_BONUS_ROLLOVER",
  "BET_BONUS_NO_ROLLOVER",
  "ENHANCED_ODDS",
]);

export function useBetNewFromRewardContext(rewardId: string | undefined) {
  const rewardQuery = useReward(rewardId);
  const promotionQuery = usePromotion(rewardQuery.data?.promotionId);
  const bookmakerAccountId = promotionQuery.data?.bookmakerAccountId;
  const availableContextsQuery = useAvailableBetPromotionContexts(bookmakerAccountId);

  const initialContext = useMemo<BetBatchInitialContext | undefined>(() => {
    const reward = rewardQuery.data;
    if (!reward || !bookmakerAccountId) {
      return undefined;
    }

    const matchingContext = availableContextsQuery.data?.rewardUsageContexts.find(
      (context) => context.rewardId === reward.id
    );

    if (!matchingContext) {
      return undefined;
    }

    return {
      entryType: "reward",
      bookmakerAccountId,
      promotionName: matchingContext.promotionName,
      sourceLabel: reward.type,
      phaseName: matchingContext.phaseName,
      returnHref: `/rewards/${reward.id}`,
      returnLabel: "Volver a la reward",
      initialParticipation: {
        kind: "REWARD_USAGE",
        rewardType: matchingContext.rewardType,
        usageTrackingId: matchingContext.usageTrackingId,
        rewardId: matchingContext.rewardId,
      },
    };
  }, [availableContextsQuery.data?.rewardUsageContexts, bookmakerAccountId, rewardQuery.data]);

  const unavailableReason = useMemo(() => {
    const reward = rewardQuery.data;

    if (!reward) {
      return undefined;
    }

    if (!supportedRewardTypes.has(reward.type)) {
      return "Esta reward no se puede usar dentro del registro de apuestas.";
    }

    if (availableContextsQuery.isLoading || availableContextsQuery.isFetching) {
      return undefined;
    }

    if (!bookmakerAccountId) {
      return "La promoción asociada no tiene una cuenta válida para registrar apuestas.";
    }

    if (!initialContext) {
      return "Esta reward todavía no tiene un contexto de uso disponible para registrar apuestas.";
    }

    return undefined;
  }, [
    availableContextsQuery.isFetching,
    availableContextsQuery.isLoading,
    bookmakerAccountId,
    initialContext,
    rewardQuery.data,
  ]);

  const retry = useCallback(() => {
    void rewardQuery.refetch();
    if (rewardQuery.data?.promotionId) {
      void promotionQuery.refetch();
    }
    if (bookmakerAccountId) {
      void availableContextsQuery.refetch();
    }
  }, [availableContextsQuery, bookmakerAccountId, promotionQuery, rewardQuery]);

  return {
    initialContext,
    isLoading:
      rewardQuery.isLoading ||
      promotionQuery.isLoading ||
      availableContextsQuery.isLoading,
    isError: rewardQuery.isError || promotionQuery.isError,
    error: rewardQuery.error ?? promotionQuery.error,
    unavailableReason,
    retry,
  };
}

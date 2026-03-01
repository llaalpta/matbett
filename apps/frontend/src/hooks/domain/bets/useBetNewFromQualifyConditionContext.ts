"use client";

import { useCallback, useMemo } from "react";

import { useAvailableBetPromotionContexts } from "@/hooks/api/useBets";
import { usePromotion } from "@/hooks/api/usePromotions";
import { useQualifyCondition } from "@/hooks/api/useQualifyConditions";
import type { BetBatchInitialContext } from "@/hooks/useBetBatchForm";

const supportedQualifyConditionTypes = new Set(["BET", "LOSSES_CASHBACK"]);

export function useBetNewFromQualifyConditionContext(
  qualifyConditionId: string | undefined
) {
  const qualifyConditionQuery = useQualifyCondition(qualifyConditionId);
  const promotionQuery = usePromotion(qualifyConditionQuery.data?.promotionId);
  const bookmakerAccountId = promotionQuery.data?.bookmakerAccountId;
  const availableContextsQuery = useAvailableBetPromotionContexts(bookmakerAccountId);

  const initialContext = useMemo<BetBatchInitialContext | undefined>(() => {
    const qualifyCondition = qualifyConditionQuery.data;
    if (!qualifyCondition || !bookmakerAccountId) {
      return undefined;
    }

    const matchingContext = availableContextsQuery.data?.qualifyTrackingContexts.find(
      (context) => context.qualifyConditionId === qualifyCondition.id
    );
    const firstReward = matchingContext?.rewards[0];

    if (!matchingContext || !firstReward) {
      return undefined;
    }

    return {
      entryType: "qualify-condition",
      bookmakerAccountId,
      promotionName: matchingContext.promotionName,
      sourceLabel: qualifyCondition.type,
      returnHref: `/qualify-conditions/${qualifyCondition.id}`,
      returnLabel: "Volver a la qualify condition",
      initialParticipation: {
        kind: "QUALIFY_TRACKING",
        rewardType: firstReward.rewardType,
        qualifyConditionId: matchingContext.qualifyConditionId,
        rewardIds: matchingContext.rewards.map((reward) => reward.rewardId),
        calculationRewardId: firstReward.rewardId,
      },
    };
  }, [availableContextsQuery.data?.qualifyTrackingContexts, bookmakerAccountId, qualifyConditionQuery.data]);

  const unavailableReason = useMemo(() => {
    const qualifyCondition = qualifyConditionQuery.data;

    if (!qualifyCondition) {
      return undefined;
    }

    if (!supportedQualifyConditionTypes.has(qualifyCondition.type)) {
      return "Esta qualify condition no se puede satisfacer registrando apuestas.";
    }

    if (availableContextsQuery.isLoading || availableContextsQuery.isFetching) {
      return undefined;
    }

    if (!bookmakerAccountId) {
      return "La promoción asociada no tiene una cuenta válida para registrar apuestas.";
    }

    if (!initialContext) {
      return "Esta qualify condition no está disponible ahora mismo como contexto de tracking para apuestas.";
    }

    return undefined;
  }, [
    availableContextsQuery.isFetching,
    availableContextsQuery.isLoading,
    bookmakerAccountId,
    initialContext,
    qualifyConditionQuery.data,
  ]);

  const retry = useCallback(() => {
    void qualifyConditionQuery.refetch();
    if (qualifyConditionQuery.data?.promotionId) {
      void promotionQuery.refetch();
    }
    if (bookmakerAccountId) {
      void availableContextsQuery.refetch();
    }
  }, [
    availableContextsQuery,
    bookmakerAccountId,
    promotionQuery,
    qualifyConditionQuery,
  ]);

  return {
    initialContext,
    isLoading:
      qualifyConditionQuery.isLoading ||
      promotionQuery.isLoading ||
      availableContextsQuery.isLoading,
    isError: qualifyConditionQuery.isError || promotionQuery.isError,
    error: qualifyConditionQuery.error ?? promotionQuery.error,
    unavailableReason,
    retry,
  };
}

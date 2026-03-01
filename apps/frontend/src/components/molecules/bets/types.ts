"use client";

import type { UpdateBetsBatch } from "@matbett/shared";

import type {
  BetBatchFormValues,
  BetBatchInitialContext,
} from "@/hooks/useBetBatchForm";
import type {
  BetAvailablePromotionContexts,
  BetBatchServerModel,
} from "@/types/hooks";

export type { ScenarioOutcomeSummary } from "@/hooks/domain/bets/useBetBatchSummaryLogic";

export type BetBatchFormProps = {
  mode: "create" | "edit";
  initialData?: BetBatchServerModel;
  initialContext?: BetBatchInitialContext;
  onSubmit: (data: UpdateBetsBatch) => Promise<void> | void;
  isLoading?: boolean;
  apiErrorMessage?: string | null;
  onDismissApiError?: () => void;
};

export type BookmakerAccountLike = {
  id: string;
  bookmaker: string;
  accountIdentifier?: string | null;
  bookmakerAccountType?: string | null;
  accountType?: string | null;
};

export type BatchEventFormValue = BetBatchFormValues["events"][number];
export type QualifyTrackingContext =
  BetAvailablePromotionContexts["qualifyTrackingContexts"][number];
export type RewardUsageContext =
  BetAvailablePromotionContexts["rewardUsageContexts"][number];

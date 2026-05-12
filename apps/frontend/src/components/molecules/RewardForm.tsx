"use client";

import { useMemo } from "react";
import { Path, useFormContext, useWatch } from "react-hook-form";

import { useRewardAccessLogic } from "@/hooks/domain/rewards/useRewardAccessLogic";
import {
  usePromotionRewardLogic,
  useStandaloneRewardLogic,
} from "@/hooks/domain/rewards/useRewardLogic";
import {
  usePromotionRewardStatusDateSync,
  useStandaloneRewardStatusDateSync,
} from "@/hooks/useStatusDateSync";
import type {
  PromotionFormData,
  PromotionServerModel,
  RewardFormData,
  RewardQualifyConditionServerModel,
} from "@/types/hooks";
import {
  buildRewardDraftAnchorCatalog,
  mergeAnchorCatalogs,
} from "@/utils/anchorCatalog";

import {
  buildPromotionRewardPaths,
  buildRewardStandalonePaths,
  type PromotionRewardPath,
} from "./reward.paths";
import {
  RewardFormBase,
  type RewardFormSharedProps,
} from "./RewardFormBase";

const getDepositRequiredForAnalysis = (
  conditions: RewardQualifyConditionServerModel[] | undefined
) => {
  for (const condition of conditions ?? []) {
    if (condition.type !== "DEPOSIT") {
      continue;
    }
    if ("targetAmount" in condition.conditions) {
      return condition.conditions.targetAmount ?? undefined;
    }
    if ("minAmount" in condition.conditions) {
      return condition.conditions.minAmount ?? undefined;
    }
  }

  return undefined;
};

export function RewardForm({
  fieldPath,
  onRemove,
  canRemove,
  removeDisabledReason,
  rewardServerData,
  anchorCatalog,
  anchorOccurrences,
}: RewardFormSharedProps & { fieldPath: PromotionRewardPath }) {
  const { control, setValue } = useFormContext<PromotionFormData>();
  const p = (value: Path<PromotionFormData>) => value;

  const { paths, qualifyConditionsPath, usagePaths } =
    buildPromotionRewardPaths(fieldPath, p);

  const usageTypeRaw = useWatch({
    control,
    name: paths.usageConditionsType,
  });
  const phases = useWatch({
    control,
    name: "phases",
  });
  const currentRewardId = useWatch({
    control,
    name: paths.id,
  });
  const currentUsageConditions = useWatch({
    control,
    name: paths.usageConditions,
  });
  const currentRewardStatus = useWatch({
    control,
    name: paths.status,
  });
  const currentClaimMethod = useWatch({
    control,
    name: paths.claimMethod,
  });
  const currentRewardValue = useWatch({
    control,
    name: paths.value,
  });
  const promotionStatus = useWatch({
    control,
    name: "status",
  });
  const promotionTimeframe = useWatch({
    control,
    name: "timeframe",
  });
  const phaseIndexMatch = /^phases\.(\d+)\.rewards\.\d+$/.exec(fieldPath);
  const phaseIndex = phaseIndexMatch
    ? Number.parseInt(phaseIndexMatch[1] ?? "", 10)
    : Number.NaN;
  const phaseStatus =
    Number.isNaN(phaseIndex) || !Array.isArray(phases)
      ? undefined
      : phases[phaseIndex]?.status;

  const usageType = typeof usageTypeRaw === "string" ? usageTypeRaw : undefined;

  const {
    rewardType,
    valueType,
    qualifyConditionsValues,
    handleTypeChange,
    handleValueTypeChange,
  } = usePromotionRewardLogic(paths, rewardServerData);

  usePromotionRewardStatusDateSync({
    control,
    setValue,
    statusPath: paths.status,
    datePath: paths.statusDate,
    serverDates: rewardServerData
      ? {
          qualifyConditionsFulfilledAt:
            rewardServerData.qualifyConditionsFulfilledAt ?? null,
          claimedAt: rewardServerData.claimedAt ?? null,
          receivedAt: rewardServerData.receivedAt ?? null,
          useStartedAt: rewardServerData.useStartedAt ?? null,
          useCompletedAt: rewardServerData.useCompletedAt ?? null,
          expiredAt: rewardServerData.expiredAt ?? null,
        }
      : undefined,
  });

  const rewardAccess = useRewardAccessLogic({
    isPersisted:
      typeof currentRewardId === "string" && currentRewardId.length > 0,
    rewardType: typeof rewardType === "string" ? rewardType : undefined,
    rewardStatus:
      typeof currentRewardStatus === "string" ? currentRewardStatus : undefined,
    claimMethod:
      typeof currentClaimMethod === "string" ? currentClaimMethod : undefined,
    qualifyConditionStatuses: qualifyConditionsValues?.map((condition) =>
      typeof condition?.status === "string" ? condition.status : undefined
    ),
    promotionStatus:
      typeof promotionStatus === "string" ? promotionStatus : undefined,
    phaseStatus: typeof phaseStatus === "string" ? phaseStatus : undefined,
    usageTimeframe: currentUsageConditions?.timeframe,
    promotionTimeframe,
    anchorOccurrences,
  });

  return (
    <RewardFormBase<
      PromotionFormData,
      typeof qualifyConditionsPath,
      typeof paths
    >
      paths={paths}
      usagePaths={usagePaths}
      rewardType={typeof rewardType === "string" ? rewardType : undefined}
      valueType={typeof valueType === "string" ? valueType : undefined}
      usageType={usageType}
      onTypeChange={handleTypeChange}
      onValueTypeChange={handleValueTypeChange}
      onRemove={onRemove}
      canRemove={canRemove}
      removeDisabledReason={removeDisabledReason}
      anchorCatalog={anchorCatalog}
      anchorOccurrences={anchorOccurrences}
      isRewardDefinitionReadOnly={!rewardAccess.isStructureEditable}
      rewardDefinitionReadOnlyReason={rewardAccess.structureLockedReason}
      isUsageConditionsReadOnly={!rewardAccess.isStructureEditable}
      usageConditionsReadOnlyReason={rewardAccess.structureLockedReason}
      rewardStatusOptions={rewardAccess.statusOptions}
      rewardWarnings={rewardAccess.warnings}
      rewardValueForAnalysis={
        typeof currentRewardValue === "number" ? currentRewardValue : undefined
      }
      depositRequiredForAnalysis={getDepositRequiredForAnalysis(
        rewardServerData?.qualifyConditions
      )}
    />
  );
}

export function StandaloneRewardFormFields({
  isEditing: _isEditing,
  rewardServerData,
  anchorCatalog,
  anchorOccurrences,
  promotionData,
}: Omit<RewardFormSharedProps, "onRemove" | "canRemove"> & {
  promotionData?: PromotionServerModel;
}) {
  const { control, setValue } = useFormContext<RewardFormData>();
  const p = (value: Path<RewardFormData>) => value;
  const { paths, qualifyConditionsPath, usagePaths } =
    buildRewardStandalonePaths(p);

  const currentReward = useWatch({
    control,
  });
  const usageTypeRaw = useWatch({
    control,
    name: paths.usageConditionsType,
  });
  const currentRewardId = useWatch({
    control,
    name: paths.id,
  });
  const currentUsageConditions = useWatch({
    control,
    name: paths.usageConditions,
  });
  const currentRewardStatus = useWatch({
    control,
    name: paths.status,
  });
  const currentClaimMethod = useWatch({
    control,
    name: paths.claimMethod,
  });
  const currentRewardValue = useWatch({
    control,
    name: paths.value,
  });

  const draftAnchorCatalog = useMemo(
    () =>
      buildRewardDraftAnchorCatalog(
        currentReward,
        `Recompensa - ${currentReward?.type ?? "UNKNOWN"}`
      ),
    [currentReward]
  );
  const effectiveAnchorCatalog = useMemo(
    () =>
      mergeAnchorCatalogs({
        serverCatalog: anchorCatalog,
        draftCatalog: draftAnchorCatalog,
      }),
    [anchorCatalog, draftAnchorCatalog]
  );
  const usageType = typeof usageTypeRaw === "string" ? usageTypeRaw : undefined;

  const {
    rewardType,
    valueType,
    qualifyConditionsValues,
    handleTypeChange,
    handleValueTypeChange,
  } = useStandaloneRewardLogic(paths, rewardServerData);

  useStandaloneRewardStatusDateSync({
    control,
    setValue,
    statusPath: paths.status,
    datePath: paths.statusDate,
    serverDates: rewardServerData
      ? {
          qualifyConditionsFulfilledAt:
            rewardServerData.qualifyConditionsFulfilledAt ?? null,
          claimedAt: rewardServerData.claimedAt ?? null,
          receivedAt: rewardServerData.receivedAt ?? null,
          useStartedAt: rewardServerData.useStartedAt ?? null,
          useCompletedAt: rewardServerData.useCompletedAt ?? null,
          expiredAt: rewardServerData.expiredAt ?? null,
        }
      : undefined,
  });

  const rewardAccess = useRewardAccessLogic({
    isPersisted:
      typeof currentRewardId === "string" && currentRewardId.length > 0,
    rewardType: typeof rewardType === "string" ? rewardType : undefined,
    rewardStatus:
      typeof currentRewardStatus === "string" ? currentRewardStatus : undefined,
    claimMethod:
      typeof currentClaimMethod === "string" ? currentClaimMethod : undefined,
    qualifyConditionStatuses: qualifyConditionsValues?.map((condition) =>
      typeof condition?.status === "string" ? condition.status : undefined
    ),
    promotion: promotionData ?? null,
    phaseId: rewardServerData?.phaseId,
    usageTimeframe: currentUsageConditions?.timeframe,
    promotionTimeframe: promotionData?.timeframe,
    anchorOccurrences,
  });

  return (
    <RewardFormBase<
      RewardFormData,
      typeof qualifyConditionsPath,
      typeof paths
    >
      paths={paths}
      usagePaths={usagePaths}
      rewardType={typeof rewardType === "string" ? rewardType : undefined}
      valueType={typeof valueType === "string" ? valueType : undefined}
      usageType={usageType}
      onTypeChange={handleTypeChange}
      onValueTypeChange={handleValueTypeChange}
      onRemove={() => {}}
      canRemove={false}
      removeDisabledReason={undefined}
      anchorCatalog={effectiveAnchorCatalog}
      anchorOccurrences={anchorOccurrences}
      isRewardDefinitionReadOnly={!rewardAccess.isStructureEditable}
      rewardDefinitionReadOnlyReason={rewardAccess.structureLockedReason}
      isUsageConditionsReadOnly={!rewardAccess.isStructureEditable}
      usageConditionsReadOnlyReason={rewardAccess.structureLockedReason}
      rewardStatusOptions={rewardAccess.statusOptions}
      rewardWarnings={rewardAccess.warnings}
      rewardValueForAnalysis={
        typeof currentRewardValue === "number" ? currentRewardValue : undefined
      }
      depositRequiredForAnalysis={getDepositRequiredForAnalysis(
        rewardServerData?.qualifyConditions
      )}
    />
  );
}

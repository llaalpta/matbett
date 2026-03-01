"use client";

import { QualifyConditionSchema } from "@matbett/shared";
import { useCallback, useMemo, useState } from "react";
import { Path, useFormContext, useWatch } from "react-hook-form";

import { useRemovedAnchorRefs } from "@/hooks/domain/anchors/useRemovedAnchorRefs";
import { useQualifyConditionAccessLogic } from "@/hooks/domain/qualifyConditions/useQualifyConditionAccessLogic";
import { useRewardAccessLogic } from "@/hooks/domain/rewards/useRewardAccessLogic";
import {
  usePromotionRewardLogic,
  useStandaloneRewardLogic,
} from "@/hooks/domain/rewards/useRewardLogic";
import { usePromotionRewardStatusDateSync } from "@/hooks/useStatusDateSync";
import { useStandaloneRewardStatusDateSync } from "@/hooks/useStatusDateSync";
import type {
  PromotionFormData,
  PromotionServerModel,
  RewardFormData,
} from "@/types/hooks";
import {
  buildRewardDraftAnchorCatalog,
  mergeAnchorCatalogs,
} from "@/utils/anchorCatalog";

import { DepositQualifyModal } from "./DepositQualifyModal";
import {
  buildPromotionRewardPaths,
  buildRewardStandalonePaths,
  type PromotionRewardPath,
} from "./reward.paths";
import {
  RewardFormBase,
  type RewardFormSharedProps,
} from "./RewardFormBase";

const getConditionId = (value: unknown): string | undefined => {
  if (typeof value !== "object" || value === null || !("id" in value)) {
    return undefined;
  }
  const id = value.id;
  return typeof id === "string" ? id : undefined;
};

export function RewardForm({
  fieldPath,
  onRemove,
  canRemove,
  removeDisabledReason,
  isEditing,
  onQualifyConditionSelect,
  rewardServerData,
  anchorCatalog,
  anchorOccurrences,
  availableQualifyConditions,
}: RewardFormSharedProps & { fieldPath: PromotionRewardPath }) {
  const { control, setValue } = useFormContext<PromotionFormData>();
  const p = (value: Path<PromotionFormData>) => value;

  const { paths, qualifyConditionsPath: _qualifyConditionsPath, usagePaths, getQualifyConditionPaths } =
    buildPromotionRewardPaths(fieldPath, p);

  const selectableQualifyConditions = availableQualifyConditions?.filter(
    (condition): condition is typeof condition & { id: string } =>
      typeof condition?.id === "string" && condition.id.length > 0
  );

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
    qualifyConditions,
    qualifyConditionsValues,
    handleTypeChange,
    handleValueTypeChange,
    rewardHasContributingCondition,
    addQualifyCondition,
    handleQualifyConditionTypeChange,
    appendQualifyCondition,
    removeQualifyCondition,
    getQualifyConditionRemoveDisabledReason,
    canRemoveQualifyCondition,
  } = usePromotionRewardLogic(paths, rewardServerData);

  const handleAddExistingQualifyCondition = useCallback(
    (conditionId: string) => {
      const condition = availableQualifyConditions?.find(
        (item) => item.id === conditionId
      );
      if (!condition) {
        return;
      }
      const parsedCondition = QualifyConditionSchema.parse(condition);
      appendQualifyCondition(parsedCondition);
    },
    [appendQualifyCondition, availableQualifyConditions]
  );

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
      typeof _qualifyConditionsPath,
      typeof paths
    >
      paths={paths}
      getQualifyConditionPaths={getQualifyConditionPaths}
      usagePaths={usagePaths}
      rewardType={typeof rewardType === "string" ? rewardType : undefined}
      valueType={typeof valueType === "string" ? valueType : undefined}
      usageType={usageType}
      qualifyConditions={qualifyConditions}
      qualifyConditionsValues={qualifyConditionsValues}
      onTypeChange={handleTypeChange}
      onValueTypeChange={handleValueTypeChange}
      onAddQualifyCondition={addQualifyCondition}
      onRemoveQualifyCondition={removeQualifyCondition}
      onQualifyConditionTypeChange={handleQualifyConditionTypeChange}
      getQualifyConditionRemoveDisabledReason={getQualifyConditionRemoveDisabledReason}
      canRemoveQualifyCondition={canRemoveQualifyCondition}
      rewardHasContributingCondition={rewardHasContributingCondition}
      onRemove={onRemove}
      canRemove={canRemove}
      removeDisabledReason={removeDisabledReason}
      isEditing={isEditing}
      onQualifyConditionSelect={onQualifyConditionSelect}
      availableQualifyConditions={selectableQualifyConditions}
      onAddExistingQualifyCondition={handleAddExistingQualifyCondition}
      rewardServerData={rewardServerData}
      promotion={null}
      anchorCatalog={anchorCatalog}
      anchorOccurrences={anchorOccurrences}
      promotionTimeframe={promotionTimeframe}
      isRewardDefinitionReadOnly={!rewardAccess.isStructureEditable}
      rewardDefinitionReadOnlyReason={rewardAccess.structureLockedReason}
      areQualifyConditionsReadOnly={!rewardAccess.isStructureEditable}
      qualifyConditionsReadOnlyReason={rewardAccess.structureLockedReason}
      isUsageConditionsReadOnly={!rewardAccess.isStructureEditable}
      usageConditionsReadOnlyReason={rewardAccess.structureLockedReason}
      rewardStatusOptions={rewardAccess.statusOptions}
      rewardWarnings={rewardAccess.warnings}
      promotionStatus={
        typeof promotionStatus === "string" ? promotionStatus : undefined
      }
      phaseStatus={typeof phaseStatus === "string" ? phaseStatus : undefined}
      showBetEntryLauncher={rewardAccess.canLaunchBetEntry}
      rewardBetEntryHref={
        rewardAccess.canLaunchBetEntry &&
        typeof currentRewardId === "string" &&
        currentRewardId.length > 0
          ? `/bets/new/from-reward/${currentRewardId}`
          : undefined
      }
      rewardBetEntryDisabledReason={rewardAccess.betEntryDisabledReason}
    />
  );
}

export function StandaloneRewardFormFields({
  isEditing,
  rewardServerData,
  anchorCatalog,
  anchorOccurrences,
  availableQualifyConditions,
  onQualifyConditionSelect,
  promotionData,
}: Omit<RewardFormSharedProps, "onRemove" | "canRemove"> & {
  promotionData?: PromotionServerModel;
}) {
  const { control, setValue } = useFormContext<RewardFormData>();
  const p = (value: Path<RewardFormData>) => value;
  const { paths, qualifyConditionsPath: _qualifyConditionsPath, usagePaths, getQualifyConditionPaths } =
    buildRewardStandalonePaths(p);

  const [selectedConditionIndex, setSelectedConditionIndex] = useState<number>();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const { removedAnchorRefs, markRemoved, unmarkRemoved } = useRemovedAnchorRefs();

  const closeDepositModal = useCallback(() => {
    setIsDepositModalOpen(false);
  }, []);

  const currentReward = useWatch({
    control,
  });

  const draftAnchorCatalog = useMemo(
    () =>
      buildRewardDraftAnchorCatalog(
        currentReward,
        `Reward - ${currentReward?.type ?? "UNKNOWN"}`
      ),
    [currentReward]
  );

  const effectiveAnchorCatalog = useMemo(
    () =>
      mergeAnchorCatalogs({
        serverCatalog: anchorCatalog,
        draftCatalog: draftAnchorCatalog,
        removedRefs: removedAnchorRefs,
      }),
    [anchorCatalog, draftAnchorCatalog, removedAnchorRefs]
  );

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

  const usageType = typeof usageTypeRaw === "string" ? usageTypeRaw : undefined;

  const {
    rewardType,
    valueType,
    qualifyConditions,
    qualifyConditionsValues,
    handleTypeChange,
    handleValueTypeChange,
    rewardHasContributingCondition,
    addQualifyCondition,
    handleQualifyConditionTypeChange,
    appendQualifyCondition,
    removeQualifyCondition,
    getQualifyConditionRemoveDisabledReason,
    canRemoveQualifyCondition,
  } = useStandaloneRewardLogic(paths, rewardServerData);

  const handleQualifyConditionSelect = useCallback(
    (_: string, index: number) => {
      const persistedConditionId = getConditionId(
        qualifyConditionsValues?.[index]
      );
      if (persistedConditionId && onQualifyConditionSelect) {
        onQualifyConditionSelect(persistedConditionId, index);
        return;
      }
      setSelectedConditionIndex(index);
      setIsDepositModalOpen(true);
    },
    [onQualifyConditionSelect, qualifyConditionsValues]
  );

  const handleAddExistingQualifyCondition = useCallback(
    (conditionId: string) => {
      const condition = availableQualifyConditions?.find(
        (item) => item.id === conditionId
      );
      if (!condition) {
        return;
      }
      const parsedCondition = QualifyConditionSchema.parse(condition);
      appendQualifyCondition(parsedCondition);
      unmarkRemoved("QUALIFY_CONDITION", conditionId);
    },
    [appendQualifyCondition, availableQualifyConditions, unmarkRemoved]
  );

  const handleRemoveQualifyCondition = useCallback(
    (index: number) => {
      const persistedConditionId = getConditionId(
        qualifyConditionsValues?.[index]
      );
      if (typeof persistedConditionId === "string") {
        markRemoved("QUALIFY_CONDITION", persistedConditionId);
      }
      removeQualifyCondition(index);
    },
    [markRemoved, qualifyConditionsValues, removeQualifyCondition]
  );

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

  const conditionPath =
    selectedConditionIndex !== undefined
      ? (`qualifyConditions.${selectedConditionIndex}` satisfies Path<RewardFormData>)
      : undefined;

  const conditionServerData =
    selectedConditionIndex !== undefined
      ? rewardServerData?.qualifyConditions?.[selectedConditionIndex]
      : undefined;
  const selectedConditionAccess = useQualifyConditionAccessLogic({
    isPersisted: Boolean(conditionServerData?.id),
    conditionId: conditionServerData?.id,
    conditionType: conditionServerData?.type,
    conditionStatus: conditionServerData?.status,
    promotion: promotionData ?? null,
    rewardStatus:
      typeof currentRewardStatus === "string" ? currentRewardStatus : undefined,
    timeframe: conditionServerData?.timeframe,
    promotionTimeframe: promotionData?.timeframe,
    anchorOccurrences,
  });

  const depositRegistrationContext = useMemo(() => {
    if (!rewardServerData?.id || !rewardServerData.promotionId) {
      return undefined;
    }

    return {
      promotionId: rewardServerData.promotionId,
      phaseId: rewardServerData.phaseId,
      rewardId: rewardServerData.id,
    };
  }, [rewardServerData?.id, rewardServerData?.phaseId, rewardServerData?.promotionId]);

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
    <>
      <RewardFormBase<
        RewardFormData,
        typeof _qualifyConditionsPath,
        typeof paths
      >
        paths={paths}
        getQualifyConditionPaths={getQualifyConditionPaths}
        usagePaths={usagePaths}
        rewardType={typeof rewardType === "string" ? rewardType : undefined}
        valueType={typeof valueType === "string" ? valueType : undefined}
        usageType={usageType}
        qualifyConditions={qualifyConditions}
        qualifyConditionsValues={qualifyConditionsValues}
        onTypeChange={handleTypeChange}
        onValueTypeChange={handleValueTypeChange}
        onAddQualifyCondition={addQualifyCondition}
        onRemoveQualifyCondition={handleRemoveQualifyCondition}
        onQualifyConditionTypeChange={handleQualifyConditionTypeChange}
        getQualifyConditionRemoveDisabledReason={getQualifyConditionRemoveDisabledReason}
        canRemoveQualifyCondition={canRemoveQualifyCondition}
        rewardHasContributingCondition={rewardHasContributingCondition}
        onRemove={() => {}}
        canRemove={false}
        removeDisabledReason={undefined}
        isEditing={isEditing}
        onQualifyConditionSelect={handleQualifyConditionSelect}
        enableQualifyConditionDirectOpen={Boolean(onQualifyConditionSelect)}
        availableQualifyConditions={availableQualifyConditions}
        onAddExistingQualifyCondition={handleAddExistingQualifyCondition}
        rewardServerData={rewardServerData}
        promotion={promotionData ?? null}
        anchorCatalog={effectiveAnchorCatalog}
        anchorOccurrences={anchorOccurrences}
        promotionTimeframe={promotionData?.timeframe}
        isRewardDefinitionReadOnly={!rewardAccess.isStructureEditable}
        rewardDefinitionReadOnlyReason={rewardAccess.structureLockedReason}
        areQualifyConditionsReadOnly={!rewardAccess.isStructureEditable}
        qualifyConditionsReadOnlyReason={rewardAccess.structureLockedReason}
        isUsageConditionsReadOnly={!rewardAccess.isStructureEditable}
        usageConditionsReadOnlyReason={rewardAccess.structureLockedReason}
        rewardStatusOptions={rewardAccess.statusOptions}
        rewardWarnings={rewardAccess.warnings}
        promotionStatus={promotionData?.status}
        phaseStatus={
          promotionData?.phases.find((phase) => phase.id === rewardServerData?.phaseId)
            ?.status
        }
        showBetEntryLauncher={false}
      />

      {conditionPath && conditionServerData?.type === "DEPOSIT" && (
        <DepositQualifyModal
          isOpen={isDepositModalOpen}
          onClose={closeDepositModal}
          conditionPath={conditionPath}
          conditionServerData={conditionServerData}
          registrationContext={depositRegistrationContext}
          canRegisterDeposit={selectedConditionAccess.canRegisterTrackingAction}
          registerDepositDisabledReason={
            selectedConditionAccess.trackingActionDisabledReason
          }
        />
      )}
    </>
  );
}

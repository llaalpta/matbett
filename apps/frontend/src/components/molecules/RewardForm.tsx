"use client";

import { QualifyConditionSchema } from "@matbett/shared";
import { useCallback, useMemo, useState } from "react";
import { Path, useFormContext, useWatch } from "react-hook-form";

import { useRemovedAnchorRefs } from "@/hooks/domain/useRemovedAnchorRefs";
import {
  usePromotionRewardLogic,
  useStandaloneRewardLogic,
} from "@/hooks/domain/useRewardLogic";
import { usePromotionRewardStatusDateSync } from "@/hooks/useStatusDateSync";
import { useStandaloneRewardStatusDateSync } from "@/hooks/useStatusDateSync";
import type {
  PromotionFormData,
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
      anchorCatalog={anchorCatalog}
      anchorOccurrences={anchorOccurrences}
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
}: Omit<RewardFormSharedProps, "onRemove" | "canRemove">) {
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
        enableQualifyConditionDirectOpen
        availableQualifyConditions={availableQualifyConditions}
        onAddExistingQualifyCondition={handleAddExistingQualifyCondition}
        rewardServerData={rewardServerData}
        anchorCatalog={effectiveAnchorCatalog}
        anchorOccurrences={anchorOccurrences}
      />

      {conditionPath && conditionServerData?.type === "DEPOSIT" && (
        <DepositQualifyModal
          isOpen={isDepositModalOpen}
          onClose={closeDepositModal}
          conditionPath={conditionPath}
          conditionServerData={conditionServerData}
        />
      )}
    </>
  );
}



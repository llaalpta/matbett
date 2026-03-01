import {
  promotionAnchorEventOptions,
  phaseAnchorEventOptions,
  rewardAnchorEventOptions,
  qualifyConditionAnchorEventOptions,
  type AnchorCatalog,
  type AnchorCatalogByType,
} from "@matbett/shared";
import { useCallback, useMemo } from "react";
import type { DeepPartial } from "react-hook-form";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { useAnchorContext } from "@/hooks/domain/useAnchorContext";
import { useRemovedAnchorRefs } from "@/hooks/domain/useRemovedAnchorRefs";
import type {
  PromotionFormData,
  PromotionServerModel,
  UsePromotionLogicReturn,
} from "@/types/hooks";
import { buildAnchorRefKey } from "@/utils/anchorCatalog";
import { buildDefaultPhase, buildDefaultPromotion } from "@/utils/formDefaults";

const promotionEvents = promotionAnchorEventOptions.map((option) => ({
  event: option.value,
  eventLabel: option.label,
}));

const phaseEvents = phaseAnchorEventOptions.map((option) => ({
  event: option.value,
  eventLabel: option.label,
}));

const rewardEvents = rewardAnchorEventOptions.map((option) => ({
  event: option.value,
  eventLabel: option.label,
}));

const qualifyEvents = qualifyConditionAnchorEventOptions.map((option) => ({
  event: option.value,
  eventLabel: option.label,
}));

const getRefData = (id?: string, clientId?: string) => {
  if (id) {
    return { entityRefType: "persisted" as const, entityRef: id };
  }
  if (clientId) {
    return { entityRefType: "client" as const, entityRef: clientId };
  }
  return null;
};

const buildDraftAnchorCatalog = (
  formValues: DeepPartial<PromotionFormData> | undefined
): AnchorCatalog => {
  if (!formValues) {
    return [];
  }

  const promotionEntities: Extract<
    AnchorCatalogByType,
    { entityType: "PROMOTION" }
  >["entities"] = [];
  const phaseEntities: Extract<
    AnchorCatalogByType,
    { entityType: "PHASE" }
  >["entities"] = [];
  const rewardEntities: Extract<
    AnchorCatalogByType,
    { entityType: "REWARD" }
  >["entities"] = [];
  const qualifyConditionEntities: Extract<
    AnchorCatalogByType,
    { entityType: "QUALIFY_CONDITION" }
  >["entities"] = [];

  const promotionRefData = getRefData(formValues.id, formValues.clientId);
  if (promotionRefData) {
    promotionEntities.push({
      entityRefType: promotionRefData.entityRefType,
      entityRef: promotionRefData.entityRef,
      entityLabel: formValues.name?.trim() || "Promocion",
      events: promotionEvents,
    });
  }

  for (const [phaseIndex, phase] of (formValues.phases ?? []).entries()) {
    if (!phase) {
      continue;
    }
    const phaseRefData = getRefData(phase.id, phase.clientId);
    if (phaseRefData) {
      phaseEntities.push({
        entityRefType: phaseRefData.entityRefType,
        entityRef: phaseRefData.entityRef,
        entityLabel: phase.name?.trim() || `Fase ${phaseIndex + 1}`,
        events: phaseEvents,
      });
    }

    for (const [rewardIndex, reward] of (phase.rewards ?? []).entries()) {
      if (!reward) {
        continue;
      }
      const rewardRefData = getRefData(reward.id, reward.clientId);
      if (rewardRefData) {
        const phaseLabel = phase.name?.trim() || `Fase ${phaseIndex + 1}`;
        rewardEntities.push({
          entityRefType: rewardRefData.entityRefType,
          entityRef: rewardRefData.entityRef,
          entityLabel: `${phaseLabel} - Reward ${rewardIndex + 1} (${reward.type})`,
          events: rewardEvents,
        });
      }

      for (const [qcIndex, qc] of (reward.qualifyConditions ?? []).entries()) {
        if (!qc) {
          continue;
        }
        const qcRefData = getRefData(qc.id, qc.clientId);
        if (qcRefData) {
          qualifyConditionEntities.push({
            entityRefType: qcRefData.entityRefType,
            entityRef: qcRefData.entityRef,
            entityLabel:
              qc.description?.trim() ||
              `Reward ${rewardIndex + 1} - QC ${qcIndex + 1} (${qc.type})`,
            events: qualifyEvents,
          });
        }
      }
    }
  }

  for (const [poolIndex, qc] of (
    formValues.availableQualifyConditions ?? []
  ).entries()) {
    if (!qc) {
      continue;
    }
    const qcRefData = getRefData(qc.id, qc.clientId);
    if (qcRefData) {
      qualifyConditionEntities.push({
        entityRefType: qcRefData.entityRefType,
        entityRef: qcRefData.entityRef,
        entityLabel:
          qc.description?.trim() || `Pool QC ${poolIndex + 1} (${qc.type})`,
        events: qualifyEvents,
      });
    }
  }

  const result: AnchorCatalog = [];
  if (promotionEntities.length > 0) {
    result.push({
      entityType: "PROMOTION",
      entityTypeLabel: "Promotion",
      entities: promotionEntities,
    });
  }
  if (phaseEntities.length > 0) {
    result.push({
      entityType: "PHASE",
      entityTypeLabel: "Phases",
      entities: phaseEntities,
    });
  }
  if (rewardEntities.length > 0) {
    result.push({
      entityType: "REWARD",
      entityTypeLabel: "Rewards",
      entities: rewardEntities,
    });
  }
  if (qualifyConditionEntities.length > 0) {
    result.push({
      entityType: "QUALIFY_CONDITION",
      entityTypeLabel: "Qualify Conditions",
      entities: qualifyConditionEntities,
    });
  }
  return result;
};

const buildDerivedRemovedRefs = (
  initialData: PromotionServerModel | undefined,
  formValues: DeepPartial<PromotionFormData> | undefined
): Set<string> => {
  if (!initialData || !formValues) {
    return new Set<string>();
  }

  const currentPhaseIds = new Set(
    (formValues.phases ?? [])
      .map((phase) => phase?.id)
      .filter(Boolean)
  );
  const currentRewardIds = new Set(
    (formValues.phases ?? [])
      .flatMap((phase) => phase?.rewards ?? [])
      .map((reward) => reward?.id)
      .filter(Boolean)
  );
  const currentQcIds = new Set(
    [
      ...(formValues.availableQualifyConditions ?? []),
      ...(formValues.phases ?? [])
        .flatMap((phase) => phase?.rewards ?? [])
        .flatMap((reward) => reward?.qualifyConditions ?? []),
    ]
      .map((qc) => qc?.id)
      .filter(Boolean)
  );

  const removed = new Set<string>();
  for (const phase of initialData.phases ?? []) {
    if (phase.id && !currentPhaseIds.has(phase.id)) {
      removed.add(buildAnchorRefKey("PHASE", "persisted", phase.id));
    }
    for (const reward of phase.rewards ?? []) {
      if (reward.id && !currentRewardIds.has(reward.id)) {
        removed.add(buildAnchorRefKey("REWARD", "persisted", reward.id));
      }
    }
  }

  for (const qc of initialData.availableQualifyConditions ?? []) {
    if (qc.id && !currentQcIds.has(qc.id)) {
      removed.add(buildAnchorRefKey("QUALIFY_CONDITION", "persisted", qc.id));
    }
  }

  for (const phase of initialData.phases ?? []) {
    for (const reward of phase.rewards ?? []) {
      for (const qc of reward.qualifyConditions ?? []) {
        if (qc.id && !currentQcIds.has(qc.id)) {
          removed.add(buildAnchorRefKey("QUALIFY_CONDITION", "persisted", qc.id));
        }
      }
    }
  }

  return removed;
};

export const usePromotionLogic = (
  initialData?: PromotionServerModel
): UsePromotionLogicReturn => {
  const { control, setValue, getValues, reset } =
    useFormContext<PromotionFormData>();
  const formValues = useWatch({ control });
  const phasesValues = useWatch({ control, name: "phases" });
  const { removedAnchorRefs, resetRemoved } = useRemovedAnchorRefs();

  const phasesFieldArray = useFieldArray({
    control,
    name: "phases",
  });

  const cardinality = useWatch({ control, name: "cardinality" });
  const isSinglePhase = cardinality === "SINGLE";

  const syncPromotionToPhase0 = useCallback(() => {
    if (phasesFieldArray.fields.length <= 0) {
      return;
    }

    const data = getValues();
    if (data.name !== undefined && data.name !== null) {
      setValue("phases.0.name", data.name, { shouldValidate: true, shouldDirty: true });
    }
    if (data.description !== undefined && data.description !== null) {
      setValue("phases.0.description", data.description, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (data.timeframe !== undefined && data.timeframe !== null) {
      setValue("phases.0.timeframe", data.timeframe, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    if (data.status !== undefined && data.status !== null) {
      setValue("phases.0.status", data.status, { shouldValidate: true, shouldDirty: true });
    }
    if (data.activationMethod !== undefined && data.activationMethod !== null) {
      setValue("phases.0.activationMethod", data.activationMethod, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [phasesFieldArray.fields.length, setValue, getValues]);

  const removeAdditionalPhases = useCallback(() => {
    if (phasesFieldArray.fields.length <= 1) {
      return;
    }

    const firstPhase = getValues("phases.0");
    phasesFieldArray.replace([firstPhase]);
  }, [getValues, phasesFieldArray]);

  const handleCardinalityChange = useCallback(
    (value: "SINGLE" | "MULTIPLE") => {
      if (value === "SINGLE") {
        syncPromotionToPhase0();
        removeAdditionalPhases();
      }
    },
    [removeAdditionalPhases, syncPromotionToPhase0]
  );

  const addPhase = useCallback(() => {
    phasesFieldArray.append(buildDefaultPhase());
  }, [phasesFieldArray]);

  const removePhase = useCallback(
    (index: number) => {
      const phase = getValues(`phases.${index}`);
      if ((phase?.rewards?.length ?? 0) > 0) {
        return;
      }
      phasesFieldArray.remove(index);
    },
    [getValues, phasesFieldArray]
  );

  const hasDataInAdditionalPhases = useCallback(() => {
    return phasesFieldArray.fields.slice(1).some((_, index) => {
      const actualIndex = index + 1;
      const phase = getValues(`phases.${actualIndex}`);
      return (
        (phase?.name && phase.name !== "") ||
        (phase?.description && phase.description !== "") ||
        (phase?.rewards && phase.rewards.length > 0)
      );
    });
  }, [phasesFieldArray.fields, getValues]);

  const canRemovePhase = useCallback(
    (index: number) => {
      if (phasesFieldArray.fields.length <= 1) {
        return false;
      }
      const hasDraftRewards = (phasesValues?.[index]?.rewards?.length ?? 0) > 0;
      if (hasDraftRewards) {
        return false;
      }
      return initialData?.phases?.[index]?.canDelete ?? true;
    },
    [initialData?.phases, phasesFieldArray.fields.length, phasesValues]
  );

  const getPhaseRemoveDisabledReason = useCallback(
    (index: number) => {
      const hasDraftRewards = (phasesValues?.[index]?.rewards?.length ?? 0) > 0;
      const serverCanDelete = initialData?.phases?.[index]?.canDelete ?? true;
      if (hasDraftRewards || !serverCanDelete) {
        return "No se puede eliminar porque tiene dependencias.";
      }
      return undefined;
    },
    [initialData?.phases, phasesValues]
  );

  const resetFormToDefaults = useCallback(() => {
    reset(buildDefaultPromotion(initialData));
    resetRemoved();
  }, [reset, initialData, resetRemoved]);

  const draftAnchorCatalog = useMemo(
    () => buildDraftAnchorCatalog(formValues),
    [formValues]
  );

  const derivedRemovedAnchorRefs = useMemo(
    () => buildDerivedRemovedRefs(initialData, formValues),
    [formValues, initialData]
  );

  const effectiveRemovedAnchorRefs = useMemo(() => {
    const next = new Set<string>(removedAnchorRefs);
    for (const ref of derivedRemovedAnchorRefs) {
      next.add(ref);
    }
    return next;
  }, [derivedRemovedAnchorRefs, removedAnchorRefs]);

  const { anchorCatalog, anchorOccurrences } = useAnchorContext({
    promotionId: initialData?.id,
    draftCatalog: draftAnchorCatalog,
    removedRefs: effectiveRemovedAnchorRefs,
  });

  const handleNameChange = useCallback(
    (value: string | number | undefined) => {
      if (isSinglePhase) {
        setValue("phases.0.name", String(value || ""), {
          shouldValidate: true,
        });
      }
    },
    [isSinglePhase, setValue]
  );

  const handleDescriptionChange = useCallback(
    (value: string | undefined) => {
      if (isSinglePhase) {
        setValue("phases.0.description", value || "", {
          shouldValidate: true,
        });
      }
    },
    [isSinglePhase, setValue]
  );

  return {
    phasesFieldArray,
    addPhase,
    removePhase,
    isSinglePhase,
    hasDataInAdditionalPhases,
    canRemovePhase,
    getPhaseRemoveDisabledReason,
    handleCardinalityChange,
    removeAdditionalPhases,
    resetFormToDefaults,
    anchorCatalog,
    anchorOccurrences,
    handleNameChange,
    handleDescriptionChange,
  };
};


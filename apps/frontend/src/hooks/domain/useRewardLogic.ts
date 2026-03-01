import type { QualifyConditionType } from "@matbett/shared";
import { useCallback, useMemo } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import type { RewardFormPaths } from "@/components/molecules/RewardFormBase";
import type {
  PromotionFormData,
  RewardFormData,
  RewardQualifyConditionFormData,
  RewardServerModel,
} from "@/types/hooks";
import {
  buildDefaultQualifyCondition,
  buildDefaultReward,
} from "@/utils/formDefaults";
import { getFilteredQualifyConditionOptions } from "@/utils/rewardUtils";

type PromotionRewardPaths = RewardFormPaths<
  PromotionFormData,
  `phases.${number}.rewards.${number}.qualifyConditions`
> & {
  reward: `phases.${number}.rewards.${number}`;
};

type StandaloneRewardPaths = RewardFormPaths<
  RewardFormData,
  "qualifyConditions"
>;

const isRewardQualifyCondition = (
  value: unknown
): value is RewardQualifyConditionFormData =>
  typeof value === "object" &&
  value !== null &&
  "type" in value &&
  "conditions" in value;

const parseRewardValueType = (
  value: unknown
): RewardFormData["valueType"] | undefined =>
  value === "FIXED" || value === "CALCULATED_FROM_CONDITIONS"
    ? value
    : undefined;

const hasContributingCondition = (values: unknown): boolean => {
  if (!Array.isArray(values)) {
    return false;
  }

  return values.some((condition) => {
    if (!isRewardQualifyCondition(condition)) {
      return false;
    }
    if (condition.type === "DEPOSIT" || condition.type === "BET") {
      return condition.conditions.contributesToRewardValue === true;
    }
    return false;
  });
};

const getContributesToRewardValue = (
  condition: RewardQualifyConditionFormData
): boolean => {
  if (condition.type === "DEPOSIT" || condition.type === "BET") {
    return condition.conditions.contributesToRewardValue === true;
  }
  return false;
};

const getQualifyConditionRemoveBlockedReason = (
  rewardServerData: RewardServerModel | undefined,
  conditionIndex: number
) => {
  const serverCanDelete =
    rewardServerData?.qualifyConditions?.[conditionIndex]?.canDelete ?? true;
  const genericReason = "No se puede eliminar porque tiene dependencias.";
  if (!serverCanDelete) {
    return genericReason;
  }

  return undefined;
};

const getDefaultQualifyConditionTypeForReward = (
  rewardType: unknown
): QualifyConditionType => {
  const options =
    typeof rewardType === "string"
      ? getFilteredQualifyConditionOptions(rewardType)
      : getFilteredQualifyConditionOptions();

  const firstOption = options[0]?.value;
  if (
    firstOption === "DEPOSIT" ||
    firstOption === "BET" ||
    firstOption === "LOSSES_CASHBACK"
  ) {
    return firstOption;
  }

  return "DEPOSIT";
};

function useRewardValueTypeSync(params: {
  qualifyConditionsValues: unknown;
  updateQualifyCondition: (
    index: number,
    value: RewardQualifyConditionFormData
  ) => void;
}) {
  const { qualifyConditionsValues, updateQualifyCondition } = params;

  return useCallback(
    (newValueType: RewardFormData["valueType"]) => {
      if (!Array.isArray(qualifyConditionsValues)) {
        return;
      }

      qualifyConditionsValues.forEach((condition, index) => {
        if (!isRewardQualifyCondition(condition)) {
          return;
        }
        if (condition.type !== "DEPOSIT" && condition.type !== "BET") {
          return;
        }

        const contributesToRewardValue =
          newValueType === "CALCULATED_FROM_CONDITIONS"
            ? (condition.conditions.contributesToRewardValue ?? false)
            : false;

        const nextCondition = buildDefaultQualifyCondition(
          condition.type,
          contributesToRewardValue
        );

        Object.assign(nextCondition, {
          id: condition.id,
          clientId: condition.clientId,
          description: condition.description,
          timeframe: condition.timeframe,
        });

        if (condition.type === "DEPOSIT") {
          Object.assign(nextCondition.conditions, {
            depositCode: condition.conditions.depositCode,
            firstDepositOnly: condition.conditions.firstDepositOnly,
            otherRestrictions: condition.conditions.otherRestrictions,
          });
        } else if (condition.type === "BET") {
          Object.assign(nextCondition.conditions, {
            otherRestrictions: condition.conditions.otherRestrictions,
          });
        }

        updateQualifyCondition(index, nextCondition);
      });
    },
    [qualifyConditionsValues, updateQualifyCondition]
  );
}

function useQualifyConditionTypeSync(params: {
  qualifyConditionsValues: unknown;
  valueType: RewardFormData["valueType"] | undefined;
  updateQualifyCondition: (
    index: number,
    value: RewardQualifyConditionFormData
  ) => void;
}) {
  const { qualifyConditionsValues, valueType, updateQualifyCondition } = params;

  return useCallback(
    (index: number, newType: QualifyConditionType) => {
      const currentCondition = Array.isArray(qualifyConditionsValues)
        ? qualifyConditionsValues[index]
        : undefined;

      if (!isRewardQualifyCondition(currentCondition)) {
        updateQualifyCondition(index, buildDefaultQualifyCondition(newType));
        return;
      }

      const canContribute =
        valueType === "CALCULATED_FROM_CONDITIONS" &&
        (newType === "DEPOSIT" || newType === "BET");
      const contributesToRewardValue = canContribute
        ? getContributesToRewardValue(currentCondition)
        : false;

      const nextCondition = buildDefaultQualifyCondition(
        newType,
        contributesToRewardValue
      );

      // Al cambiar de tipo, reseteamos la configuración al default del nuevo tipo.
      // Solo preservamos identidad para mantener la referencia del item en edición.
      nextCondition.id = currentCondition.id;
      nextCondition.clientId = currentCondition.clientId;

      updateQualifyCondition(index, nextCondition);
    },
    [qualifyConditionsValues, updateQualifyCondition, valueType]
  );
}

export function usePromotionRewardLogic(
  paths: PromotionRewardPaths,
  rewardServerData?: RewardServerModel
) {
  const { control, getValues, setValue } = useFormContext<PromotionFormData>();

  const {
    fields: qualifyConditions,
    append: appendQualifyCondition,
    remove: removeQualifyCondition,
    update: updateQualifyCondition,
    replace: replaceQualifyConditions,
  } = useFieldArray({
    control,
    name: paths.qualifyConditions,
  });

  const rewardType = useWatch({ control, name: paths.type });
  const valueType = parseRewardValueType(
    useWatch({ control, name: paths.valueType })
  );
  const qualifyConditionsValues = useWatch({
    control,
    name: paths.qualifyConditions,
  });

  const addQualifyCondition = useCallback(() => {
    const defaultType = getDefaultQualifyConditionTypeForReward(rewardType);
    appendQualifyCondition(buildDefaultQualifyCondition(defaultType));
  }, [appendQualifyCondition, rewardType]);

  const handleTypeChange = useCallback(
    (newType: RewardFormData["type"]) => {
      const defaults = buildDefaultReward(newType);
      const currentReward = getValues(paths.reward);

      // Importante: limpiar explícitamente el field array para evitar filas "fantasma"
      // cuando se cambia el tipo de reward.
      replaceQualifyConditions([]);

      setValue(
        paths.reward,
        {
          ...defaults,
          id: currentReward?.id,
          clientId: currentReward?.clientId ?? defaults.clientId,
        },
        { shouldDirty: true }
      );
    },
    [getValues, paths.reward, replaceQualifyConditions, setValue]
  );

  const syncConditionsByValueType = useRewardValueTypeSync({
    qualifyConditionsValues,
    updateQualifyCondition,
  });

  const handleValueTypeChange = useCallback(
    (newValueType: RewardFormData["valueType"]) => {
      setValue(paths.valueType, newValueType, { shouldDirty: true });
      syncConditionsByValueType(newValueType);
    },
    [paths.valueType, setValue, syncConditionsByValueType]
  );

  const handleQualifyConditionTypeChange = useQualifyConditionTypeSync({
    qualifyConditionsValues,
    valueType,
    updateQualifyCondition,
  });

  const getQualifyConditionRemoveDisabledReason = useCallback(
    (conditionIndex: number) =>
      getQualifyConditionRemoveBlockedReason(
        rewardServerData,
        conditionIndex
      ),
    [rewardServerData]
  );

  const canRemoveQualifyCondition = useCallback(
    (conditionIndex: number) =>
      !getQualifyConditionRemoveBlockedReason(
        rewardServerData,
        conditionIndex
      ),
    [rewardServerData]
  );

  return {
    rewardType,
    valueType,
    qualifyConditions,
    qualifyConditionsValues,
    handleTypeChange,
    handleValueTypeChange,
    rewardHasContributingCondition: useMemo(
      () => hasContributingCondition(qualifyConditionsValues),
      [qualifyConditionsValues]
    ),
    addQualifyCondition,
    appendQualifyCondition,
    removeQualifyCondition,
    updateQualifyCondition,
    handleQualifyConditionTypeChange,
    getQualifyConditionRemoveDisabledReason,
    canRemoveQualifyCondition,
  };
}

export function useStandaloneRewardLogic(
  paths: StandaloneRewardPaths,
  rewardServerData?: RewardServerModel
) {
  const { control, getValues, reset, setValue } =
    useFormContext<RewardFormData>();

  const {
    fields: qualifyConditions,
    append: appendQualifyCondition,
    remove: removeQualifyCondition,
    update: updateQualifyCondition,
    replace: replaceQualifyConditions,
  } = useFieldArray({
    control,
    name: paths.qualifyConditions,
  });

  const rewardType = useWatch({ control, name: paths.type });
  const valueType = parseRewardValueType(
    useWatch({ control, name: paths.valueType })
  );
  const qualifyConditionsValues = useWatch({
    control,
    name: paths.qualifyConditions,
  });

  const addQualifyCondition = useCallback(() => {
    const defaultType = getDefaultQualifyConditionTypeForReward(rewardType);
    appendQualifyCondition(buildDefaultQualifyCondition(defaultType));
  }, [appendQualifyCondition, rewardType]);

  const handleTypeChange = useCallback(
    (newType: RewardFormData["type"]) => {
      const defaults = buildDefaultReward(newType);
      const currentReward = getValues();

      // Misma limpieza explícita en standalone para mantener sincronía con useFieldArray.
      replaceQualifyConditions([]);

      reset({
        ...defaults,
        id: currentReward.id,
        clientId: currentReward.clientId ?? defaults.clientId,
      });
    },
    [getValues, replaceQualifyConditions, reset]
  );

  const syncConditionsByValueType = useRewardValueTypeSync({
    qualifyConditionsValues,
    updateQualifyCondition,
  });

  const handleValueTypeChange = useCallback(
    (newValueType: RewardFormData["valueType"]) => {
      setValue(paths.valueType, newValueType, { shouldDirty: true });
      syncConditionsByValueType(newValueType);
    },
    [paths.valueType, setValue, syncConditionsByValueType]
  );

  const handleQualifyConditionTypeChange = useQualifyConditionTypeSync({
    qualifyConditionsValues,
    valueType,
    updateQualifyCondition,
  });

  const getQualifyConditionRemoveDisabledReason = useCallback(
    (conditionIndex: number) =>
      getQualifyConditionRemoveBlockedReason(
        rewardServerData,
        conditionIndex
      ),
    [rewardServerData]
  );

  const canRemoveQualifyCondition = useCallback(
    (conditionIndex: number) =>
      !getQualifyConditionRemoveBlockedReason(
        rewardServerData,
        conditionIndex
      ),
    [rewardServerData]
  );

  return {
    rewardType,
    valueType,
    qualifyConditions,
    qualifyConditionsValues,
    handleTypeChange,
    handleValueTypeChange,
    rewardHasContributingCondition: useMemo(
      () => hasContributingCondition(qualifyConditionsValues),
      [qualifyConditionsValues]
    ),
    addQualifyCondition,
    appendQualifyCondition,
    removeQualifyCondition,
    updateQualifyCondition,
    handleQualifyConditionTypeChange,
    getQualifyConditionRemoveDisabledReason,
    canRemoveQualifyCondition,
  };
}

import type { QualifyConditionType } from "@matbett/shared";
import { useCallback } from "react";
import {
  FieldValues,
  Path,
  useFormContext,
  useWatch,
} from "react-hook-form";

import { getFilteredQualifyConditionOptions } from "@/utils/rewardUtils";

const isQualifyConditionType = (value: string): value is QualifyConditionType =>
  value === "DEPOSIT" || value === "BET" || value === "LOSSES_CASHBACK";

interface QualifyConditionLogicPaths<T extends FieldValues> {
  typePath: Path<T>;
  rewardType?: string;
}

export function useQualifyConditionLogic<T extends FieldValues>(
  paths: QualifyConditionLogicPaths<T>
) {
  const { control } = useFormContext<T>();

  const conditionType = useWatch({
    control,
    name: paths.typePath,
  });

  const availableConditionOptions = getFilteredQualifyConditionOptions(
    paths.rewardType
  );

  const getValidConditionType = useCallback(
    (newType: string) => {
      if (!isQualifyConditionType(newType)) {
        return undefined;
      }
      return newType;
    },
    []
  );

  return {
    conditionType,
    availableConditionOptions,
    getValidConditionType,
  };
}

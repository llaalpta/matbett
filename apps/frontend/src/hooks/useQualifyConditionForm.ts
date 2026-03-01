import { zodResolver } from "@hookform/resolvers/zod";
import { QualifyConditionSchema } from "@matbett/shared";
import { useEffect, useMemo } from "react";
import { useForm, UseFormReturn } from "react-hook-form";

import type {
  RewardQualifyConditionFormData,
  RewardQualifyConditionServerModel,
} from "@/types/hooks";
import { buildDefaultQualifyCondition } from "@/utils/formDefaults";

export const useQualifyConditionForm = (
  initialData?: RewardQualifyConditionServerModel
): UseFormReturn<RewardQualifyConditionFormData> => {
  const defaultValues = useMemo(
    () =>
      buildDefaultQualifyCondition(initialData?.type ?? "DEPOSIT", initialData),
    [initialData]
  );

  const form = useForm<RewardQualifyConditionFormData>({
    resolver: zodResolver(QualifyConditionSchema),
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const { reset } = form;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return form;
};

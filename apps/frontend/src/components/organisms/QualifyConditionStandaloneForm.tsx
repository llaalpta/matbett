"use client";

import { FormProvider, Path } from "react-hook-form";

import { ApiErrorBanner, ValidationErrorBanner } from "@/components/feedback";
import { buildQualifyConditionStandalonePaths } from "@/components/molecules/qualifyCondition.paths";
import { QualifyConditionForm } from "@/components/molecules/QualifyConditionForm";
import { Button } from "@/components/ui/button";
import { useQualifyConditionStandaloneLogic } from "@/hooks/domain/qualifyConditions/useQualifyConditionStandaloneLogic";
import { useApiErrorMessage } from "@/hooks/useApiErrorMessage";
import { useApiSuccessToast } from "@/hooks/useApiSuccessToast";
import { useFormInvalidSubmitFocus } from "@/hooks/useFormInvalidSubmitFocus";
import { useQualifyConditionForm } from "@/hooks/useQualifyConditionForm";
import type {
  PromotionServerModel,
  RewardQualifyConditionFormData,
  RewardQualifyConditionServerModel,
} from "@/types/hooks";

interface QualifyConditionStandaloneFormProps {
  promotionId?: string;
  promotionData?: PromotionServerModel;
  initialData?: RewardQualifyConditionServerModel;
  onSubmit: (data: RewardQualifyConditionFormData) => Promise<void> | void;
  isSubmitting?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  successMessage?: string;
  errorMessage?: string;
}

export function QualifyConditionStandaloneForm({
  promotionId,
  promotionData,
  initialData,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Guardar cambios",
  submittingLabel = "Guardando...",
  successMessage = "Condicion de calificacion actualizada.",
  errorMessage = "No se pudo actualizar la condicion de calificacion.",
}: QualifyConditionStandaloneFormProps) {
  const form = useQualifyConditionForm(initialData);
  const { formRef, validationBannerRef, focusFirstInvalidField } =
    useFormInvalidSubmitFocus();
  const { apiErrorMessage, clearApiError, setApiError } = useApiErrorMessage();
  const { notifySuccess } = useApiSuccessToast();
  const p = (value: Path<RewardQualifyConditionFormData>) => value;
  const paths = buildQualifyConditionStandalonePaths(p);

  const { anchorCatalog, anchorOccurrences } = useQualifyConditionStandaloneLogic(
    {
      control: form.control,
      promotionId,
    }
  );

  const handleSubmit = async (data: RewardQualifyConditionFormData) => {
    clearApiError();
    try {
      await onSubmit(data);
      notifySuccess(successMessage);
    } catch (error) {
      setApiError(error, errorMessage);
    }
  };

  return (
    <FormProvider {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(handleSubmit, focusFirstInvalidField)}
        className="space-y-6"
      >
        <ValidationErrorBanner<RewardQualifyConditionFormData>
          errors={form.formState.errors}
          submitCount={form.formState.submitCount}
          containerRef={validationBannerRef}
          mode="generic"
          onDismiss={() => form.clearErrors()}
        />
        <ApiErrorBanner
          errorMessage={apiErrorMessage}
          onDismissError={clearApiError}
        />

        <QualifyConditionForm<RewardQualifyConditionFormData>
          paths={paths}
          conditionId={initialData?.id}
          conditionServerData={initialData}
          onRemove={() => {}}
          canRemove={false}
          isEditing={Boolean(initialData?.id)}
          anchorCatalog={anchorCatalog}
          anchorOccurrences={anchorOccurrences}
          promotionTimeframe={promotionData?.timeframe}
          promotion={promotionData ?? null}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </form>
    </FormProvider>
  );
}

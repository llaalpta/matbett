"use client";

import { FormProvider, Path } from "react-hook-form";

import { ApiErrorBanner, ValidationErrorBanner } from "@/components/feedback";
import { FormActionBar } from "@/components/molecules/FormActionBar";
import { buildQualifyConditionStandalonePaths } from "@/components/molecules/qualifyCondition.paths";
import { QualifyConditionForm } from "@/components/molecules/QualifyConditionForm";
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
  successMessage = "Condición de calificación actualizada.",
  errorMessage = "No se pudo actualizar la condición de calificación.",
}: QualifyConditionStandaloneFormProps) {
  const form = useQualifyConditionForm(initialData);
  const { formRef, validationBannerRef, focusFirstInvalidField } =
    useFormInvalidSubmitFocus();
  const { apiErrorMessage, clearApiError, setApiError } = useApiErrorMessage();
  const { notifySuccess } = useApiSuccessToast();
  const p = (value: Path<RewardQualifyConditionFormData>) => value;
  const paths = buildQualifyConditionStandalonePaths(p);
  const primaryLinkedReward = initialData?.linkedRewards?.[0];

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
        className="space-y-6 pb-24"
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
          rewardStatus={primaryLinkedReward?.status}
          promotionStatus={primaryLinkedReward?.promotionStatus}
          phaseStatus={primaryLinkedReward?.phaseStatus}
        />

        <FormActionBar
          onDiscard={() => form.reset()}
          isLoading={isSubmitting}
          showBackButton
          backHref="/qualify-conditions"
          backToLabel="Volver a condiciones"
          saveLabel={submitLabel}
          discardLabel="Descartar"
        />
      </form>
    </FormProvider>
  );
}

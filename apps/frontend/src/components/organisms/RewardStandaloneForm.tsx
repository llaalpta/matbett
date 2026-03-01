"use client";

import { FormProvider } from "react-hook-form";

import { ApiErrorBanner, ValidationErrorBanner } from "@/components/feedback";
import { StandaloneRewardFormFields } from "@/components/molecules/RewardForm";
import { Button } from "@/components/ui/button";
import { useAvailableQualifyConditions } from "@/hooks/api/usePromotions";
import { useReward, useUpdateReward } from "@/hooks/api/useRewards";
import { useAnchorContext } from "@/hooks/domain/useAnchorContext";
import { useApiErrorMessage } from "@/hooks/useApiErrorMessage";
import { useApiSuccessToast } from "@/hooks/useApiSuccessToast";
import { useFormInvalidSubmitFocus } from "@/hooks/useFormInvalidSubmitFocus";
import { useRewardForm } from "@/hooks/useRewardForm";
import type { RewardFormData } from "@/types/hooks";

interface RewardStandaloneFormProps {
  rewardId?: string;
  onSuccess?: () => void;
}

export function RewardStandaloneForm({
  rewardId,
  onSuccess,
}: RewardStandaloneFormProps) {
  const { data: rewardData, isLoading: isLoadingReward } = useReward(rewardId);
  const updateRewardMutation = useUpdateReward();
  const { apiErrorMessage, clearApiError, setApiError } = useApiErrorMessage();
  const { notifySuccess } = useApiSuccessToast();

  const {
    anchorCatalog,
    anchorOccurrences,
    isLoadingAnchorCatalog,
    isLoadingAnchorOccurrences,
  } = useAnchorContext({
    promotionId: rewardData?.promotionId,
  });
  const { data: availableQualifyConditions } = useAvailableQualifyConditions(
    rewardData?.promotionId
  );

  const form = useRewardForm(rewardData ?? undefined);
  const { formRef, validationBannerRef, focusFirstInvalidField } =
    useFormInvalidSubmitFocus();

  const onSubmit = async (data: RewardFormData) => {
    if (!rewardId) {
      return;
    }
    clearApiError();
    try {
      await updateRewardMutation.mutateAsync({ id: rewardId, data });
      notifySuccess("Recompensa actualizada.");
      onSuccess?.();
    } catch (error) {
      setApiError(error, "No se pudo actualizar la recompensa.");
    }
  };

  const isSubmitting = updateRewardMutation.isPending;
  const isLoading =
    isLoadingReward || isLoadingAnchorCatalog || isLoadingAnchorOccurrences;

  if (isLoading) {
    return <p>Cargando datos de la recompensa...</p>;
  }

  return (
    <FormProvider {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit, focusFirstInvalidField)}
        className="space-y-6"
      >
        <ValidationErrorBanner<RewardFormData>
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

        <StandaloneRewardFormFields
          isEditing={Boolean(rewardId)}
          rewardServerData={rewardData ?? undefined}
          anchorCatalog={anchorCatalog}
          anchorOccurrences={anchorOccurrences}
          availableQualifyConditions={availableQualifyConditions}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>
    </FormProvider>
  );
}

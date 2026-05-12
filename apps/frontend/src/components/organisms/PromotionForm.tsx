import React, { useEffect, useRef, useState } from "react";
import { FormProvider, useFormContext, useWatch } from "react-hook-form";

import { TypographyH2 } from "@/components/atoms";
import { ConfirmDialog } from "@/components/atoms/ConfirmDialog";
import { ApiErrorBanner, ValidationErrorBanner } from "@/components/feedback";
import { PhaseForm, PromotionBasicInfoForm } from "@/components/molecules";
import { FormActionBar } from "@/components/molecules/FormActionBar";
import { PhaseRewardsTable } from "@/components/molecules/promotions/PhaseRewardsTable";
import { Button } from "@/components/ui/button";
import { usePhaseAccessLogic } from "@/hooks/domain/promotions/usePhaseAccessLogic";
import { usePromotionLogic } from "@/hooks/domain/promotions/usePromotionLogic";
import { useFormInvalidSubmitFocus } from "@/hooks/useFormInvalidSubmitFocus";
import {
  normalizePromotionSubmitData,
  usePromotionForm,
} from "@/hooks/usePromotionForm";
import type { PromotionFormData, PromotionServerModel } from "@/types/hooks";

interface PromotionFormProps {
  initialData?: PromotionServerModel;
  onSubmit?: (data: PromotionFormData) => void;
  isLoading?: boolean;
  promotionId?: string;
  apiErrorMessage?: string | null;
  onDismissApiError?: () => void;
  showBackButton?: boolean;
  backHref?: string;
  backToLabel?: string;
}

type SinglePhaseRewardsSectionProps = {
  initialData?: PromotionServerModel;
  promotionId?: string;
  anchorOccurrences: ReturnType<typeof usePromotionLogic>["anchorOccurrences"];
};

function SinglePhaseRewardsSection({
  initialData,
  promotionId,
  anchorOccurrences,
}: SinglePhaseRewardsSectionProps) {
  const { control } = useFormContext<PromotionFormData>();
  const promotionStatus = useWatch({ control, name: "status" });
  const promotionTimeframe = useWatch({ control, name: "timeframe" });
  const phaseRewards = useWatch({ control, name: "phases.0.rewards" });
  const phaseServerData = initialData?.phases?.[0];
  const phaseAccess = usePhaseAccessLogic({
    isPersisted: Boolean(phaseServerData?.id),
    promotionStatus,
    phaseStatus: promotionStatus,
    timeframe: promotionTimeframe,
    promotionTimeframe,
    anchorOccurrences,
    rewards: phaseRewards,
  });
  const canAddReward =
    Boolean(promotionId && phaseServerData?.id) && phaseAccess.isStructureEditable;
  const addRewardDisabledReason =
    !phaseServerData?.id
      ? "Guarda la promoción primero para añadir recompensas."
      : phaseAccess.structureLockedReason;

  return (
    <div className="mt-6 border-t pt-6">
      <PhaseRewardsTable
        rewards={phaseServerData?.rewards ?? []}
        phaseId={phaseServerData?.id}
        promotionId={promotionId}
        canAddReward={canAddReward}
        addRewardDisabledReason={addRewardDisabledReason}
        title="Recompensas de la promoción"
        description={
          phaseServerData?.rewards?.length
            ? `${phaseServerData.rewards.length} recompensa${phaseServerData.rewards.length === 1 ? "" : "s"} persistida${phaseServerData.rewards.length === 1 ? "" : "s"}.`
            : "La promoción todavía no tiene recompensas persistidas."
        }
        emptyDescription="Guarda la promoción y añade una recompensa desde este contexto."
      />
    </div>
  );
}

const PromotionFormContent: React.FC<PromotionFormProps> = ({
  initialData,
  onSubmit,
  isLoading,
  promotionId,
  apiErrorMessage,
  onDismissApiError,
  showBackButton = false,
  backHref,
  backToLabel,
}) => {
  const isEditing = !!promotionId;
  const {
    handleSubmit,
    clearErrors,
    formState: { errors, submitCount },
  } = useFormContext<PromotionFormData>();
  const { formRef, validationBannerRef, focusFirstInvalidField } =
    useFormInvalidSubmitFocus();

  const {
    phasesFieldArray,
    isSinglePhase,
    addPhase,
    removePhase,
    resetFormToDefaults,
    handleCardinalityChange,
    canRemovePhase,
    getPhaseRemoveDisabledReason,
    hasDataInAdditionalPhases,
    handleNameChange,
    handleDescriptionChange,
    anchorCatalog,
    anchorOccurrences,
  } = usePromotionLogic(initialData);

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const pendingSinglePhaseValueRef = useRef<
    PromotionFormData["cardinality"] | null
  >(null);

  const handleSinglePhaseChange = (
    value: PromotionFormData["cardinality"]
  ) => {
      if (value === "SINGLE" && !isSinglePhase && hasDataInAdditionalPhases()) {
        pendingSinglePhaseValueRef.current = value;
        setShowConfirmDialog(true);
        return;
      }
      handleCardinalityChange(value);
  };

  const handleConfirmToggle = () => {
    if (pendingSinglePhaseValueRef.current) {
      handleCardinalityChange(pendingSinglePhaseValueRef.current);
      pendingSinglePhaseValueRef.current = null;
    }
    setShowConfirmDialog(false);
  };

  const handleConfirmDialogOpenChange = (open: boolean) => {
    if (!open) {
      pendingSinglePhaseValueRef.current = null;
    }
    setShowConfirmDialog(open);
  };

  const onFormSubmit = (data: PromotionFormData) => {
    const processedData = normalizePromotionSubmitData(data);
    onSubmit?.(processedData);
  };

  const activePhaseIndex = Math.min(
    phaseIndex,
    Math.max(phasesFieldArray.fields.length - 1, 0)
  );

  useEffect(() => {
    if (activePhaseIndex !== phaseIndex) {
      setPhaseIndex(activePhaseIndex);
    }
  }, [activePhaseIndex, phaseIndex]);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit(onFormSubmit, focusFirstInvalidField)}
      className="space-y-6 pb-24"
      noValidate
    >
      <ValidationErrorBanner<PromotionFormData>
        errors={errors}
        submitCount={submitCount}
        containerRef={validationBannerRef}
        mode="all"
        onDismiss={() => clearErrors()}
      />
      <ApiErrorBanner
        errorMessage={apiErrorMessage}
        onDismissError={onDismissApiError}
      />

      <div className="space-y-4">
        <PromotionBasicInfoForm
          onSinglePhaseChange={handleSinglePhaseChange}
          onNameChange={handleNameChange}
          onDescriptionChange={handleDescriptionChange}
          serverData={initialData}
        />

        {isSinglePhase && (
          <SinglePhaseRewardsSection
            initialData={initialData}
            promotionId={promotionId}
            anchorOccurrences={anchorOccurrences}
          />
        )}
      </div>

      {!isSinglePhase && (
        <div className="space-y-4">
          <div className="flex flex-row items-center justify-between">
            <TypographyH2>Fases de la promoción</TypographyH2>
            <Button type="button" variant="outline" onClick={addPhase}>
              + Añadir fase
            </Button>
          </div>

          <div className="space-y-5">
            {phasesFieldArray.fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border bg-card p-4">
                <PhaseForm
                  phaseIndex={index}
                  onRemove={
                    canRemovePhase(index)
                      ? () => removePhase(index)
                      : undefined
                  }
                  removeDisabledReason={getPhaseRemoveDisabledReason(index)}
                  anchorCatalog={anchorCatalog}
                  anchorOccurrences={anchorOccurrences}
                  phaseServerData={initialData?.phases?.[index]}
                  promotionId={promotionId}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <FormActionBar
        onDiscard={resetFormToDefaults}
        isLoading={isLoading}
        showBackButton={showBackButton}
        backHref={backHref}
        backToLabel={backToLabel}
        saveLabel={isEditing ? "Actualizar promoción" : "Registrar Promoción"}
        discardLabel="Descartar"
      />

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={handleConfirmDialogOpenChange}
        title="Cambiar a fase única"
        description="Se eliminaran las fases adicionales. Continuar?"
        confirmText="Si"
        cancelText="Cancelar"
        onConfirm={handleConfirmToggle}
      />

    </form>
  );
};

export const PromotionForm: React.FC<PromotionFormProps> = (props) => {
  const form = usePromotionForm(props.initialData);

  return (
    <FormProvider {...form}>
      <PromotionFormContent {...props} />
    </FormProvider>
  );
};

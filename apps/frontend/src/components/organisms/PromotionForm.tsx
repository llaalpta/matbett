import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormProvider, Path, useFormContext } from "react-hook-form";

import { TypographyH2 } from "@/components/atoms";
import { ConfirmDialog } from "@/components/atoms/ConfirmDialog";
import { ApiErrorBanner, ValidationErrorBanner } from "@/components/feedback";
import {
  DepositQualifyModal,
  PhaseForm,
  PromotionBasicInfoForm,
} from "@/components/molecules";
import { FormActionBar } from "@/components/molecules/FormActionBar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePromotionLogic } from "@/hooks/domain/usePromotionLogic";
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
  const [selectedRewardIndex, setSelectedRewardIndex] = useState<number>();
  const [selectedConditionIndex, setSelectedConditionIndex] =
    useState<number>();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const handleRewardSelect = useCallback((_: string, index: number) => {
    setSelectedRewardIndex(index);
    setSelectedConditionIndex(undefined);
  }, []);

  const handleQualifyConditionSelect = useCallback(
    (_: string, index: number) => {
      setSelectedConditionIndex(index);
      setIsDepositModalOpen(true);
    },
    []
  );

  const closeDepositModal = useCallback(() => {
    setIsDepositModalOpen(false);
  }, []);

  const handlePhaseTabChange = useCallback((value: string) => {
    const parsedIndex = Number.parseInt(value, 10);
    if (Number.isNaN(parsedIndex)) {
      return;
    }
    setPhaseIndex(parsedIndex);
    setSelectedRewardIndex(undefined);
    setSelectedConditionIndex(undefined);
    setIsDepositModalOpen(false);
  }, []);

  const pendingSinglePhaseValueRef = useRef<
    PromotionFormData["cardinality"] | null
  >(null);

  const handleSinglePhaseChange = useCallback(
    (value: PromotionFormData["cardinality"]) => {
      if (value === "SINGLE" && !isSinglePhase && hasDataInAdditionalPhases()) {
        pendingSinglePhaseValueRef.current = value;
        setShowConfirmDialog(true);
        return;
      }
      handleCardinalityChange(value);
    },
    [handleCardinalityChange, hasDataInAdditionalPhases, isSinglePhase]
  );

  const handleConfirmToggle = useCallback(() => {
    if (pendingSinglePhaseValueRef.current) {
      handleCardinalityChange(pendingSinglePhaseValueRef.current);
      pendingSinglePhaseValueRef.current = null;
    }
    setShowConfirmDialog(false);
  }, [handleCardinalityChange]);

  const handleConfirmDialogOpenChange = useCallback((open: boolean) => {
    if (!open) {
      pendingSinglePhaseValueRef.current = null;
    }
    setShowConfirmDialog(open);
  }, []);

  const conditionPath = useMemo(() => {
    if (
      phaseIndex === undefined ||
      selectedRewardIndex === undefined ||
      selectedConditionIndex === undefined
    ) {
      return undefined;
    }

    return `phases.${phaseIndex}.rewards.${selectedRewardIndex}.qualifyConditions.${selectedConditionIndex}` satisfies Path<PromotionFormData>;
  }, [phaseIndex, selectedRewardIndex, selectedConditionIndex]);

  const conditionServerData = useMemo(() => {
    if (
      !initialData ||
      phaseIndex === undefined ||
      selectedRewardIndex === undefined ||
      selectedConditionIndex === undefined
    ) {
      return undefined;
    }

    return initialData.phases?.[phaseIndex]?.rewards?.[selectedRewardIndex]
      ?.qualifyConditions?.[selectedConditionIndex];
  }, [initialData, phaseIndex, selectedRewardIndex, selectedConditionIndex]);

  const onFormSubmit = (data: PromotionFormData) => {
    const processedData = normalizePromotionSubmitData(data);
    onSubmit?.(processedData);
  };

  const shouldShowTabs = !isSinglePhase && phasesFieldArray.fields.length > 1;
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
          <div className="mt-6 border-t pt-6">
            <PhaseForm
              phaseIndex={0}
              isSimplified
              isEditing={isEditing}
              onRewardSelect={handleRewardSelect}
              onQualifyConditionSelect={handleQualifyConditionSelect}
              availableQualifyConditions={
                initialData?.availableQualifyConditions
              }
              anchorCatalog={anchorCatalog}
              anchorOccurrences={anchorOccurrences}
              phaseServerData={initialData?.phases?.[0]}
            />
          </div>
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

          <div className="space-y-4">
            {shouldShowTabs ? (
              <Tabs
                value={activePhaseIndex.toString()}
                onValueChange={handlePhaseTabChange}
              >
                <TabsList className="flex h-auto w-full flex-wrap gap-1 md:grid md:grid-cols-[repeat(auto-fit,minmax(100px,1fr))]">
                  {phasesFieldArray.fields.map((_, index) => (
                    <TabsTrigger key={index} value={index.toString()}>
                      Fase {index + 1}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {phasesFieldArray.fields.map((field, index) => (
                  <TabsContent key={field.id} value={index.toString()}>
                    <PhaseForm
                      phaseIndex={index}
                      onRemove={
                        canRemovePhase(index)
                          ? () => removePhase(index)
                          : undefined
                      }
                      removeDisabledReason={getPhaseRemoveDisabledReason(index)}
                      isEditing={isEditing}
                      onRewardSelect={handleRewardSelect}
                      onQualifyConditionSelect={handleQualifyConditionSelect}
                      availableQualifyConditions={
                        initialData?.availableQualifyConditions
                      }
                      anchorCatalog={anchorCatalog}
                      anchorOccurrences={anchorOccurrences}
                      phaseServerData={initialData?.phases?.[index]}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              phasesFieldArray.fields.map((field, index) => (
                <div key={field.id}>
                  <PhaseForm
                    phaseIndex={index}
                    onRemove={
                      canRemovePhase(index)
                        ? () => removePhase(index)
                        : undefined
                    }
                    removeDisabledReason={getPhaseRemoveDisabledReason(index)}
                    isEditing={isEditing}
                    onRewardSelect={handleRewardSelect}
                    onQualifyConditionSelect={handleQualifyConditionSelect}
                    availableQualifyConditions={
                      initialData?.availableQualifyConditions
                    }
                    anchorCatalog={anchorCatalog}
                    anchorOccurrences={anchorOccurrences}
                    phaseServerData={initialData?.phases?.[index]}
                  />
                </div>
              ))
            )}
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

      {conditionPath && conditionServerData?.type === "DEPOSIT" && (
        <DepositQualifyModal
          isOpen={isDepositModalOpen}
          onClose={closeDepositModal}
          conditionPath={conditionPath}
          conditionServerData={conditionServerData}
        />
      )}
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

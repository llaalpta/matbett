
import React, { useEffect, useState } from "react";
import { FormProvider, useFormContext } from "react-hook-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { TypographyH1, TypographyH2 } from "@/components/atoms";
import { ConfirmDialog } from "@/components/atoms/ConfirmDialog";
import { PromotionBasicInfoForm, PhaseForm, DepositQualifyModal } from "@/components/molecules";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAvailableTimeframes } from "@/hooks/api/usePromotions";
import { usePromotionLogic } from "@/hooks/domain/usePromotionLogic";
import { usePromotionForm } from "@/hooks/usePromotionForm";
import type { PromotionFormData, PromotionServerModel, RewardQualifyConditionServerModel } from "@/types/hooks";
import { FormActionBar } from "@/components/molecules/FormActionBar";

interface PromotionFormProps {
  initialData?: PromotionServerModel;
  onSubmit?: (data: PromotionFormData) => void;
  isLoading?: boolean;
  promotionId?: string;
  showBackButton?: boolean; // Nueva prop
  backHref?: string;
  backToLabel?: string;
}

// 1. COMPONENTE DE CONTENIDO (Consume el contexto y la lógica)
const PromotionFormContent: React.FC<PromotionFormProps> = ({
  initialData,
  onSubmit,
  isLoading,
  promotionId,
  showBackButton = false,
  backHref,
  backToLabel,
}) => {
  const isEditing = !!promotionId;

  // A. Obtenemos métodos de RHF del contexto (para submit)
  const { handleSubmit, formState, watch } = useFormContext<PromotionFormData>();
  const { isValid } = formState;


  // B. Ejecutamos la lógica de dominio - TODO en el hook!
  const {
    phasesFieldArray,
    isSinglePhase,
    addPhase,
    removePhase,
    resetFormToDefaults,
    // Handlers UI completos (del hook)
    handleSinglePhaseToggle,
    handleConfirmToggle,
    handleFormSubmit,
    handlePhaseTabChange,
    handleQualifyConditionSelect,
    handleNameChange,
    handleDescriptionChange,
    // Estado UI (del hook)
    isDepositModalOpen,
    closeDepositModal,
    showConfirmDialog,
    setShowConfirmDialog,
    // Helpers de datos
    getQualifyConditionPath,
    getConditionServerData,
    availableTimeframes,
    // Funciones para pasar a los hijos
    setReward,
  } = usePromotionLogic(initialData);

  // Extraer datos para el modal
  const conditionPath = getQualifyConditionPath();
  const conditionServerData = getConditionServerData();

  // --- Handler de submit que usa la lógica del hook ---
  const onFormSubmit = (data: PromotionFormData) => {
    const processedData = handleFormSubmit(data);
    onSubmit?.(processedData);
  };

  const shouldShowTabs = !isSinglePhase && phasesFieldArray.fields.length > 1;

  // Log de valores del formulario cada vez que cambian
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      console.log('📝 Form changed:', {
        changedField: name,
        changeType: type,
        isValid,
        errors: formState.errors,
        allValues: value
      });
    });
    return () => subscription.unsubscribe();
  }, [watch, isValid, formState.errors]);
  

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 pb-24" noValidate>
      
      {/* Info Básica */}
      <div className="space-y-4">
          <PromotionBasicInfoForm
            onSinglePhaseChange={handleSinglePhaseToggle}
            onNameChange={handleNameChange}
            onDescriptionChange={handleDescriptionChange}
            serverData={initialData} // Pasar datos del servidor para tracking
          />

          {isSinglePhase && (
            <div className="mt-6 border-t pt-6">
              <PhaseForm
                fieldPath="phases.0"
                isSimplified={true}
                isEditing={isEditing}
                // Pasamos los setters explícitamente
                onRewardSelect={setReward}
                onQualifyConditionSelect={handleQualifyConditionSelect}
                availableTimeframes={availableTimeframes}
                phaseServerData={initialData?.phases?.[0]} // Pasar datos de fase en cascada
              />
            </div>
          )}
      </div>

      {/* Fases Múltiples */}
      {!isSinglePhase && (
        <div className="space-y-4">
          <div className="flex flex-row items-center justify-between">
            <TypographyH2>Fases de la Promoción</TypographyH2>
            <Button type="button" variant="outline" onClick={addPhase}>
              + Añadir Fase
            </Button>
          </div>
          <div className="space-y-4">
            {shouldShowTabs ? (
              <Tabs defaultValue="0" onValueChange={handlePhaseTabChange}>
                <TabsList className="flex h-auto w-full flex-wrap gap-1 md:grid md:grid-cols-[repeat(auto-fit,minmax(100px,1fr))]">
                  {phasesFieldArray.fields.map((_, index) => (
                    <TabsTrigger key={index} value={index.toString()}>Fase {index + 1}</TabsTrigger>
                  ))}
                </TabsList>
                {phasesFieldArray.fields.map((field, index) => (
                  <TabsContent key={field.id} value={index.toString()}>
                    <PhaseForm
                      fieldPath={`phases.${index}`}
                      onRemove={phasesFieldArray.fields.length > 1 ? () => removePhase(index) : undefined}
                      isEditing={isEditing}
                      // Pasamos los setters explícitamente
                      onRewardSelect={setReward}
                      onQualifyConditionSelect={handleQualifyConditionSelect}
                      availableTimeframes={availableTimeframes}
                      phaseServerData={initialData?.phases?.[index]} // Pasar datos de fase en cascada
                    />
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              phasesFieldArray.fields.map((field, index) => (
                <div key={field.id}>
                  <PhaseForm
                    fieldPath={`phases.${index}`}
                    onRemove={phasesFieldArray.fields.length > 1 ? () => removePhase(index) : undefined}
                    isEditing={isEditing}
                    // Pasamos los setters explícitamente
                    onRewardSelect={setReward}
                    onQualifyConditionSelect={handleQualifyConditionSelect}
                    availableTimeframes={availableTimeframes}
                    phaseServerData={initialData?.phases?.[index]} // Pasar datos de fase en cascada
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sticky Action Bar */}
      <FormActionBar
        onDiscard={resetFormToDefaults}
        isLoading={isLoading}
        showBackButton={showBackButton}
        backHref={backHref}
        backToLabel={backToLabel}
        saveLabel="Guardar"
        discardLabel="Descartar"
      />

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Cambiar a fase única"
        description="Se eliminarán las fases adicionales. ¿Continuar?"
        confirmText="Sí"
        cancelText="Cancelar"
        onConfirm={handleConfirmToggle}
      />

      {/* Deposit Qualify Modal - for tracking deposits */}
      {conditionPath && conditionServerData?.type === 'DEPOSIT' && (
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

// 2. COMPONENTE CONTENEDOR (Inicializa el contexto)
export const PromotionForm: React.FC<PromotionFormProps> = (props) => {
  // Factory Hook: Crea el objeto form
  const form = usePromotionForm(props.initialData);


  return (
    <FormProvider {...form}>
      <PromotionFormContent {...props} />
    </FormProvider>
  );
};
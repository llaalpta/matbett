import { useCallback, useState } from "react";
import {
  useFormContext,
  useFieldArray,
  useWatch,
  FieldPath,
} from "react-hook-form";

import { useAvailableTimeframes } from "@/hooks/api/usePromotions";
import type {
  PromotionFormData,
  PromotionServerModel,
  UsePromotionLogicReturn,
} from "@/types/hooks";
import { buildDefaultPromotion, buildDefaultPhase, buildDefaultQualifyCondition } from "@/utils/formDefaults";

/**
 * Hook de Lógica de Dominio para Promociones.
 * * REQUISITO: Debe usarse dentro de un componente envuelto en <FormProvider>.
 * RESPONSABILIDAD: Gestionar la manipulación de arrays (Fases), la sincronización
 * de datos (Single vs Multiple) y el estado de la UI (Tabs activas).
 */
export const usePromotionLogic = (
  initialData?: PromotionServerModel
): UsePromotionLogicReturn => {
  // 1. Consumir el Contexto de React Hook Form
  const { control, setValue, getValues, reset } =
    useFormContext<PromotionFormData>();

  // 2. Fetch availableTimeframes for this promotion
  const { data: availableTimeframes } = useAvailableTimeframes(initialData?.id);

  // 3. Gestión del Array de Fases
  const phasesFieldArray = useFieldArray({
    control,
    name: "phases",
  });

  // 4. Observadores de Estado (Lógica Reactiva)
  const cardinality = useWatch({ control, name: "cardinality" });
  const isSinglePhase = cardinality === "SINGLE";

  // 5. Estado de UI (Tabs Activos / Navegación)
  const promotionId = initialData?.id;
  const [phaseId, setPhaseId] = useState<string>();
  const [phaseIndex, setPhaseIndex] = useState<number>(0); // Default to 0
  const [rewardId, setRewardId] = useState<string>();
  const [rewardIndex, setRewardIndex] = useState<number>();
  const [qualifyConditionId, setQualifyConditionId] = useState<string>();
  const [qualifyConditionIndex, setQualifyConditionIndex] = useState<number>();

  // 5. Helpers de Navegación (Setters de UI)
  const setPhase = useCallback((id: string, index: number) => {
    setPhaseId(id);
    setPhaseIndex(index);
    // Resetear hijos al cambiar de fase
    setRewardId(undefined);
    setRewardIndex(undefined);
    setQualifyConditionId(undefined);
    setQualifyConditionIndex(undefined);
  }, []);

  const setReward = useCallback((id: string, index: number) => {
    setRewardId(id);
    setRewardIndex(index);
    // Resetear hijos al cambiar de reward
    setQualifyConditionId(undefined);
    setQualifyConditionIndex(undefined);
  }, []);

  const setQualifyCondition = useCallback((id: string, index: number) => {
    setQualifyConditionId(id);
    setQualifyConditionIndex(index);
  }, []);

  // 6. Helpers de Paths (Generadores de rutas string para RHF)
  const getPhasePath = useCallback(
    () => (phaseIndex !== undefined ? `phases.${phaseIndex}` : null),
    [phaseIndex]
  );

  const getRewardPath = useCallback(
    () =>
      phaseIndex !== undefined && rewardIndex !== undefined
        ? `phases.${phaseIndex}.rewards.${rewardIndex}`
        : null,
    [phaseIndex, rewardIndex]
  );

  const getQualifyConditionPath = useCallback(
    () =>
      phaseIndex !== undefined &&
      rewardIndex !== undefined &&
      qualifyConditionIndex !== undefined
        ? `phases.${phaseIndex}.rewards.${rewardIndex}.qualifyConditions.${qualifyConditionIndex}`
        : null,
    [phaseIndex, rewardIndex, qualifyConditionIndex]
  );

  // 7. Lógica de Negocio: Sincronización Single Phase
  const syncPromotionToPhase0 = useCallback(() => {
    if (phasesFieldArray.fields.length > 0) {
      const data = getValues();

      // Helper para copiar valores de forma segura
      const copyField = (field: keyof PromotionFormData, targetPath: string) => {
        const val = data[field];
        // Solo copiamos si hay valor, para no sobreescribir con undefined si no es necesario
        if (val !== undefined && val !== null) {
          setValue(targetPath as FieldPath<PromotionFormData>, val, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      };

      copyField("name", "phases.0.name");
      copyField("description", "phases.0.description");
      copyField("timeframe", "phases.0.timeframe");
      copyField("status", "phases.0.status");
      copyField("activationMethod", "phases.0.activationMethod");
    }
  }, [phasesFieldArray.fields.length, setValue, getValues]);

  const removeAdditionalPhases = useCallback(() => {
    if (phasesFieldArray.fields.length > 1) {
      // Mantiene solo la primera fase y elimina el resto
      const firstPhase = getValues("phases.0");
      // replace es más eficiente que borrar uno a uno en RHF
      phasesFieldArray.replace([firstPhase]);
    }
  }, [phasesFieldArray, getValues]);

  const handleCardinalityChange = useCallback(
    (value: string) => {
      setValue("cardinality", value as "SINGLE" | "MULTIPLE");

      if (value === "SINGLE") {
        syncPromotionToPhase0();
        removeAdditionalPhases();
      }
    },
    [syncPromotionToPhase0, removeAdditionalPhases, setValue]
  );

  // 8. Helpers de Manipulación de Arrays
  const addPhase = useCallback(() => {
    phasesFieldArray.append(buildDefaultPhase());
  }, [phasesFieldArray]);

  const removePhase = useCallback(
    (index: number) => {
      phasesFieldArray.remove(index);
    },
    [phasesFieldArray]
  );

  const hasDataInAdditionalPhases = useCallback(() => {
    // Verifica si hay fases más allá de la 0 con datos relevantes
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

  // 9. Utilidades Generales
  const resetFormToDefaults = useCallback(() => {
    reset(buildDefaultPromotion(initialData));
    // También reseteamos el estado de UI
    setPhaseIndex(0);
    setRewardIndex(undefined);
  }, [reset, initialData]);


  // 10. Estado UI de Modals y Dialogs
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const openDepositModal = useCallback(() => setIsDepositModalOpen(true), []);
  const closeDepositModal = useCallback(() => setIsDepositModalOpen(false), []);

  // 11. Helpers de Extracción de ServerData
  const getPhaseServerData = useCallback(() => {
    return initialData && phaseIndex !== undefined
      ? initialData.phases?.[phaseIndex]
      : undefined;
  }, [initialData, phaseIndex]);

  const getRewardServerData = useCallback(() => {
    const phaseData = getPhaseServerData();
    return phaseData && rewardIndex !== undefined
      ? phaseData.rewards?.[rewardIndex]
      : undefined;
  }, [getPhaseServerData, rewardIndex]);

  const getConditionServerData = useCallback(() => {
    const rewardData = getRewardServerData();
    return rewardData && qualifyConditionIndex !== undefined
      ? rewardData.qualifyConditions?.[qualifyConditionIndex]
      : undefined;
  }, [getRewardServerData, qualifyConditionIndex]);

  // 12. Handlers UI Completos

  // Wrapper para setQualifyCondition que también abre el modal
  const handleQualifyConditionSelect = useCallback(
    (id: string, index: number) => {
      setQualifyCondition(id, index);
      openDepositModal();
    },
    [setQualifyCondition, openDepositModal]
  );

  // Handler para cambio de tab de Phase (actualiza tracking)
  const handlePhaseTabChange = useCallback(
    (value: string) => {
      const index = parseInt(value);
      const phase = getValues(`phases.${index}`);
      if (phase?.id) {
        setPhase(phase.id, index);
      }
    },
    [getValues, setPhase]
  );

  // Handler para Single Phase toggle con confirmación
  const handleSinglePhaseToggle = useCallback(
    (value: string) => {
      const newValue = value === "SINGLE";
      handleCardinalityChange(value);
      if (!newValue && hasDataInAdditionalPhases()) {
        setShowConfirmDialog(true);
      } else {
        removeAdditionalPhases();
      }
    },
    [handleCardinalityChange, hasDataInAdditionalPhases, removeAdditionalPhases]
  );

  // Handler para confirmar eliminación de fases adicionales
  const handleConfirmToggle = useCallback(() => {
    removeAdditionalPhases();
    setShowConfirmDialog(false);
  }, [removeAdditionalPhases]);

  // Handler para submit con sincronización de SINGLE phase
  const handleFormSubmit = useCallback(
    (data: PromotionFormData) => {
      console.log('🔍 Pre-submit Inspection:', {
        timeframeStart: data.timeframe.start,
        type: typeof data.timeframe.start,
        isDateInstance: data.timeframe.start instanceof Date
      });

      // Sincronización previa al envío para SINGLE phase
      if (data.cardinality === "SINGLE" && data.phases.length > 0) {
        const phase0 = data.phases[0];
        // Copiamos los datos del root a la fase 0, ya que en modo SINGLE
        // el formulario de fase está simplificado y no muestra estos campos.
        data.phases[0] = {
          ...phase0,
          name: data.name,
          description: data.description || "",
          timeframe: data.timeframe,
          activationMethod: data.activationMethod || "AUTOMATIC",
        };
        // Aseguramos que solo se envíe una fase
        data.phases = [data.phases[0]];
      }
      return data; // Devolver data procesada para que el componente la pase al onSubmit
    },
    []
  );

  // Handlers para sincronizar name/description en modo SINGLE (en tiempo real)
  const handleNameChange = useCallback(
    (value: string | number | undefined) => {
      const cardinality = getValues('cardinality');
      if (cardinality === 'SINGLE') {
        setValue('phases.0.name', String(value || ''), { shouldValidate: true });
      }
    },
    [getValues, setValue]
  );

  const handleDescriptionChange = useCallback(
    (value: string | undefined) => {
      const cardinality = getValues('cardinality');
      if (cardinality === 'SINGLE') {
        setValue('phases.0.description', value || '', { shouldValidate: true });
      }
    },
    [getValues, setValue]
  );

  // ❌ handleQualifyConditionValueTypeChange eliminado - ahora se maneja en useQualifyConditionLogic

  // UI Tracking State
  const trackingState = {
    promotionId,
    phaseId,
    phaseIndex,
    rewardId,
    rewardIndex,
    qualifyConditionId,
    qualifyConditionIndex,
  };

  return {
    // Métodos de Array RHF
    phasesFieldArray,
    addPhase,
    removePhase,

    // Estado de Lógica de Negocio
    isSinglePhase,
    hasDataInAdditionalPhases,

    // Acciones de Lógica de Negocio
    handleCardinalityChange,
    removeAdditionalPhases,
    resetFormToDefaults,
    // calculateRelativeEndDate, // Eliminado

    // Setters de UI (básicos)
    setPhase,
    setReward,
    setQualifyCondition,

    // Helpers de Contexto/Paths
    getQualifyConditionPath,
    getRewardPath,
    getPhasePath,
    trackingState,

    // Datos originales
    serverData: initialData,
    availableTimeframes,

    // Helpers de Extracción de ServerData
    getPhaseServerData,
    getRewardServerData,
    getConditionServerData,

    // Estado y Handlers de UI (Modals y Dialogs)
    isDepositModalOpen,
    openDepositModal,
    closeDepositModal,
    showConfirmDialog,
    setShowConfirmDialog,

    // Handlers UI Completos (Reutilizables)
    handleQualifyConditionSelect, // Wrapper que actualiza tracking + abre modal
    handlePhaseTabChange, // Handler para tabs de phases
    handleSinglePhaseToggle, // Handler con lógica de confirmación
    handleConfirmToggle, // Handler para confirmar dialog
    handleFormSubmit, // Handler que procesa data antes de submit
    handleNameChange, // Sincroniza name con phases[0].name en modo SINGLE
    handleDescriptionChange, // Sincroniza description con phases[0].description en modo SINGLE
    // ❌ handleQualifyConditionValueTypeChange eliminado - ahora en useQualifyConditionLogic
  };
};
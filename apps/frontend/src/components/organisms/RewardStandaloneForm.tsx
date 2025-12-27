"use client";

import { useEffect, useState, useCallback } from "react";
import { FormProvider } from "react-hook-form";

import { RewardForm } from "@/components/molecules/RewardForm";
import { Button } from "@/components/ui/button";
import { useReward, useUpdateReward } from "@/hooks/api/useRewards";
import { useAvailableTimeframes } from "@/hooks/api/usePromotions";
import { useRewardForm } from "@/hooks/useRewardForm";
import type { RewardFormData } from "@/types/hooks";
import { buildDefaultReward } from "@/utils/formDefaults";

interface RewardStandaloneFormProps {
  rewardId?: string; // Solo si se está editando
  onSuccess?: () => void;
}

export function RewardStandaloneForm({
  rewardId,
  onSuccess,
}: RewardStandaloneFormProps) {
  // Fetch del reward existente si estamos editando
  const { data: rewardData, isLoading: isLoadingReward } = useReward(rewardId);
  const updateRewardMutation = useUpdateReward();

  // Fetch de availableTimeframes usando el promotionId del reward
  const { data: availableTimeframes, isLoading: isLoadingTimeframes } = useAvailableTimeframes(rewardData?.promotionId);

  // ✅ Usar hook factory para consistencia con PromotionForm
  const form = useRewardForm(rewardData ?? undefined);

  // ✅ Tracking state para UI (qué qualifyCondition está seleccionada)
  const [qualifyConditionId, setQualifyConditionId] = useState<string>();
  const [qualifyConditionIndex, setQualifyConditionIndex] = useState<number>();

  // ✅ Modal state (abrir/cerrar deposit modal)
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Resetear formulario si cambian los datos del reward (por ejemplo, al navegar entre IDs)
  useEffect(() => {
    if (rewardData) {
      form.reset(buildDefaultReward(rewardData.type, rewardData));
    }
  }, [rewardData, form]);

  // ✅ Handlers para modals
  const handleQualifyConditionSelect = useCallback(
    (id: string, index: number) => {
      setQualifyConditionId(id);
      setQualifyConditionIndex(index);
      setIsDepositModalOpen(true);
    },
    []
  );

  const handleCloseDepositModal = useCallback(() => {
    setIsDepositModalOpen(false);
  }, []);


  const { handleSubmit } = form;

  const onSubmit = async (data: RewardFormData) => {
    if (!rewardId) return; // No se puede actualizar sin ID

    try {
      await updateRewardMutation.mutateAsync({ id: rewardId, data: data });
      onSuccess?.();
    } catch (error) {
      console.error("Error al actualizar reward:", error);
      // TODO: Mostrar un toast de error
    }
  };

  const isSubmitting = updateRewardMutation.isPending;
  const isLoading = isLoadingReward || isLoadingTimeframes;

  if (isLoading) {
    return <p>Cargando datos de la recompensa...</p>;
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <RewardForm<RewardFormData>
          fieldPath="" // El path es vacío porque este formulario edita el Reward directamente
          rewardServerData={rewardData ?? undefined}
          onRemove={() => { /* No aplica para standalone */ }}
          canRemove={false}
          isEditing={!!rewardId}
          availableTimeframes={availableTimeframes}
          onQualifyConditionSelect={handleQualifyConditionSelect}
        />

        {/* TODO: Modal de Deposit Tracking
        {isDepositModalOpen && qualifyConditionIndex !== undefined && (
          <DepositQualifyModal
            isOpen={isDepositModalOpen}
            onClose={handleCloseDepositModal}
            qualifyConditionId={qualifyConditionId}
            qualifyConditionIndex={qualifyConditionIndex}
          />
        )}
        */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </form>
    </FormProvider>
  );
}

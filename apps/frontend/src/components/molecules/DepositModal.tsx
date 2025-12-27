"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useDeposits, useDeposit } from "@/hooks/api/useDeposits";
import type { DepositTrackingContext } from "@/types/context";
import type { DepositFormData } from "@/types/hooks";
import type { RewardDepositQualifyConditionFormData } from "@/types/ui";

import { DepositForm } from "./DepositForm";
import { DepositWarnings } from "./DepositWarnings";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  context?: DepositTrackingContext; // Para endpoints REST jerárquicos
  qualifyCondition?: RewardDepositQualifyConditionFormData; // Para warnings
  onSuccess?: () => void;
  onValueChange?: (amount: number) => void;
  initialData?: Partial<DepositFormData>;
  depositId?: string; // Para diferenciar entre create vs update
}

export function DepositModal({
  isOpen,
  onClose,
  title = "Registrar Depósito",
  context,
  qualifyCondition,
  onSuccess,
  onValueChange,
  initialData,
  depositId,
}: DepositModalProps) {
  // Hook unificado para todas las operaciones
  const {
    createDeposit,
    updateDeposit,
    isCreating,
    isUpdating,
  } = useDeposits();

  // Fetch del deposit existente si depositId está presente
  const { data: existingDeposit, isLoading: isFetchingDeposit } = useDeposit(
    depositId || ""
  );

  // Estado para amount en tiempo real (para warnings)
  const [depositAmount, setDepositAmount] = useState(0);

  // Determinar si es update o create
  const isUpdate = !!depositId;

  // Si hay depositId: usar datos de API. Si no: usar initialData (para creación)
  const formInitialData = existingDeposit || initialData;

  // Lógica unificada de submit
  const handleSubmit = async (depositData: DepositFormData) => {
    try {
      // Inyectar contexto si existe
      const payload = {
        ...depositData,
        qualifyConditionId: context?.qualifyConditionId ?? depositData.qualifyConditionId,
      };

      if (isUpdate && depositId) {
        // Actualizar depósito
        await updateDeposit({ id: depositId, data: payload });
      } else {
        // Crear depósito
        await createDeposit(payload);
      }
      onSuccess?.(); // Ejecutar callback de éxito
      onClose(); // Cerrar modal después del éxito
    } catch (error) {
      console.error('Error with deposit operation:', error);
      // TODO: Manejar error con toast/notification
    }
  };

  // Estados unificados de carga
  const isLoading = isFetchingDeposit || (isUpdate ? isUpdating : isCreating);

  // Manejar cambios de amount para warnings
  const handleValueChange = (amount: number) => {
    setDepositAmount(amount);
    onValueChange?.(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Warnings dinámicos */}
        {qualifyCondition && (
          <DepositWarnings
            depositAmount={depositAmount}
            qualifyCondition={qualifyCondition}
          />
        )}

        {/* Form */}
        <DepositForm
          onSubmit={handleSubmit}
          initialData={formInitialData}
          isLoading={isLoading}
          onValueChange={handleValueChange}
          showSubmitButton={true}
        />

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { useDeposit, useDeposits } from "@/hooks/api/useDeposits";
import { useApiErrorMessage } from "@/hooks/useApiErrorMessage";
import { useApiSuccessToast } from "@/hooks/useApiSuccessToast";
import type { DepositTrackingContext } from "@/types/context";
import type { DepositFormData } from "@/types/hooks";
import type { RewardDepositQualifyConditionFormData } from "@/types/ui";

import { DepositForm } from "./DepositForm";
import { DepositWarnings } from "./DepositWarnings";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  context?: DepositTrackingContext;
  qualifyCondition?: RewardDepositQualifyConditionFormData;
  onSuccess?: () => void;
  onValueChange?: (amount: number) => void;
  initialData?: Partial<DepositFormData>;
  depositId?: string;
}

export function DepositModal({
  isOpen,
  onClose,
  title = "Registrar deposito",
  context,
  qualifyCondition,
  onSuccess,
  onValueChange,
  initialData,
  depositId,
}: DepositModalProps) {
  const { createDeposit, updateDeposit, isCreating, isUpdating } = useDeposits();
  const { data: existingDeposit, isLoading: isFetchingDeposit } = useDeposit(
    depositId || ""
  );
  const { apiErrorMessage, clearApiError, setApiError } = useApiErrorMessage();
  const { notifySuccess } = useApiSuccessToast();
  const [depositAmount, setDepositAmount] = useState(0);

  const isUpdate = Boolean(depositId);
  const formInitialData = existingDeposit || initialData;

  const handleSubmit = async (depositData: DepositFormData) => {
    const payload = {
      ...depositData,
      qualifyConditionId:
        context?.qualifyConditionId ?? depositData.qualifyConditionId,
    };
    clearApiError();
    try {
      if (isUpdate && depositId) {
        await updateDeposit({ id: depositId, data: payload });
      } else {
        await createDeposit(payload);
      }
      notifySuccess(isUpdate ? "Deposito actualizado." : "Deposito registrado.");
      onSuccess?.();
      onClose();
    } catch (error) {
      setApiError(error, "No se pudo guardar el deposito.");
    }
  };

  const isLoading = isFetchingDeposit || (isUpdate ? isUpdating : isCreating);

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

        {qualifyCondition ? (
          <DepositWarnings
            depositAmount={depositAmount}
            qualifyCondition={qualifyCondition}
          />
        ) : null}

        <DepositForm
          onSubmit={handleSubmit}
          initialData={formInitialData}
          isLoading={isLoading}
          onValueChange={handleValueChange}
          apiErrorMessage={apiErrorMessage}
          onDismissApiError={clearApiError}
          showSubmitButton
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

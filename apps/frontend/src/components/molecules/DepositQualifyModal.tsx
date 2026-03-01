"use client";

import { QualifyConditionSchema } from "@matbett/shared";
import { useFormContext, useWatch, type FieldValues, type Path } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { DepositQualifyConditionServerModel } from "@/types/hooks";

import { DepositWarnings } from "./DepositWarnings";
import { DepositTracking } from "./tracking/DepositTracking";

interface DepositQualifyModalProps<T extends FieldValues> {
  isOpen: boolean;
  onClose: () => void;
  conditionPath: Path<T>; // Full path to the condition (e.g. "phases.0.rewards.1.qualifyConditions.2")
  conditionServerData?: DepositQualifyConditionServerModel; // Server data with tracking (for display only)
}

/**
 * Generic modal for deposit qualify conditions
 * Works in both PromotionForm (nested) and RewardStandaloneForm (standalone) contexts
 * @template T - Form data type from FormProvider context (PromotionFormData or RewardFormData)
 */
export function DepositQualifyModal<T extends FieldValues = FieldValues>({
  isOpen,
  onClose,
  conditionPath,
  conditionServerData,
}: DepositQualifyModalProps<T>) {
  const { control } = useFormContext<T>();

  const conditionDataRaw = useWatch({
    control,
    name: conditionPath,
  });

  const parsedCondition = QualifyConditionSchema.safeParse(conditionDataRaw);
  const conditionData = parsedCondition.success ? parsedCondition.data : undefined;

  // Get tracking amount from server data (read-only, calculated by backend)
  const trackingAmount = conditionServerData?.tracking?.depositAmount;

  // Type narrow to DEPOSIT condition
  if (!conditionData || conditionData.type !== "DEPOSIT") {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Seguimiento de Deposito Calificatorio</DialogTitle>
        </DialogHeader>

        {/* Warnings based on condition requirements vs entered amount */}
        <DepositWarnings
          depositAmount={trackingAmount || 0}
          qualifyCondition={conditionData}
        />

        {/* Tracking Display (Read-Only) */}
        <DepositTracking conditionServerData={conditionServerData} />

        <DialogFooter>
          <Button onClick={onClose}>Listo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

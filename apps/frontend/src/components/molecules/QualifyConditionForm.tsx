"use client";

import { qualifyConditionStatusOptions, type AvailableTimeframes } from "@matbett/shared";
import { Trash2, InfoIcon } from "lucide-react";
import { FieldValues, Path } from "react-hook-form"; // Eliminado UseFormReturn

import { SelectField, SwitchField, TextareaField } from "@/components/atoms";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useQualifyConditionLogic } from "@/hooks/domain/useQualifyConditionLogic";
import { getFilteredQualifyConditionOptions } from "@/utils/rewardUtils";

import {
  DepositCondition,
  QualifyBetCondition,
  LossesCashbackCondition,
} from "./conditions";
import { TimeframeForm } from "./TimeframeForm";

interface QualifyConditionFormProps<T extends FieldValues> {
  // form: UseFormReturn<T>; // Eliminado
  fieldPath: Path<T>;
  rewardType: string;
  onRemove: () => void;
  canRemove?: boolean;
  rewardValueType?: string;
  rewardHasContributingCondition?: boolean;
  isEditing?: boolean; // If true, enables tracking features
  onViewTracking?: () => void; // Callback when user wants to view tracking
  availableTimeframes?: AvailableTimeframes;
}

export function QualifyConditionForm<T extends FieldValues>({
  fieldPath,
  rewardType,
  onRemove,
  canRemove = false,
  rewardValueType,
  rewardHasContributingCondition = false,
  isEditing = false,
  onViewTracking,
  availableTimeframes,
}: QualifyConditionFormProps<T>) {

  // 1. Usar hook lógico (Maneja contexto y watchers internamente)
  const {
    control,
    handleConditionTypeChange,
    handleValueTypeChange,
    conditionType,
    contributesToRewardValue: currentContributesToRewardValue
  } = useQualifyConditionLogic(fieldPath);

  // Get filtered options based on reward type
  const availableConditionOptions =
    getFilteredQualifyConditionOptions(rewardType);

  return (
    <div className="space-y-4">
      {/* Header con botón eliminar */}
      {canRemove && (
        <div className="flex items-center justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:text-destructive/90">
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      )}

      {/* Configuración básica */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField<T>
          control={control}
          name={`${fieldPath}.type` as Path<T>}
          label="Tipo de Condición"
          options={availableConditionOptions}
          placeholder="Seleccionar tipo de condición"
          onValueChange={(value) => handleConditionTypeChange(value)}
          required
        />
        <SelectField<T>
          control={control}
          name={`${fieldPath}.status` as Path<T>}
          label="Estado"
          options={qualifyConditionStatusOptions}
        />
      </div>

      <TextareaField<T>
        control={control}
        name={`${fieldPath}.description` as Path<T>}
        label="Descripción"
        placeholder="Describe brevemente esta condición de calificación..."
        rows={2}
      />

      <TextareaField<T>
        control={control}
        name={`${fieldPath}.otherRestrictions` as Path<T>}
        label="Otras restricciones"
        placeholder="Ej: Solo nuevos usuarios, excluir ciertos juegos, etc."
        rows={2}
        tooltip="Restricciones adicionales no cubiertas por los campos específicos"
      />

      {/* Timeframe para calificación */}
      <TimeframeForm<T>
        basePath={`${fieldPath}.timeframe` as Path<T>}
        title="Periodo de calificación"
        forceAbsolute={false}
        hideModeSelector={false}
        availableTimeframes={availableTimeframes}
      />

      {/* Renderizado condicional basado en el tipo */}
      {conditionType === "DEPOSIT" && (
        <DepositCondition<T>
          control={control}
          basePath={fieldPath}
          isEditing={isEditing}
          rewardValueType={rewardValueType}
          rewardHasContributingCondition={rewardHasContributingCondition}
          onViewTracking={onViewTracking}
          onValueTypeChange={handleValueTypeChange}
        />
      )}

      {conditionType === "BET" && (
        <QualifyBetCondition<T>
          control={control}
          basePath={fieldPath}
          rewardValueType={rewardValueType}
          rewardHasContributingCondition={rewardHasContributingCondition}
          onValueTypeChange={handleValueTypeChange}
        />
      )}

      {conditionType === "LOSSES_CASHBACK" && (
        <LossesCashbackCondition<T>
          control={control}
          basePath={fieldPath}
        />
      )}
    </div>
  );
}
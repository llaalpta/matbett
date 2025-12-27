"use client";

import { Control, FieldValues, Path, useWatch } from "react-hook-form";
import { FileText } from "lucide-react";

import { InputField, SwitchField } from "@/components/atoms";
import { Button } from "@/components/ui/button";

interface DepositConditionProps<T extends FieldValues> {
  control: Control<T>;
  basePath: Path<T>;
  onViewTracking?: () => void; // Callback to open tracking modal
  isEditing?: boolean; // Only show tracking button when editing
  onValueTypeChange?: (value: boolean) => void;
  rewardValueType?: string; // Para saber si mostrar el switch de contributesToRewardValue
  rewardHasContributingCondition?: boolean; // Para deshabilitar el switch si otra condition ya está marcada
}

export function DepositCondition<T extends FieldValues>({
  control,
  basePath,
  onViewTracking,
  isEditing = false,
  onValueTypeChange,
  rewardValueType,
  rewardHasContributingCondition = false,
}: DepositConditionProps<T>) {
  // Watchers
  const contributesToRewardValue = useWatch({
    control,
    name: `${basePath}.conditions.contributesToRewardValue` as Path<T>,
  });

  const bonusPercentage = useWatch({
    control,
    name: `${basePath}.conditions.bonusPercentage` as Path<T>,
  });

  const maxBonusAmount = useWatch({
    control,
    name: `${basePath}.conditions.maxBonusAmount` as Path<T>,
  });

  const minAmount = useWatch({
    control,
    name: `${basePath}.conditions.minAmount` as Path<T>,
  });

  return (
    <div className="space-y-4">
      {/* View Tracking Button - only in edit mode */}
      {isEditing && onViewTracking && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onViewTracking}
          >
            <FileText className="mr-2 h-4 w-4" />
            Ver Tracking de Depósitos
          </Button>
        </div>
      )}

      {/* Discriminador de Tipo de Valor - Solo visible si reward.valueType es CALCULATED */}
      {rewardValueType === "CALCULATED_FROM_CONDITIONS" && (
        <div className="rounded-md border border-border/60 bg-accent/5 p-4">
          <SwitchField<T>
            control={control}
            name={`${basePath}.conditions.contributesToRewardValue` as Path<T>}
            label="El valor de la reward depende de esta condición"
            description={
              contributesToRewardValue || !rewardHasContributingCondition
                ? "Si está activado, el valor se calculará basándose en el depósito realizado"
                : "Otra condición ya está marcada para calcular el valor"
            }
            disabled={!contributesToRewardValue && rewardHasContributingCondition}
            onValueChange={onValueTypeChange}
          />
        </div>
      )}

      {/* Campos según tipo de valor */}
      {!contributesToRewardValue ? (
        /* VALOR FIJO */
        <div className="rounded-md border border-border/40 bg-muted/20 p-4 space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Configuración de Depósito (Valor Fijo)
          </h4>
          <InputField<T>
            control={control}
            name={`${basePath}.conditions.targetAmount` as Path<T>}
            label="Depósito Requerido (€)"
            type="number"
            step={0.01}
            placeholder="50"
            min={0}
            tooltip="Importe exacto que debe depositar el usuario para calificar"
            required
          />
        </div>
      ) : (
        /* VALOR CALCULADO */
        <div className="rounded-md border border-border/40 bg-muted/20 p-4 space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Configuración de Depósito (Valor Calculado)
          </h4>

          {/* Restricciones de depósito */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField<T>
              control={control}
              name={`${basePath}.conditions.minAmount` as Path<T>}
              label="Depósito Mínimo (€)"
              type="number"
              step={0.01}
              placeholder="20"
              min={0}
              tooltip="Importe mínimo de depósito para calificar"
              required
            />
            <InputField<T>
              control={control}
              name={`${basePath}.conditions.maxAmount` as Path<T>}
              label="Depósito Máximo (€)"
              type="number"
              step={0.01}
              placeholder="Sin límite"
              min={0}
              tooltip="Límite opcional de depósito (dejar vacío si no hay límite)"
            />
          </div>

          {/* Cálculo del bonus */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField<T>
              control={control}
              name={`${basePath}.conditions.bonusPercentage` as Path<T>}
              label="Porcentaje de Bonus (%)"
              type="number"
              step={0.01}
              placeholder="100"
              min={0}
              max={500}
              tooltip="% del depósito que se devuelve como bonus (ej: 100% = igual al depósito)"
              required
            />
            <InputField<T>
              control={control}
              name={`${basePath}.conditions.maxBonusAmount` as Path<T>}
              label="Bonus Máximo (€)"
              type="number"
              step={0.01}
              placeholder="50"
              min={0}
              tooltip="Límite máximo del bonus generado"
              required
            />
          </div>

          {/* Warning de depósito óptimo */}
          {bonusPercentage > 0 && maxBonusAmount > 0 && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                💡 Depósito óptimo: €{(maxBonusAmount / (bonusPercentage / 100)).toFixed(2)}
              </p>
              <p className="mt-1 text-blue-700 dark:text-blue-300">
                Con {bonusPercentage}% de bonus y máximo de €{maxBonusAmount},
                depositar más de €{(maxBonusAmount / (bonusPercentage / 100)).toFixed(2)} no aumentará el bonus.
              </p>
              {minAmount && minAmount > (maxBonusAmount / (bonusPercentage / 100)) && (
                <p className="mt-2 text-amber-700 dark:text-amber-300 font-medium">
                  ⚠️ Advertencia: El depósito mínimo (€{minAmount}) es mayor que el depósito óptimo.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Campos comunes (siempre visibles) */}
      <div className="rounded-md border border-border/40 bg-muted/20 p-4 space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">
          Configuración Adicional
        </h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField<T>
            control={control}
            name={`${basePath}.conditions.depositCode` as Path<T>}
            label="Código de Depósito"
            placeholder="WELCOME50"
            tooltip="Código promocional opcional que debe usar el usuario"
          />

          <div className="flex items-end pb-2">
            <SwitchField<T>
              control={control}
              name={`${basePath}.conditions.firstDepositOnly` as Path<T>}
              label="Solo válido para primer depósito"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

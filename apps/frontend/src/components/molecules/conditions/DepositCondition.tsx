"use client";

import { FileText } from "lucide-react";
import { Control, FieldValues, Path, useWatch } from "react-hook-form";

import { InputField, SwitchField } from "@/components/atoms";
import { Button } from "@/components/ui/button";
export interface DepositConditionPaths<T extends FieldValues> {
  contributesToRewardValue: Path<T>;
  bonusPercentage: Path<T>;
  maxBonusAmount: Path<T>;
  minAmount: Path<T>;
  maxAmount: Path<T>;
  targetAmount: Path<T>;
  depositCode: Path<T>;
  firstDepositOnly: Path<T>;
}

interface DepositConditionProps<T extends FieldValues> {
  control: Control<T>;
  paths: DepositConditionPaths<T>;
  onViewTracking?: () => void; // Callback to open tracking modal
  isEditing?: boolean; // Only show tracking button when editing
  readOnly?: boolean;
}

export function DepositCondition<T extends FieldValues>({
  control,
  paths,
  onViewTracking,
  isEditing = false,
  readOnly = false,
}: DepositConditionProps<T>) {
  // Watchers
  const contributesToRewardValue = useWatch({
    control,
    name: paths.contributesToRewardValue,
  });

  const bonusPercentage = useWatch({
    control,
    name: paths.bonusPercentage,
  });

  const maxBonusAmount = useWatch({
    control,
    name: paths.maxBonusAmount,
  });

  const minAmount = useWatch({
    control,
    name: paths.minAmount,
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
            Ver Tracking de Depositos
          </Button>
        </div>
      )}

      <fieldset disabled={readOnly} className="space-y-4">
        {/* Campos segun tipo de valor */}
        {!contributesToRewardValue ? (
          /* VALOR FIJO */
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Configuración de depósito (Valor fijado en la promoción)
            </h4>
            <InputField<T>
              control={control}
              name={paths.targetAmount}
              label="Importe de deposito requerido (EUR)"
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
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Configuración de depósito (Valor calculado)
            </h4>

            {/* Restricciones de deposito */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField<T>
                control={control}
                name={paths.minAmount}
                label="Importe mínimo de depósito (EUR)"
                type="number"
                step={0.01}
                placeholder="20"
                min={0}
                tooltip="Importe mínimo de depósito para calificar"
                required
              />
              <InputField<T>
                control={control}
                name={paths.maxAmount}
                label="Importe máximo de depósito (EUR)"
                type="number"
                step={0.01}
                placeholder="Sin límite"
                min={0}
                tooltip="Límite opcional de depósito (dejar vacío si no hay límite)"
              />
            </div>

            {/* Calculo del bonus */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField<T>
                control={control}
                name={paths.bonusPercentage}
                label="Porcentaje de bonus sobre deposito (%)"
                type="number"
                step={0.01}
                placeholder="100"
                min={0}
                max={500}
                tooltip="% del deposito que se devuelve como bonus (ej: 100% = igual al deposito)"
                required
              />
              <InputField<T>
                control={control}
                name={paths.maxBonusAmount}
                label="Bonus máximo obtenible (EUR)"
                type="number"
                step={0.01}
                placeholder="50"
                min={0}
                tooltip="Límite máximo del bonus generado"
                required
              />
            </div>

            {/* Warning de deposito optimo */}
            {bonusPercentage > 0 && maxBonusAmount > 0 && (
              <div className="rounded-md bg-blue-50 p-3 text-sm dark:bg-blue-950">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Deposito optimo: EUR{(maxBonusAmount / (bonusPercentage / 100)).toFixed(2)}
                </p>
                <p className="mt-1 text-blue-700 dark:text-blue-300">
                  Con {bonusPercentage}% de bonus y máximo de EUR{maxBonusAmount},
                  depositar mas de EUR{(maxBonusAmount / (bonusPercentage / 100)).toFixed(2)} no aumentara el bonus.
                </p>
                {minAmount && minAmount > (maxBonusAmount / (bonusPercentage / 100)) && (
                  <p className="mt-2 font-medium text-amber-700 dark:text-amber-300">
                    Advertencia: El depósito mínimo (EUR{minAmount}) es mayor que el depósito óptimo.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Campos comunes (siempre visibles) */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">
              Configuración adicional
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField<T>
              control={control}
              name={paths.depositCode}
              label="Código promocional de depósito"
              placeholder="WELCOME50"
              tooltip="Código promocional opcional que debe usar el usuario"
            />

            <div className="flex items-end pb-2">
              <SwitchField<T>
                control={control}
                name={paths.firstDepositOnly}
                label="Sólo cuenta el primer depósito para cumplir esta condición"
              />
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  );
}

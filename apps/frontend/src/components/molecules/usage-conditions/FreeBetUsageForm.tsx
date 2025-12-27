"use client";

import type { AvailableTimeframes } from "@matbett/shared";
import { useWatch, FieldValues, Path, useFormContext } from "react-hook-form";

import { CheckboxField, InputField, TextareaField } from "@/components/atoms";
import { TimeframeForm } from "@/components/molecules/TimeframeForm";

interface FreeBetUsageFormProps<T extends FieldValues> {
  basePath: Path<T>;
  availableTimeframes?: AvailableTimeframes;
}

/**
 * Formulario para condiciones de uso de FREEBET
 * Todos los campos planos siguiendo el schema FreeBetUsageConditionsSchema
 */
export function FreeBetUsageForm<T extends FieldValues>({
  basePath,
  availableTimeframes,
}: FreeBetUsageFormProps<T>) {
  const { control } = useFormContext<T>();

  const mustUseComplete = useWatch({
    control,
    name: `${basePath}.mustUseComplete` as Path<T>,
  });

  const allowMultipleBets = useWatch({
    control,
    name: `${basePath}.allowMultipleBets` as Path<T>,
  });

  return (
    <div className="space-y-4">
      {/* Timeframe */}
      <TimeframeForm<T>
        basePath={`${basePath}.timeframe` as Path<T>}
        title="Plazo de uso"
        forceAbsolute={false}
        hideModeSelector={false}
        availableTimeframes={availableTimeframes}
      />

      {/* Comportamiento de uso - campos planos */}
      <CheckboxField<T>
        name={`${basePath}.mustUseComplete` as Path<T>}
        label="Debe usarse en una única apuesta (no fraccionable)"
        tooltip="La freebet NO se puede dividir en múltiples apuestas"
      />
      {!mustUseComplete && (
        <CheckboxField<T>
          name={`${basePath}.lockWinningsUntilFullyUsed` as Path<T>}
          label="Bloquear ganancias hasta usar completamente"
          tooltip="Las ganancias quedan bloqueadas hasta usar todo el saldo"
        />
      )}

      <CheckboxField<T>
        name={`${basePath}.voidConsumesBalance` as Path<T>}
        label="Apuesta anulada consume freebet"
        tooltip="Si una apuesta se anula (void), el saldo de la freebet se pierde"
      />

      <CheckboxField<T>
        name={`${basePath}.allowLiveOddsChanges` as Path<T>}
        label="Permite cambios de cuota en vivo"
        tooltip="La apuesta puede aceptar cambios de cuota durante el evento"
      />

      {/* Restricciones de cuota */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField<T>
          name={`${basePath}.oddsRestriction.minOdds` as Path<T>}
          label="Cuota Mínima"
          type="number"
          step={0.01}
          placeholder="1.50"
          tooltip="Cuota mínima requerida para la apuesta"
        />
        <InputField<T>
          name={`${basePath}.oddsRestriction.maxOdds` as Path<T>}
          label="Cuota Máxima"
          type="number"
          step={0.01}
          placeholder="Sin límite"
          tooltip="Cuota máxima permitida para la apuesta"
        />
      </div>

      {/* Restricciones de stake - solo si puede fraccionarse */}
      {!mustUseComplete && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField<T>
            name={`${basePath}.stakeRestriction.minStake` as Path<T>}
            label="Apuesta Mínima por Uso (€)"
            type="number"
            step={0.01}
            placeholder="10"
            tooltip="Importe mínimo al usar una fracción de la freebet"
          />
          <InputField<T>
            name={`${basePath}.stakeRestriction.maxStake` as Path<T>}
            label="Apuesta Máxima por Uso (€)"
            type="number"
            step={0.01}
            placeholder="Sin límite"
            tooltip="Importe máximo al usar una fracción de la freebet"
          />
        </div>
      )}

      {/* Restricciones de texto */}
      <TextareaField<T>
        name={`${basePath}.betTypeRestrictions` as Path<T>}
        label="Restricciones de tipo"
        placeholder="Ej: Solo apuestas simples"
        rows={2}
      />

      <TextareaField<T>
        name={`${basePath}.selectionRestrictions` as Path<T>}
        label="Restricciones de selección"
        placeholder="Ej: Solo fútbol, ligas principales"
        rows={2}
      />

      {/* Apuestas Combinadas - al final */}
      <CheckboxField<T>
        name={`${basePath}.allowMultipleBets` as Path<T>}
        label="Permite apuestas combinadas"
        tooltip="La apuesta puede ser combinada/múltiple"
      />

      {allowMultipleBets && (
        <div className="grid grid-cols-1 gap-4 rounded-md border border-border/40 bg-muted/20 p-4 md:grid-cols-2">
          <InputField<T>
            name={`${basePath}.multipleBetCondition.minSelections` as Path<T>}
            label="Mínimo de selecciones"
            type="number"
            placeholder="2"
          />
          <InputField<T>
            name={`${basePath}.multipleBetCondition.maxSelections` as Path<T>}
            label="Máximo de selecciones"
            type="number"
            placeholder="Sin límite"
          />
          <InputField<T>
            name={`${basePath}.multipleBetCondition.minOddsPerSelection` as Path<T>}
            label="Cuota mínima por selección"
            type="number"
            step={0.01}
            placeholder="1.20"
          />
          <InputField<T>
            name={`${basePath}.multipleBetCondition.maxOddsPerSelection` as Path<T>}
            label="Cuota máxima por selección"
            type="number"
            step={0.01}
            placeholder="Sin límite"
          />
        </div>
      )}
    </div>
  );
}

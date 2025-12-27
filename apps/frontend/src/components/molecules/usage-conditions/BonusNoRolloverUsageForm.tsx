"use client";

import type { AvailableTimeframes } from "@matbett/shared";
import { useWatch, FieldValues, Path, useFormContext } from "react-hook-form";

import { InputField, CheckboxField } from "@/components/atoms";
import { TimeframeForm } from "@/components/molecules/TimeframeForm";

interface BonusNoRolloverUsageFormProps<T extends FieldValues> {
  basePath: Path<T>;
  availableTimeframes?: AvailableTimeframes;
}

/**
 * Formulario para condiciones de uso de BET_BONUS_NO_ROLLOVER
 * Todos los campos planos siguiendo el schema BonusNoRolloverUsageConditionsSchema
 */
export function BonusNoRolloverUsageForm<T extends FieldValues>({
  basePath,
  availableTimeframes,
}: BonusNoRolloverUsageFormProps<T>) {
  const { control } = useFormContext<T>();

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

      {/* Multiplicador de conversión */}
      <InputField<T>
        name={`${basePath}.maxConversionMultiplier` as Path<T>}
        label="Multiplicador conversión máxima (x)"
        type="number"
        min={0}
        step={0.1}
        placeholder="2"
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

      {/* Restricciones de stake */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField<T>
          name={`${basePath}.stakeRestriction.minStake` as Path<T>}
          label="Apuesta Mínima (€)"
          type="number"
          step={0.01}
          placeholder="10"
        />
        <InputField<T>
          name={`${basePath}.stakeRestriction.maxStake` as Path<T>}
          label="Apuesta Máxima (€)"
          type="number"
          step={0.01}
          placeholder="Sin límite"
        />
      </div>

      {/* Apuestas Combinadas */}
      <CheckboxField<T>
        name={`${basePath}.allowMultipleBets` as Path<T>}
        label="Permitir Apuestas Combinadas"
        tooltip="La apuesta puede ser combinada/múltiple"
      />

      {allowMultipleBets && (
        <div className="grid grid-cols-1 gap-4 rounded-md border border-border/40 bg-muted/20 p-4 md:grid-cols-2">
          <InputField<T>
            name={`${basePath}.multipleBetCondition.minSelections` as Path<T>}
            label="Mínimo Selecciones"
            type="number"
            placeholder="2"
          />
          <InputField<T>
            name={`${basePath}.multipleBetCondition.maxSelections` as Path<T>}
            label="Máximo Selecciones"
            type="number"
            placeholder="Sin límite"
          />
          <InputField<T>
            name={`${basePath}.multipleBetCondition.minOddsPerSelection` as Path<T>}
            label="Cuota Mín. por Selección"
            type="number"
            step={0.01}
            placeholder="1.20"
          />
          <InputField<T>
            name={`${basePath}.multipleBetCondition.maxOddsPerSelection` as Path<T>}
            label="Cuota Máx. por Selección"
            type="number"
            step={0.01}
            placeholder="Sin límite"
          />
        </div>
      )}

      {/* Opciones adicionales */}
      <CheckboxField<T>
        name={`${basePath}.allowLiveOddsChanges` as Path<T>}
        label="Permitir cambios de cuota en vivo"
        tooltip="La apuesta puede aceptar cambios de cuota durante el evento"
      />

      {/* Restricciones de texto */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField<T>
          name={`${basePath}.betTypeRestrictions` as Path<T>}
          label="Restricciones de Tipo"
          type="text"
          placeholder="Ej: Solo apuestas simples"
        />
        <InputField<T>
          name={`${basePath}.selectionRestrictions` as Path<T>}
          label="Restricciones de Selección"
          type="text"
          placeholder="Ej: Solo fútbol"
        />
      </div>
    </div>
  );
}

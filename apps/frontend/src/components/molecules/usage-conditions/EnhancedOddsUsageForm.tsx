"use client";

import type { AvailableTimeframes } from "@matbett/shared";
import { useWatch, FieldValues, Path, useFormContext } from "react-hook-form";

import { InputField, CheckboxField } from "@/components/atoms";
import { TimeframeForm } from "@/components/molecules/TimeframeForm";

interface EnhancedOddsUsageFormProps<T extends FieldValues> {
  basePath: Path<T>;
  availableTimeframes?: AvailableTimeframes;
}

/**
 * Formulario para condiciones de uso de ENHANCED_ODDS
 * Todos los campos planos siguiendo el schema EnhancedOddsUsageConditionsSchema
 */
export function EnhancedOddsUsageForm<T extends FieldValues>({
  basePath,
  availableTimeframes,
}: EnhancedOddsUsageFormProps<T>) {
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

      {/* Cuotas normales y mejoradas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField<T>
          name={`${basePath}.normalOdds` as Path<T>}
          label="Cuota Normal"
          type="number"
          step={0.01}
          placeholder="1.50"
          required
        />
        <InputField<T>
          name={`${basePath}.enhancedOdds` as Path<T>}
          label="Cuota Mejorada"
          type="number"
          step={0.01}
          placeholder="10.0"
          required
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

"use client";

import { requiredBetOutcomeOptions, type AvailableTimeframes } from "@matbett/shared";
import { useWatch, FieldValues, Path, useFormContext } from "react-hook-form";

import { InputField, CheckboxField, SelectField } from "@/components/atoms";
import { TimeframeForm } from "@/components/molecules/TimeframeForm";

interface CashbackUsageFormProps<T extends FieldValues> {
  basePath: Path<T>;
  availableTimeframes?: AvailableTimeframes;
}

/**
 * Formulario para condiciones de uso de CASHBACK_FREEBET
 * Todos los campos planos siguiendo el schema CashbackUsageConditionsSchema
 */
export function CashbackUsageForm<T extends FieldValues>({
  basePath,
  availableTimeframes,
}: CashbackUsageFormProps<T>) {
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

      {/* Configuración del cashback */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField<T>
          name={`${basePath}.cashbackPercentage` as Path<T>}
          label="Porcentaje Cashback"
          type="number"
          placeholder="100"
          required
        />
        <InputField<T>
          name={`${basePath}.maxCashbackAmount` as Path<T>}
          label="Cashback Máximo"
          type="number"
          placeholder="50"
          required
        />
      </div>

      {/* Restricciones de cuota */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField<T>
          name={`${basePath}.oddsRestriction.minOdds` as Path<T>}
          label="Cuota Mínima"
          type="number"
          step={0.01}
          placeholder="1.50"
        />
        <InputField<T>
          name={`${basePath}.oddsRestriction.maxOdds` as Path<T>}
          label="Cuota Máxima"
          type="number"
          step={0.01}
          placeholder="Sin límite"
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

      {/* Resultado Requerido */}
      <SelectField<T>
        name={`${basePath}.requiredBetOutcome` as Path<T>}
        label="Resultado Requerido"
        options={requiredBetOutcomeOptions}
        tooltip="Resultado que debe tener la apuesta para contar"
      />

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

      {/* Opciones adicionales */}
      <CheckboxField<T>
        name={`${basePath}.allowLiveOddsChanges` as Path<T>}
        label="Permitir cambios de cuota en vivo"
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

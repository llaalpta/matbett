"use client";

import type { AvailableTimeframes } from "@matbett/shared";
import { FieldValues, Path, useFormContext } from "react-hook-form";

import { InputField } from "@/components/atoms";
import { TimeframeForm } from "@/components/molecules/TimeframeForm";

interface CasinoSpinsUsageFormProps<T extends FieldValues> {
  basePath: Path<T>;
  availableTimeframes?: AvailableTimeframes;
}

/**
 * Formulario para condiciones de uso de CASINO_SPINS
 * Todos los campos planos siguiendo el schema CasinoSpinsUsageConditionsSchema
 */
export function CasinoSpinsUsageForm<T extends FieldValues>({
  basePath,
  availableTimeframes,
}: CasinoSpinsUsageFormProps<T>) {
  useFormContext<T>(); // Ensure context is available

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

      {/* Configuración de tiradas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField<T>
          name={`${basePath}.spinsCount` as Path<T>}
          label="Número de Tiradas"
          type="number"
          min={1}
          step={1}
          placeholder="10"
          required
        />
        <InputField<T>
          name={`${basePath}.gameTitle` as Path<T>}
          label="Juego Específico"
          type="text"
          placeholder="Ej: Starburst"
        />
      </div>
    </div>
  );
}

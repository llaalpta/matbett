"use client";

import type { AnchorCatalog, AnchorOccurrences } from "@matbett/shared";
import { FieldValues, Path, useFormContext } from "react-hook-form";

import { InputField } from "@/components/atoms";
import { TimeframeForm, type TimeframePaths } from "@/components/molecules/TimeframeForm";

export interface CasinoSpinsUsageFormPaths<T extends FieldValues> {
  timeframe: TimeframePaths<T>;
  spinsCount: Path<T>;
  gameTitle: Path<T>;
}

interface CasinoSpinsUsageFormProps<T extends FieldValues> {
  paths: CasinoSpinsUsageFormPaths<T>;
  anchorCatalog?: AnchorCatalog;
  anchorOccurrences?: AnchorOccurrences;
}

/**
 * Formulario para condiciones de uso de CASINO_SPINS
 * Todos los campos planos siguiendo el schema CasinoSpinsUsageConditionsSchema
 */
export function CasinoSpinsUsageForm<T extends FieldValues>({
  paths,
  anchorCatalog,
  anchorOccurrences,
}: CasinoSpinsUsageFormProps<T>) {
  useFormContext<T>(); // Ensure context is available

  return (
    <div className="space-y-4">
      {/* Timeframe */}
      <TimeframeForm<T>
        paths={paths.timeframe}
        title="Plazo de uso"
        forceAbsolute={false}
        hideModeSelector={false}
        anchorCatalog={anchorCatalog}
        anchorOccurrences={anchorOccurrences}
      />

      {/* Configuracion de tiradas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField<T>
          name={paths.spinsCount}
          label="Número de tiradas"
          type="number"
          min={1}
          step={1}
          placeholder="10"
          required
        />
        <InputField<T>
          name={paths.gameTitle}
          label="Juego específico"
          type="text"
          placeholder="Ej: Starburst"
        />
      </div>
    </div>
  );
}


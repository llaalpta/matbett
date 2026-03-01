"use client";

import type { AnchorCatalog, AnchorOccurrences } from "@matbett/shared";
import { useWatch, FieldValues, Path, useFormContext } from "react-hook-form";

import { CheckboxField } from "@/components/atoms";
import {
  BetLiveOddsCheckbox,
  BetMultipleBetsFields,
  BetOddsRestrictionFields,
  BetStakeRestrictionFields,
  BetTextRestrictionsFields,
  type BetRestrictionsPaths,
} from "@/components/molecules/BetRestrictionsBlock";
import { TimeframeForm } from "@/components/molecules/TimeframeForm";
import type { TimeframePaths } from "@/components/molecules/TimeframeForm";

export interface FreeBetUsageFormPaths<T extends FieldValues>
  extends BetRestrictionsPaths<T> {
  timeframe: TimeframePaths<T>;
  mustUseComplete: Path<T>;
  lockWinningsUntilFullyUsed: Path<T>;
  voidConsumesBalance: Path<T>;
  allowLiveOddsChanges: Path<T>;
  oddsMin: Path<T>;
  oddsMax: Path<T>;
  stakeMin: Path<T>;
  stakeMax: Path<T>;
  betTypeRestrictions: Path<T>;
  selectionRestrictions: Path<T>;
  otherRestrictions: Path<T>;
  allowMultipleBets: Path<T>;
  multipleMinSelections: Path<T>;
  multipleMaxSelections: Path<T>;
  multipleMinOddsPerSelection: Path<T>;
  multipleMaxOddsPerSelection: Path<T>;
}

interface FreeBetUsageFormProps<T extends FieldValues> {
  paths: FreeBetUsageFormPaths<T>;
  anchorCatalog?: AnchorCatalog;
  anchorOccurrences?: AnchorOccurrences;
}

/**
 * Formulario para condiciones de uso de FREEBET
 * Todos los campos planos siguiendo el schema FreeBetUsageConditionsSchema
 */
export function FreeBetUsageForm<T extends FieldValues>({
  paths,
  anchorCatalog,
  anchorOccurrences,
}: FreeBetUsageFormProps<T>) {
  const { control } = useFormContext<T>();

  const mustUseComplete = useWatch({
    control,
    name: paths.mustUseComplete,
  });

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

      {/* Comportamiento de uso - campos planos */}
      <CheckboxField<T>
        name={paths.mustUseComplete}
        label="Debe usarse en una única apuesta (no fraccionable)"
        tooltip="La freebet NO se puede dividir en multiples apuestas"
      />
      {!mustUseComplete && (
        <CheckboxField<T>
          name={paths.lockWinningsUntilFullyUsed}
          label="Bloquear ganancias hasta usar completamente"
          tooltip="Las ganancias quedan bloqueadas hasta usar todo el saldo"
        />
      )}

      <CheckboxField<T>
        name={paths.voidConsumesBalance}
        label="Si se anula la apuesta se consume la freebet"
        tooltip="Si una apuesta se anula (void), el saldo de la freebet se pierde"
      />

      <BetLiveOddsCheckbox<T> path={paths.allowLiveOddsChanges} />

      {!mustUseComplete ? (
        <BetStakeRestrictionFields<T>
          paths={{
            stakeMin: paths.stakeMin,
            stakeMax: paths.stakeMax,
          }}
        />
      ) : null}

      <BetOddsRestrictionFields<T>
        paths={{
          oddsMin: paths.oddsMin,
          oddsMax: paths.oddsMax,
        }}
      />

      <BetMultipleBetsFields<T>
        paths={{
          allowMultipleBets: paths.allowMultipleBets,
          multipleMinSelections: paths.multipleMinSelections,
          multipleMaxSelections: paths.multipleMaxSelections,
          multipleMinOddsPerSelection: paths.multipleMinOddsPerSelection,
          multipleMaxOddsPerSelection: paths.multipleMaxOddsPerSelection,
        }}
      />

      <BetTextRestrictionsFields<T>
        paths={{
          betTypeRestrictions: paths.betTypeRestrictions,
          selectionRestrictions: paths.selectionRestrictions,
          otherRestrictions: paths.otherRestrictions,
        }}
      />
    </div>
  );
}


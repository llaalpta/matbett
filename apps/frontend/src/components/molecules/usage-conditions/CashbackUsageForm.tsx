"use client";

import type { AnchorCatalog, AnchorOccurrences } from "@matbett/shared";
import { FieldValues, Path } from "react-hook-form";

import {
  BetLiveOddsCheckbox,
  BetMultipleBetsFields,
  BetOddsRestrictionFields,
  BetRequiredOutcomeField,
  BetStakeRestrictionFields,
  BetTextRestrictionsFields,
  type BetRestrictionsPaths,
} from "@/components/molecules/BetRestrictionsBlock";
import { TimeframeForm, type TimeframePaths } from "@/components/molecules/TimeframeForm";

export interface CashbackUsageFormPaths<T extends FieldValues>
  extends BetRestrictionsPaths<T> {
  timeframe: TimeframePaths<T>;
  allowMultipleBets: Path<T>;
  oddsMin: Path<T>;
  oddsMax: Path<T>;
  stakeMin: Path<T>;
  stakeMax: Path<T>;
  requiredBetOutcome: Path<T>;
  multipleMinSelections: Path<T>;
  multipleMaxSelections: Path<T>;
  multipleMinOddsPerSelection: Path<T>;
  multipleMaxOddsPerSelection: Path<T>;
  allowLiveOddsChanges: Path<T>;
  betTypeRestrictions: Path<T>;
  selectionRestrictions: Path<T>;
  otherRestrictions: Path<T>;
}

interface CashbackUsageFormProps<T extends FieldValues> {
  paths: CashbackUsageFormPaths<T>;
  anchorCatalog?: AnchorCatalog;
  anchorOccurrences?: AnchorOccurrences;
}

/**
 * Formulario para condiciones de uso de CASHBACK_FREEBET
 * Todos los campos planos siguiendo el schema CashbackUsageConditionsSchema
 */
export function CashbackUsageForm<T extends FieldValues>({
  paths,
  anchorCatalog,
  anchorOccurrences,
}: CashbackUsageFormProps<T>) {
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

      <BetStakeRestrictionFields<T>
        paths={{
          stakeMin: paths.stakeMin,
          stakeMax: paths.stakeMax,
        }}
      />

      <BetOddsRestrictionFields<T>
        paths={{
          oddsMin: paths.oddsMin,
          oddsMax: paths.oddsMax,
        }}
      />

      <BetRequiredOutcomeField<T> path={paths.requiredBetOutcome} />
      <BetLiveOddsCheckbox<T> path={paths.allowLiveOddsChanges} />

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


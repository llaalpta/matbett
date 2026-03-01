"use client";

import type { AnchorCatalog, AnchorOccurrences } from "@matbett/shared";
import { FieldValues, Path } from "react-hook-form";

import { CheckboxField, InputField } from "@/components/atoms";
import {
  BetLiveOddsCheckbox,
  BetMultipleBetsFields,
  BetOddsRestrictionFields,
  BetOnlyFirstBetCheckbox,
  BetRequiredOutcomeField,
  BetStakeRestrictionFields,
  BetTextRestrictionsFields,
  type BetRestrictionsPaths,
} from "@/components/molecules/BetRestrictionsBlock";
import {
  TimeframeForm,
  type TimeframePaths,
} from "@/components/molecules/TimeframeForm";

export interface BonusNoRolloverUsageFormPaths<T extends FieldValues>
  extends BetRestrictionsPaths<T> {
  timeframe: TimeframePaths<T>;
  allowMultipleBets: Path<T>;
  maxConversionMultiplier: Path<T>;
  maxConvertibleAmount: Path<T>;
  returnedBetsCountForUsage: Path<T>;
  cashoutBetsCountForUsage: Path<T>;
  requireResolvedWithinTimeframe: Path<T>;
  countOnlySettledBets: Path<T>;
  onlyFirstBetCounts: Path<T>;
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

interface BonusNoRolloverUsageFormProps<T extends FieldValues> {
  paths: BonusNoRolloverUsageFormPaths<T>;
  anchorCatalog?: AnchorCatalog;
  anchorOccurrences?: AnchorOccurrences;
}

/**
 * Formulario para condiciones de uso de BET_BONUS_NO_ROLLOVER
 * Todos los campos planos siguiendo el schema BonusNoRolloverUsageConditionsSchema
 */
export function BonusNoRolloverUsageForm<T extends FieldValues>({
  paths,
  anchorCatalog,
  anchorOccurrences,
}: BonusNoRolloverUsageFormProps<T>) {
  return (
    <div className="space-y-4">
      <TimeframeForm<T>
        paths={paths.timeframe}
        title="Plazo de uso"
        forceAbsolute={false}
        hideModeSelector={false}
        anchorCatalog={anchorCatalog}
        anchorOccurrences={anchorOccurrences}
      />

      <div className="space-y-4 rounded-md border border-border/40 bg-muted/20 p-4">
        <h4 className="text-sm font-medium text-muted-foreground">
          Reglas de cómputo y operativa
        </h4>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <CheckboxField<T>
            name={paths.countOnlySettledBets}
            label="Sólo cuentan para el uso del bono las apuestas liquidadas"
          />
          <CheckboxField<T>
            name={paths.requireResolvedWithinTimeframe}
            label="Sólo cuentan para el uso del bono las apuestas liquidadas dentro del plazo"
          />
          <CheckboxField<T>
            name={paths.returnedBetsCountForUsage}
            label="Las apuestas devueltas cuentan para el uso del bono"
          />
          <CheckboxField<T>
            name={paths.cashoutBetsCountForUsage}
            label="Las apuestas con cashout cuentan para el uso del bono"
          />
          <BetOnlyFirstBetCheckbox<T> path={paths.onlyFirstBetCounts} />
          <BetLiveOddsCheckbox<T> path={paths.allowLiveOddsChanges} />
        </div>

      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField<T>
          name={paths.maxConversionMultiplier}
          label="Multiplicador de conversión máxima (x)"
          type="number"
          min={0}
          step={0.1}
          placeholder="2"
        />
        <InputField<T>
          name={paths.maxConvertibleAmount}
          label="Máximo convertible a saldo real (EUR)"
          type="number"
          step={0.01}
          min={0}
          placeholder="Sin límite"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BetRequiredOutcomeField<T> path={paths.requiredBetOutcome} />
      </div>

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

"use client";

import {
  enhancedOddsModeOptions,
  type AnchorCatalog,
  type AnchorOccurrences,
} from "@matbett/shared";
import {
  FieldValues,
  Path,
  useController,
  useFormContext,
} from "react-hook-form";

import { InputField, SelectField } from "@/components/atoms";
import {
  BetLiveOddsCheckbox,
  BetMultipleBetsFields,
  BetStakeRestrictionFields,
  BetTextRestrictionsFields,
  type BetRestrictionsPaths,
} from "@/components/molecules/BetRestrictionsBlock";
import { TimeframeForm, type TimeframePaths } from "@/components/molecules/TimeframeForm";
import { toFiniteNumber } from "@/utils/numberHelpers";

export interface EnhancedOddsUsageFormPaths<T extends FieldValues>
  extends BetRestrictionsPaths<T> {
  timeframe: TimeframePaths<T>;
  allowMultipleBets: Path<T>;
  normalOdds: Path<T>;
  enhancedOdds: Path<T>;
  enhancedOddsMode: Path<T>;
  enhancementPercentage: Path<T>;
  stakeMin: Path<T>;
  stakeMax: Path<T>;
  multipleMinSelections: Path<T>;
  multipleMaxSelections: Path<T>;
  multipleMinOddsPerSelection: Path<T>;
  multipleMaxOddsPerSelection: Path<T>;
  allowLiveOddsChanges: Path<T>;
  betTypeRestrictions: Path<T>;
  selectionRestrictions: Path<T>;
  otherRestrictions: Path<T>;
}

interface EnhancedOddsUsageFormProps<T extends FieldValues> {
  paths: EnhancedOddsUsageFormPaths<T>;
  anchorCatalog?: AnchorCatalog;
  anchorOccurrences?: AnchorOccurrences;
}

/**
 * Formulario para condiciones de uso de ENHANCED_ODDS
 * Todos los campos planos siguiendo el schema EnhancedOddsUsageConditionsSchema
 */
export function EnhancedOddsUsageForm<T extends FieldValues>({
  paths,
  anchorCatalog,
  anchorOccurrences,
}: EnhancedOddsUsageFormProps<T>) {
  const { control } = useFormContext<T>();
  const normalOddsController = useController({
    control,
    name: paths.normalOdds,
  });
  const enhancedOddsController = useController({
    control,
    name: paths.enhancedOdds,
  });
  const enhancedOddsModeController = useController({
    control,
    name: paths.enhancedOddsMode,
  });
  const enhancementPercentageController = useController({
    control,
    name: paths.enhancementPercentage,
  });

  const modeValue =
    enhancedOddsModeController.field.value === "PERCENTAGE"
      ? "PERCENTAGE"
      : "FIXED";

  const recalculateEnhancedOdds = (
    nextNormalOdds?: unknown,
    nextEnhancementPercentage?: unknown
  ) => {
    if (modeValue !== "PERCENTAGE") {
      return;
    }

    const normalOddsValue = toFiniteNumber(
      nextNormalOdds ?? normalOddsController.field.value
    );
    const enhancementPercentageValue = toFiniteNumber(
      nextEnhancementPercentage ?? enhancementPercentageController.field.value
    );
    if (
      normalOddsValue === undefined ||
      enhancementPercentageValue === undefined
    ) {
      return;
    }

    const calculatedEnhancedOdds = Number(
      (normalOddsValue * (1 + enhancementPercentageValue / 100)).toFixed(2)
    );

    const currentEnhancedOdds = toFiniteNumber(
      enhancedOddsController.field.value
    );
    if (currentEnhancedOdds !== calculatedEnhancedOdds) {
      enhancedOddsController.field.onChange(calculatedEnhancedOdds);
    }
  };

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField<T>
          name={paths.enhancedOddsMode}
          label="Modo de cuota mejorada"
          options={enhancedOddsModeOptions}
          onValueChange={(value) => {
            if (value === "PERCENTAGE") {
              recalculateEnhancedOdds();
            }
          }}
        />
        {modeValue === "PERCENTAGE" ? (
          <InputField<T>
            name={paths.enhancementPercentage}
            label="Porcentaje de mejora sobre cuota inicial (%)"
            type="number"
            step={0.01}
            min={0}
            placeholder="10"
            required
            onValueChange={(value) => {
              recalculateEnhancedOdds(undefined, value);
            }}
          />
        ) : (
          <div />
        )}
      </div>

      {/* Cuotas normales y mejoradas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField<T>
          name={paths.normalOdds}
          label="Cuota Normal"
          type="number"
          step={0.01}
          placeholder="1.50"
          required
          onValueChange={(value) => {
            recalculateEnhancedOdds(value, undefined);
          }}
        />
        <InputField<T>
          name={paths.enhancedOdds}
          label="Cuota Mejorada"
          type="number"
          step={0.01}
          placeholder="2.20"
          disabled={modeValue === "PERCENTAGE"}
          required
        />
      </div>

      <BetStakeRestrictionFields<T>
        paths={{
          stakeMin: paths.stakeMin,
          stakeMax: paths.stakeMax,
        }}
      />

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


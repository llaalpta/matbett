"use client";

import { cashbackCalculationMethodOptions } from "@matbett/shared";
import { Control, FieldValues, Path, useWatch } from "react-hook-form";

import { CheckboxField, InputField, SelectField } from "@/components/atoms";
import {
  BetLiveOddsCheckbox,
  BetOddsRestrictionFields,
  BetOnlyFirstBetCheckbox,
  BetRequiredOutcomeField,
  BetStakeRestrictionFields,
  BetTextRestrictionsFields,
  type BetRestrictionsPaths,
} from "@/components/molecules/BetRestrictionsBlock";

export interface LossesCashbackConditionPaths<T extends FieldValues>
  extends BetRestrictionsPaths<T> {
  cashbackPercentage: Path<T>;
  maxCashbackAmount: Path<T>;
  calculationMethod: Path<T>;
  calculationPeriod: Path<T>;
  returnedBetsCountForCashback: Path<T>;
  cashoutBetsCountForCashback: Path<T>;
  countOnlySettledBets: Path<T>;
  stakeMin: Path<T>;
  stakeMax: Path<T>;
  oddsMin: Path<T>;
  oddsMax: Path<T>;
  requiredBetOutcome: Path<T>;
  allowLiveOddsChanges: Path<T>;
  onlyFirstBetCounts: Path<T>;
  allowMultipleBets: Path<T>;
  multipleMinSelections: Path<T>;
  multipleMaxSelections: Path<T>;
  multipleMinOddsPerSelection: Path<T>;
  multipleMaxOddsPerSelection: Path<T>;
  betTypeRestrictions: Path<T>;
  selectionRestrictions: Path<T>;
  otherRestrictions: Path<T>;
}

interface LossesCashbackConditionProps<T extends FieldValues> {
  control: Control<T>;
  paths: LossesCashbackConditionPaths<T>;
}

export function LossesCashbackCondition<T extends FieldValues>({
  control,
  paths,
}: LossesCashbackConditionProps<T>) {
  const allowMultipleBets = useWatch({
    control,
    name: paths.allowMultipleBets,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <CheckboxField<T>
          control={control}
          name={paths.countOnlySettledBets}
          label="Sólo cuentan para cashback las apuestas liquidadas"
        />
        <CheckboxField<T>
          control={control}
          name={paths.returnedBetsCountForCashback}
          label="Las apuestas devueltas cuentan para cashback"
        />
        <CheckboxField<T>
          control={control}
          name={paths.cashoutBetsCountForCashback}
          label="Las apuestas con cashout cuentan para cashback"
        />
        <BetLiveOddsCheckbox<T> path={paths.allowLiveOddsChanges} />
        <BetOnlyFirstBetCheckbox<T> path={paths.onlyFirstBetCounts} />
        <CheckboxField<T>
          control={control}
          name={paths.allowMultipleBets}
          label="Se permiten apuestas combinadas"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField<T>
          control={control}
          name={paths.cashbackPercentage}
          label="Porcentaje de cashback aplicado (%)"
          type="number"
          placeholder="100"
          min={0}
          max={100}
          step={1}
          tooltip="Porcentaje entero (0-100) aplicado sobre la base de calculo seleccionada."
          required
        />
        <InputField<T>
          control={control}
          name={paths.maxCashbackAmount}
          label="Cashback máximo obtenible (EUR)"
          type="number"
          placeholder="50"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField<T>
          control={control}
          name={paths.calculationMethod}
          label="Base de calculo del cashback"
          tooltip="Define sobre que importe se aplica el porcentaje de cashback."
          options={cashbackCalculationMethodOptions}
          required
        />
        <InputField<T>
          control={control}
          name={paths.calculationPeriod}
          label="Periodo de calculo de perdidas"
          placeholder="Ej: fin de semana, lunes a viernes"
        />
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
      <BetRequiredOutcomeField<T> path={paths.requiredBetOutcome} />

      {allowMultipleBets ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField<T>
            control={control}
            name={paths.multipleMinSelections}
            label="Número mínimo de selecciones en apuestas combinadas"
            type="number"
            placeholder="2"
          />
          <InputField<T>
            control={control}
            name={paths.multipleMaxSelections}
            label="Numero máximo de selecciones en apuestas combinadas"
            type="number"
            placeholder="Sin límite"
          />
          <InputField<T>
            control={control}
            name={paths.multipleMinOddsPerSelection}
            label="Cuota mínima permitida por selección en apuestas combinadas"
            type="number"
            step={0.01}
            placeholder="1.20"
          />
          <InputField<T>
            control={control}
            name={paths.multipleMaxOddsPerSelection}
            label="Cuota máxima permitida por selección en apuestas combinadas"
            type="number"
            step={0.01}
            placeholder="Sin límite"
          />
        </div>
      ) : null}

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

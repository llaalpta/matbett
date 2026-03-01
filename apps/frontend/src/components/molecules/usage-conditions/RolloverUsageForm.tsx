"use client";

import {
  rolloverContributionWalletOptions,
  type AnchorCatalog,
  type AnchorOccurrences,
} from "@matbett/shared";
import { useEffect, useMemo } from "react";
import {
  useWatch,
  FieldValues,
  Path,
  useController,
  useFormContext,
} from "react-hook-form";

import { InputField, CheckboxField, SelectField } from "@/components/atoms";
import {
  BetLiveOddsCheckbox,
  BetMultipleBetsFields,
  BetOddsRestrictionFields,
  BetRequiredOutcomeField,
  BetStakeRestrictionFields,
  BetTextRestrictionsFields,
  type BetRestrictionsPaths,
} from "@/components/molecules/BetRestrictionsBlock";
import { RolloverAnalysisPanel } from "@/components/molecules/RolloverAnalysisPanel";
import { TimeframeForm, type TimeframePaths } from "@/components/molecules/TimeframeForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRolloverProfitabilityCalculation } from "@/hooks/useRolloverProfitabilityCalculation";
import { toFiniteNumber } from "@/utils/numberHelpers";

export interface RolloverUsageFormPaths<T extends FieldValues>
  extends BetRestrictionsPaths<T> {
  timeframe: TimeframePaths<T>;
  multiplier: Path<T>;
  maxConversionMultiplier: Path<T>;
  expectedLossPercentage: Path<T>;
  minBetsRequired: Path<T>;
  bonusCanBeUsedForBetting: Path<T>;
  rolloverContributionWallet: Path<T>;
  realMoneyUsageRatio: Path<T>;
  noWithdrawalsAllowedDuringRollover: Path<T>;
  bonusCancelledOnWithdrawal: Path<T>;
  allowDepositsAfterActivation: Path<T>;
  returnedBetsCountForRollover: Path<T>;
  cashoutBetsCountForRollover: Path<T>;
  requireResolvedWithinTimeframe: Path<T>;
  countOnlySettledBets: Path<T>;
  maxConvertibleAmount: Path<T>;
  stakeMin: Path<T>;
  stakeMax: Path<T>;
  oddsMin: Path<T>;
  oddsMax: Path<T>;
  requiredBetOutcome: Path<T>;
  allowLiveOddsChanges: Path<T>;
  allowMultipleBets: Path<T>;
  multipleMinSelections: Path<T>;
  multipleMaxSelections: Path<T>;
  multipleMinOddsPerSelection: Path<T>;
  multipleMaxOddsPerSelection: Path<T>;
  betTypeRestrictions: Path<T>;
  selectionRestrictions: Path<T>;
  otherRestrictions: Path<T>;
}

interface RolloverUsageFormProps<T extends FieldValues> {
  paths: RolloverUsageFormPaths<T>;
  anchorCatalog?: AnchorCatalog;
  anchorOccurrences?: AnchorOccurrences;
  rewardValueForAnalysis?: number;
  depositRequiredForAnalysis?: number;
}

/**
 * Formulario para condiciones de uso de BET_BONUS_ROLLOVER
 * Todos los campos planos siguiendo el schema BonusRolloverUsageConditionsSchema
 */
export function RolloverUsageForm<T extends FieldValues>({
  paths,
  anchorCatalog,
  anchorOccurrences,
  rewardValueForAnalysis,
  depositRequiredForAnalysis,
}: RolloverUsageFormProps<T>) {
  const { control, getValues } = useFormContext<T>();
  const bonusWalletController = useController({
    control,
    name: paths.bonusCanBeUsedForBetting,
  });
  const withdrawalCancelController = useController({
    control,
    name: paths.bonusCancelledOnWithdrawal,
  });
  const realMoneyUsageRatioController = useController({
    control,
    name: paths.realMoneyUsageRatio,
  });
  const rolloverWalletController = useController({
    control,
    name: paths.rolloverContributionWallet,
  });

  const multiplier = useWatch({
    control,
    name: paths.multiplier,
  });
  const maxConversionMultiplier = useWatch({
    control,
    name: paths.maxConversionMultiplier,
  });
  const expectedLossPercentage = useWatch({
    control,
    name: paths.expectedLossPercentage,
  });
  const minBetsRequired = useWatch({
    control,
    name: paths.minBetsRequired,
  });
  const rolloverContributionWallet = useWatch({
    control,
    name: paths.rolloverContributionWallet,
  });
  const noWithdrawalsAllowedDuringRollover = useWatch({
    control,
    name: paths.noWithdrawalsAllowedDuringRollover,
  });
  const bonusCancelledOnWithdrawal = useWatch({
    control,
    name: paths.bonusCancelledOnWithdrawal,
  });
  const allowDepositsAfterActivation = useWatch({
    control,
    name: paths.allowDepositsAfterActivation,
  });
  const returnedBetsCountForRollover = useWatch({
    control,
    name: paths.returnedBetsCountForRollover,
  });
  const cashoutBetsCountForRollover = useWatch({
    control,
    name: paths.cashoutBetsCountForRollover,
  });
  const requireResolvedWithinTimeframe = useWatch({
    control,
    name: paths.requireResolvedWithinTimeframe,
  });
  const countOnlySettledBets = useWatch({
    control,
    name: paths.countOnlySettledBets,
  });
  const maxConvertibleAmount = useWatch({
    control,
    name: paths.maxConvertibleAmount,
  });
  const otherRestrictions = useWatch({
    control,
    name: paths.otherRestrictions,
  });
  const minOdds = useWatch({
    control,
    name: paths.oddsMin,
  });
  const maxOdds = useWatch({
    control,
    name: paths.oddsMax,
  });
  const minStake = useWatch({
    control,
    name: paths.stakeMin,
  });
  const maxStake = useWatch({
    control,
    name: paths.stakeMax,
  });
  const bonusCanBeUsedForBetting = useWatch({
    control,
    name: paths.bonusCanBeUsedForBetting,
  });
  const requiredBetOutcome = useWatch({
    control,
    name: paths.requiredBetOutcome,
  });
  const realMoneyUsageRatio = useWatch({
    control,
    name: paths.realMoneyUsageRatio,
  });
  const bonusCanBeUsedForBettingValue =
    bonusCanBeUsedForBetting ?? getValues(paths.bonusCanBeUsedForBetting);
  const rolloverContributionWalletValue =
    rolloverContributionWallet ?? getValues(paths.rolloverContributionWallet);

  useEffect(() => {
    if (bonusCanBeUsedForBettingValue === false) {
      if (rolloverContributionWalletValue !== "REAL_ONLY") {
        rolloverWalletController.field.onChange("REAL_ONLY");
      }
      const ratioValue =
        toFiniteNumber(realMoneyUsageRatio) ??
        toFiniteNumber(getValues(paths.realMoneyUsageRatio));
      if (ratioValue !== 100) {
        realMoneyUsageRatioController.field.onChange(100);
      }
    }
  }, [
    bonusCanBeUsedForBettingValue,
    rolloverContributionWalletValue,
    realMoneyUsageRatio,
    rolloverWalletController.field,
    realMoneyUsageRatioController.field,
    paths.realMoneyUsageRatio,
    getValues,
  ]);

  const rolloverWalletOptions = useMemo(() => {
    if (bonusCanBeUsedForBettingValue === false) {
      return rolloverContributionWalletOptions.filter(
        (option) => option.value === "REAL_ONLY"
      );
    }
    return rolloverContributionWalletOptions;
  }, [bonusCanBeUsedForBettingValue]);

  // RHF can return `undefined` in transient renders even with defaults.
  // Resolve with current form value before deciding "analysis incomplete".
  const multiplierNumber =
    toFiniteNumber(multiplier) ?? toFiniteNumber(getValues(paths.multiplier));
  const expectedLossPercentageNumber =
    toFiniteNumber(expectedLossPercentage) ??
    toFiniteNumber(getValues(paths.expectedLossPercentage));
  const minBetsRequiredNumber =
    toFiniteNumber(minBetsRequired) ??
    toFiniteNumber(getValues(paths.minBetsRequired));
  const minOddsNumber =
    toFiniteNumber(minOdds) ?? toFiniteNumber(getValues(paths.oddsMin));
  const maxOddsNumber =
    toFiniteNumber(maxOdds) ?? toFiniteNumber(getValues(paths.oddsMax));
  const minStakeNumber =
    toFiniteNumber(minStake) ?? toFiniteNumber(getValues(paths.stakeMin));
  const maxStakeNumber =
    toFiniteNumber(maxStake) ?? toFiniteNumber(getValues(paths.stakeMax));
  const maxConversionMultiplierNumber =
    toFiniteNumber(maxConversionMultiplier) ??
    toFiniteNumber(getValues(paths.maxConversionMultiplier));
  const maxConvertibleAmountNumber =
    toFiniteNumber(maxConvertibleAmount) ??
    toFiniteNumber(getValues(paths.maxConvertibleAmount));
  const realMoneyUsageRatioNumber =
    toFiniteNumber(realMoneyUsageRatio) ??
    toFiniteNumber(getValues(paths.realMoneyUsageRatio));

  // Obtener datos para el analisis de rentabilidad
  const rolloverData = {
    multiplier: multiplierNumber,
    maxConversionMultiplier: maxConversionMultiplierNumber,
    expectedLossPercentage: expectedLossPercentageNumber,
    minBetsRequired: minBetsRequiredNumber,
    rolloverContributionWallet: rolloverContributionWalletValue,
    realMoneyUsageRatio: realMoneyUsageRatioNumber,
    noWithdrawalsAllowedDuringRollover,
    bonusCancelledOnWithdrawal,
    allowDepositsAfterActivation,
    returnedBetsCountForRollover,
    cashoutBetsCountForRollover,
    requireResolvedWithinTimeframe,
    countOnlySettledBets,
    otherRestrictions,
    bonusCanBeUsedForBetting: bonusCanBeUsedForBettingValue,
    requiredBetOutcome,
    // Campos aplanados de bet restrictions
    minOdds: minOddsNumber,
    maxOdds: maxOddsNumber,
    minStake: minStakeNumber,
    maxStake: maxStakeNumber,
    bonusValue: rewardValueForAnalysis ?? 0,
    depositRequired: depositRequiredForAnalysis ?? 0,
    maxConvertibleAmount: maxConvertibleAmountNumber,
  };

  const calculatedAnalysis = useRolloverProfitabilityCalculation({
    ...rolloverData,
    multiplier: rolloverData.multiplier,
    maxConversionMultiplier: rolloverData.maxConversionMultiplier,
  });

  const missingAnalysisFields: string[] = [];
  if (!rewardValueForAnalysis || rewardValueForAnalysis <= 0) {
    missingAnalysisFields.push("valor de la recompensa");
  }
  if (!multiplierNumber || multiplierNumber <= 0) {
    missingAnalysisFields.push("rollover (x)");
  }
  if (
    expectedLossPercentageNumber === undefined ||
    expectedLossPercentageNumber < 0
  ) {
    missingAnalysisFields.push("perdida esperada (%)");
  }

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

      {/* Reglas de computo y operativa */}
      <div className="space-y-4 rounded-md border border-border/40 bg-muted/20 p-4">
        <h4 className="text-sm font-medium text-muted-foreground">
          Reglas de computo y operativa
        </h4>

        <CheckboxField<T>
          name={paths.bonusCanBeUsedForBetting}
          label="El bono se puede usar para apostar"
          onValueChange={(checked) => {
            if (!checked) {
              rolloverWalletController.field.onChange("REAL_ONLY");
              realMoneyUsageRatioController.field.onChange(100);
            }
          }}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField<T>
            name={paths.rolloverContributionWallet}
            label="Tipo de saldo que cuenta para cumplir el rollover"
            options={rolloverWalletOptions}
            tooltip="MIXED: cuentan ambos saldos. BONUS_ONLY: sólo saldo bono. REAL_ONLY: sólo saldo real."
            onValueChange={(value) => {
              if (
                (value === "BONUS_ONLY" || value === "MIXED") &&
                bonusCanBeUsedForBettingValue === false
              ) {
                bonusWalletController.field.onChange(true);
              }
              if (value === "REAL_ONLY") {
                realMoneyUsageRatioController.field.onChange(100);
                return;
              }
              if (value === "BONUS_ONLY") {
                realMoneyUsageRatioController.field.onChange(0);
                return;
              }
              if (value === "MIXED") {
                const ratioValue =
                  toFiniteNumber(realMoneyUsageRatio) ??
                  toFiniteNumber(getValues(paths.realMoneyUsageRatio));
                if (ratioValue === undefined) {
                  realMoneyUsageRatioController.field.onChange(50);
                }
              }
            }}
          />
          <InputField<T>
            name={paths.realMoneyUsageRatio}
            label="Proporción de saldo real usado por apuesta (%)"
            type="number"
            min={0}
            max={100}
            step={1}
            placeholder="50"
            disabled={rolloverContributionWalletValue !== "MIXED"}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <CheckboxField<T>
            name={paths.allowDepositsAfterActivation}
            label="Se permiten depositos despues de activar el bono"
          />
          <CheckboxField<T>
            name={paths.countOnlySettledBets}
            label="Sólo cuentan para el rollover las apuestas liquidadas"
          />
          <CheckboxField<T>
            name={paths.requireResolvedWithinTimeframe}
            label="Sólo cuentan para el rollover las apuestas liquidadas dentro del plazo"
          />
          <CheckboxField<T>
            name={paths.returnedBetsCountForRollover}
            label="Las apuestas devueltas cuentan para el rollover"
          />
          <CheckboxField<T>
            name={paths.cashoutBetsCountForRollover}
            label="Las apuestas con cashout cuentan para el rollover"
          />
          <CheckboxField<T>
            name={paths.noWithdrawalsAllowedDuringRollover}
            label="No se permiten retiradas durante el rollover"
            onValueChange={(checked) => {
              if (checked && bonusCancelledOnWithdrawal) {
                withdrawalCancelController.field.onChange(false);
              }
            }}
          />
          <CheckboxField<T>
            name={paths.bonusCancelledOnWithdrawal}
            label="Una retirada cancela el bono"
            disabled={Boolean(noWithdrawalsAllowedDuringRollover)}
            description={
              noWithdrawalsAllowedDuringRollover
                ? "No aplica cuando las retiradas no estan permitidas."
                : undefined
            }
          />
          <BetLiveOddsCheckbox<T> path={paths.allowLiveOddsChanges} />
        </div>

      </div>

      {/* Parametros numericos del rollover */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField<T>
            name={paths.multiplier}
            label="Rollover (x) *"
            type="number"
            min={1}
            step={1}
            placeholder="25"
          />
          <InputField<T>
            name={paths.expectedLossPercentage}
            label="Perdida esperada por apuesta (%) *"
            type="number"
            min={0}
            max={100}
            step={0.5}
            placeholder="5"
          />
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
          <InputField<T>
            name={paths.minBetsRequired}
            label="Número mínimo de apuestas a realizar"
            type="number"
            min={1}
            step={1}
          />
          <BetRequiredOutcomeField<T> path={paths.requiredBetOutcome} />
        </div>
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

      {/* Analisis de rentabilidad */}
      <div className="border-t pt-4">
        {calculatedAnalysis ? (
          <RolloverAnalysisPanel analysis={calculatedAnalysis} />
        ) : (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              Analisis incompleto. Completa: {missingAnalysisFields.join(", ")}.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}


"use client";

import { requiredBetOutcomeOptions, type AvailableTimeframes } from "@matbett/shared";
import { useWatch, FieldValues, Path, useFormContext } from "react-hook-form";

import { InputField, CheckboxField, SwitchField, SelectField } from "@/components/atoms";
import { TimeframeForm } from "@/components/molecules/TimeframeForm";
import { RolloverAnalysisPanel } from "@/components/molecules/RolloverAnalysisPanel";
import { useRolloverProfitabilityCalculation } from "@/hooks/useRolloverProfitabilityCalculation";

interface RolloverUsageFormProps<T extends FieldValues> {
  basePath: Path<T>;
  availableTimeframes?: AvailableTimeframes;
}

/**
 * Formulario para condiciones de uso de BET_BONUS_ROLLOVER
 * Todos los campos planos siguiendo el schema BonusRolloverUsageConditionsSchema
 */
export function RolloverUsageForm<T extends FieldValues>({
  basePath,
  availableTimeframes,
}: RolloverUsageFormProps<T>) {
  const { control, getValues } = useFormContext<T>();

  const allowMultipleBets = useWatch({
    control,
    name: `${basePath}.allowMultipleBets` as Path<T>,
  });

  // Obtener datos para el análisis de rentabilidad
  const rolloverData = {
    multiplier: getValues(`${basePath}.multiplier` as Path<T>),
    maxConversionMultiplier: getValues(`${basePath}.maxConversionMultiplier` as Path<T>),
    expectedLossPercentage: getValues(`${basePath}.expectedLossPercentage` as Path<T>),
    minBetsRequired: getValues(`${basePath}.minBetsRequired` as Path<T>),
    onlyBonusMoneyCountsForRollover: getValues(`${basePath}.onlyBonusMoneyCountsForRollover` as Path<T>),
    onlyRealMoneyCountsForRollover: getValues(`${basePath}.onlyRealMoneyCountsForRollover` as Path<T>),
    noWithdrawalsAllowedDuringRollover: getValues(`${basePath}.noWithdrawalsAllowedDuringRollover` as Path<T>),
    bonusCancelledOnWithdrawal: getValues(`${basePath}.bonusCancelledOnWithdrawal` as Path<T>),
    allowDepositsAfterActivation: getValues(`${basePath}.allowDepositsAfterActivation` as Path<T>),
    // Campos aplanados de bet restrictions
    minOdds: getValues(`${basePath}.oddsRestriction.minOdds` as Path<T>),
    maxStake: getValues(`${basePath}.stakeRestriction.maxStake` as Path<T>),
    bonusValue: 100,
    depositRequired: 0,
  };

  const calculatedAnalysis = useRolloverProfitabilityCalculation({
    ...rolloverData,
    multiplier: rolloverData.multiplier || 0,
    maxConversionMultiplier: rolloverData.maxConversionMultiplier,
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

      {/* Configuración del rollover */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField<T>
          name={`${basePath}.multiplier` as Path<T>}
          label="Rollover (x) *"
          type="number"
          min={1}
          step={1}
          placeholder="25"
        />
        <InputField<T>
          name={`${basePath}.maxConversionMultiplier` as Path<T>}
          label="Multiplicador conversión máxima (x)"
          type="number"
          min={0}
          step={0.1}
          placeholder="2"
        />
        <InputField<T>
          name={`${basePath}.expectedLossPercentage` as Path<T>}
          label="Pérdida esperada (%)"
          type="number"
          min={0}
          max={20}
          step={0.5}
          placeholder="5"
        />
        <InputField<T>
          name={`${basePath}.minBetsRequired` as Path<T>}
          label="Apuestas mínimas"
          type="number"
          min={1}
          step={1}
        />
      </div>

      {/* Restricciones de dinero/retiro */}
      <div className="space-y-3 rounded-md border border-border/40 bg-muted/20 p-4">
        <h4 className="text-sm font-medium text-muted-foreground">
          Restricciones de Dinero
        </h4>
        <SwitchField<T>
          name={`${basePath}.bonusCanBeUsedForBetting` as Path<T>}
          label="El bono puede usarse para apostar"
        />
        <SwitchField<T>
          name={`${basePath}.onlyBonusMoneyCountsForRollover` as Path<T>}
          label="Solo dinero de bono cuenta para rollover"
        />
        <SwitchField<T>
          name={`${basePath}.onlyRealMoneyCountsForRollover` as Path<T>}
          label="Solo dinero real cuenta para rollover"
        />
        <SwitchField<T>
          name={`${basePath}.noWithdrawalsAllowedDuringRollover` as Path<T>}
          label="No retiros durante rollover"
        />
        <SwitchField<T>
          name={`${basePath}.bonusCancelledOnWithdrawal` as Path<T>}
          label="Bono cancelado al retirar"
        />
        <SwitchField<T>
          name={`${basePath}.allowDepositsAfterActivation` as Path<T>}
          label="Permitir depósitos después de activar"
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

      {/* Análisis de rentabilidad */}
      {calculatedAnalysis && (
        <div className="border-t pt-4">
          <RolloverAnalysisPanel analysis={calculatedAnalysis} />
        </div>
      )}
    </div>
  );
}

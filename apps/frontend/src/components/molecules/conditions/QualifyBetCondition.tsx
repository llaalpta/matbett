"use client";

import { useEffect } from "react";
import {
  Control,
  FieldValues,
  Path,
  useController,
  useWatch,
} from "react-hook-form";

import { CheckboxField, InputField } from "@/components/atoms";
import {
  BetLiveOddsCheckbox,
  BetOddsRestrictionFields,
  BetOnlyFirstBetCheckbox,
  BetRequiredOutcomeField,
  BetStakeRestrictionFields,
  BetTextRestrictionsFields,
  type BetRestrictionsPaths,
} from "@/components/molecules/BetRestrictionsBlock";

export interface QualifyBetConditionPaths<T extends FieldValues>
  extends BetRestrictionsPaths<T> {
  contributesToRewardValue: Path<T>;
  allowRetries: Path<T>;
  maxAttempts: Path<T>;
  returnPercentage: Path<T>;
  maxRewardAmount: Path<T>;
  targetStake: Path<T>;
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
  multipleSystemType: Path<T>;
}

interface QualifyBetConditionProps<T extends FieldValues> {
  control: Control<T>;
  paths: QualifyBetConditionPaths<T>;
}

export function QualifyBetCondition<T extends FieldValues>({
  control,
  paths,
}: QualifyBetConditionProps<T>) {
  const contributesToRewardValue = useWatch({
    control,
    name: paths.contributesToRewardValue,
  });

  const maxAttemptsController = useController({
    control,
    name: paths.maxAttempts,
  });

  const allowRetries = useWatch({
    control,
    name: paths.allowRetries,
  });

  const maxAttempts = useWatch({
    control,
    name: paths.maxAttempts,
  });

  const returnPercentage = useWatch({
    control,
    name: paths.returnPercentage,
  });

  const allowMultipleBets = useWatch({
    control,
    name: paths.allowMultipleBets,
  });

  const maxRewardAmount = useWatch({
    control,
    name: paths.maxRewardAmount,
  });

  const minStake = useWatch({
    control,
    name: paths.stakeMin,
  });

  const optimalStake =
    returnPercentage > 0 && maxRewardAmount > 0
      ? maxRewardAmount / (returnPercentage / 100)
      : undefined;

  useEffect(() => {
    if (!allowRetries && maxAttempts !== 1) {
      maxAttemptsController.field.onChange(1);
    }
  }, [allowRetries, maxAttempts, maxAttemptsController.field]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <CheckboxField<T>
          control={control}
          name={paths.allowRetries}
          label="Se permiten reintentos si falla la condición"
          onValueChange={(checked) => {
            if (!checked) {
              maxAttemptsController.field.onChange(1);
            }
          }}
        />
        <BetLiveOddsCheckbox<T> path={paths.allowLiveOddsChanges} />
        <BetOnlyFirstBetCheckbox<T> path={paths.onlyFirstBetCounts} />
        <CheckboxField<T>
          control={control}
          name={paths.allowMultipleBets}
          label="Se permiten apuestas combinadas"
        />
      </div>

      {!contributesToRewardValue ? (
        <div className="space-y-4">
          <InputField<T>
            control={control}
            name={paths.targetStake}
            label="Stake requerido para cumplir condición (EUR)"
            type="number"
            step={1}
            min={0}
            placeholder="50"
            required
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField<T>
              control={control}
              name={paths.returnPercentage}
              label="Porcentaje de retorno sobre stake (%)"
              type="number"
              step={0.01}
              min={0}
              max={100}
              placeholder="50"
              required
            />
            <InputField<T>
              control={control}
              name={paths.maxRewardAmount}
              label="Reward máxima obtenible (EUR)"
              type="number"
              step={0.01}
              min={0}
              placeholder="50"
              required
            />
          </div>

          {optimalStake ? (
            <div className="rounded-md bg-blue-50 p-3 text-sm dark:bg-blue-950">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Stake optimo: EUR{optimalStake.toFixed(2)}
              </p>
              <p className="mt-1 text-blue-700 dark:text-blue-300">
                Apostar por encima de EUR{optimalStake.toFixed(2)} no aumenta la
                reward.
              </p>
              {minStake && minStake > optimalStake ? (
                <p className="mt-2 font-medium text-amber-700 dark:text-amber-300">
                  Advertencia: el stake mínimo (EUR{minStake}) es mayor que el
                  stake optimo.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField<T>
            control={control}
            name={paths.maxAttempts}
            label="Numero máximo de intentos"
            type="number"
            placeholder="3"
            min={1}
            step={1}
            disabled={!allowRetries}
          />
          <BetRequiredOutcomeField<T> path={paths.requiredBetOutcome} />
        </div>

        {contributesToRewardValue ? (
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
      </div>

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

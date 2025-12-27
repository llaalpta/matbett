"use client";

import { requiredBetOutcomeOptions } from "@matbett/shared";
import { Control, FieldValues, Path, useWatch } from "react-hook-form";

import { CheckboxField, InputField, SelectField, SwitchField, TextareaField } from "@/components/atoms";

interface QualifyBetConditionProps<T extends FieldValues> {
  control: Control<T>;
  basePath: Path<T>;
  onAllowRetriesChange?: (value: boolean) => void;
  onValueTypeChange?: (value: boolean) => void;
  rewardValueType?: string; // Para saber si mostrar el switch de contributesToRewardValue
  rewardHasContributingCondition?: boolean; // Para deshabilitar el switch si otra condition ya está marcada
}

export function QualifyBetCondition<T extends FieldValues>({
  control,
  basePath,
  onAllowRetriesChange,
  onValueTypeChange,
  rewardValueType,
  rewardHasContributingCondition = false,
}: QualifyBetConditionProps<T>) {
  // Watchers
  const contributesToRewardValue = useWatch({
    control,
    name: `${basePath}.conditions.contributesToRewardValue` as Path<T>,
  });

  const allowRetries = useWatch({
    control,
    name: `${basePath}.conditions.allowRetries` as Path<T>,
  });

  const allowMultipleBets = useWatch({
    control,
    name: `${basePath}.conditions.allowMultipleBets` as Path<T>,
  });

  const returnPercentage = useWatch({
    control,
    name: `${basePath}.conditions.returnPercentage` as Path<T>,
  });

  const maxRewardAmount = useWatch({
    control,
    name: `${basePath}.conditions.maxRewardAmount` as Path<T>,
  });

  const minStake = useWatch({
    control,
    name: `${basePath}.conditions.stakeRestriction.minStake` as Path<T>,
  });

  return (
    <div className="space-y-4">
      {/* 1. Configuración específica de Qualify */}
      <div className="space-y-4">
        <CheckboxField<T>
          control={control}
          name={`${basePath}.conditions.allowRetries` as Path<T>}
          label="Permitir reintentos si falla la condición"
          onValueChange={(value) => onAllowRetriesChange?.(value)}
        />

        {/* Campo máximo de intentos - solo visible cuando allowRetries es true */}
        {allowRetries && (
          <div className="ml-6">
            <InputField<T>
              control={control}
              name={`${basePath}.conditions.maxAttempts` as Path<T>}
              label="Máximo de Intentos"
              type="number"
              placeholder="3"
              min={1}
            />
          </div>
        )}
      </div>

      {/* 2. Tipo de Valor - DISCRIMINATOR - Solo visible si reward.valueType es CALCULATED */}
      {rewardValueType === "CALCULATED_FROM_CONDITIONS" && (
        <div className="rounded-md border border-border/60 bg-accent/5 p-4">
          <SwitchField<T>
            control={control}
            name={`${basePath}.conditions.contributesToRewardValue` as Path<T>}
            label="El valor de la reward depende de esta condición"
            description={
              contributesToRewardValue || !rewardHasContributingCondition
                ? "Si está activado, el valor se calculará basándose en el stake apostado"
                : "Otra condición ya está marcada para calcular el valor"
            }
            disabled={!contributesToRewardValue && rewardHasContributingCondition}
            onValueChange={onValueTypeChange}
          />
        </div>
      )}

      {/* 3. Campos según tipo de valor */}
      {!contributesToRewardValue ? (
        /* VALOR FIJO */
        <div className="rounded-md border border-border/40 bg-muted/20 p-4 space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Configuración de Stake (Valor Fijo)
          </h4>
          <InputField<T>
            control={control}
            name={`${basePath}.conditions.targetStake` as Path<T>}
            label="Stake Requerido (€)"
            type="number"
            step={0.01}
            placeholder="50"
            min={0}
            tooltip="Importe exacto que debe apostar el usuario para calificar"
            required
          />
        </div>
      ) : (
        /* VALOR CALCULADO */
        <div className="rounded-md border border-border/40 bg-muted/20 p-4 space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Configuración de Stake (Valor Calculado)
          </h4>

          {/* Restricciones de Stake */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField<T>
              control={control}
              name={`${basePath}.conditions.stakeRestriction.minStake` as Path<T>}
              label="Apuesta Mínima (€)"
              type="number"
              step={0.01}
              placeholder="10"
              min={0}
              tooltip="Importe mínimo de la apuesta para calificar"
              required
            />
            <InputField<T>
              control={control}
              name={`${basePath}.conditions.stakeRestriction.maxStake` as Path<T>}
              label="Apuesta Máxima (€)"
              type="number"
              step={0.01}
              placeholder="Sin límite"
              min={0}
              tooltip="Límite opcional de stake (dejar vacío si no hay límite)"
            />
          </div>

          {/* Cálculo del valor */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField<T>
              control={control}
              name={`${basePath}.conditions.returnPercentage` as Path<T>}
              label="Porcentaje de Retorno (%)"
              type="number"
              step={0.01}
              placeholder="50"
              min={0}
              max={100}
              tooltip="% del stake que se devuelve como reward (ej: 50% = mitad del stake)"
              required
            />
            <InputField<T>
              control={control}
              name={`${basePath}.conditions.maxRewardAmount` as Path<T>}
              label="Reward Máxima (€)"
              type="number"
              step={0.01}
              placeholder="50"
              min={0}
              tooltip="Límite máximo de la reward generada"
              required
            />
          </div>

          {/* Warning de stake óptimo */}
          {returnPercentage > 0 && maxRewardAmount > 0 && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                💡 Stake óptimo: €{(maxRewardAmount / (returnPercentage / 100)).toFixed(2)}
              </p>
              <p className="mt-1 text-blue-700 dark:text-blue-300">
                Con {returnPercentage}% de retorno y máximo de €{maxRewardAmount},
                apostar más de €{(maxRewardAmount / (returnPercentage / 100)).toFixed(2)} no aumentará la reward.
              </p>
              {minStake && minStake > (maxRewardAmount / (returnPercentage / 100)) && (
                <p className="mt-2 text-amber-700 dark:text-amber-300 font-medium">
                  ⚠️ Advertencia: El stake mínimo (€{minStake}) es mayor que el stake óptimo.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Condiciones de Apuesta (Aplanadas) */}
      <div className="rounded-md border border-border/40 bg-muted/20 p-4 space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">
          Requisitos de la Apuesta
        </h4>

        {/* Restricciones de Cuota */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField<T>
            control={control}
            name={`${basePath}.conditions.oddsRestriction.minOdds` as Path<T>}
            label="Cuota Mínima"
            type="number"
            step={0.01}
            placeholder="1.50"
            tooltip="Cuota mínima requerida para la apuesta"
          />
          <InputField<T>
            control={control}
            name={`${basePath}.conditions.oddsRestriction.maxOdds` as Path<T>}
            label="Cuota Máxima"
            type="number"
            step={0.01}
            placeholder="Sin límite"
            tooltip="Cuota máxima permitida para la apuesta"
          />
        </div>

        {/* Restricciones de Stake */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField<T>
            control={control}
            name={`${basePath}.conditions.stakeRestriction.minStake` as Path<T>}
            label="Apuesta Mínima (€)"
            type="number"
            step={0.01}
            placeholder="10"
            tooltip="Importe mínimo de la apuesta"
          />
          <InputField<T>
            control={control}
            name={`${basePath}.conditions.stakeRestriction.maxStake` as Path<T>}
            label="Apuesta Máxima (€)"
            type="number"
            step={0.01}
            placeholder="Sin límite"
            tooltip="Importe máximo de la apuesta"
          />
        </div>

        {/* Tipo de Apuesta - Combinadas */}
        <CheckboxField<T>
          control={control}
          name={`${basePath}.conditions.allowMultipleBets` as Path<T>}
          label="Permitir Apuestas Combinadas"
          tooltip="La apuesta puede ser combinada/múltiple"
        />

        {allowMultipleBets && (
          <div className="grid grid-cols-1 gap-4 rounded-md border border-border/40 bg-muted/20 p-4 md:grid-cols-2">
            <InputField<T>
              control={control}
              name={`${basePath}.conditions.multipleBetCondition.minSelections` as Path<T>}
              label="Mínimo Selecciones"
              type="number"
              placeholder="2"
              tooltip="Número mínimo de selecciones en la combinada"
            />
            <InputField<T>
              control={control}
              name={`${basePath}.conditions.multipleBetCondition.maxSelections` as Path<T>}
              label="Máximo Selecciones"
              type="number"
              placeholder="Sin límite"
              tooltip="Número máximo de selecciones en la combinada"
            />
            <InputField<T>
              control={control}
              name={`${basePath}.conditions.multipleBetCondition.minOddsPerSelection` as Path<T>}
              label="Cuota Mín. por Selección"
              type="number"
              step={0.01}
              placeholder="1.20"
              tooltip="Cuota mínima que debe tener cada selección individual"
            />
            <InputField<T>
              control={control}
              name={`${basePath}.conditions.multipleBetCondition.maxOddsPerSelection` as Path<T>}
              label="Cuota Máx. por Selección"
              type="number"
              step={0.01}
              placeholder="Sin límite"
              tooltip="Cuota máxima que puede tener cada selección individual"
            />
            <InputField<T>
              control={control}
              name={`${basePath}.conditions.multipleBetCondition.systemType` as Path<T>}
              label="Tipo de Sistema"
              type="text"
              placeholder="Ej: 2/3, 3/4"
              tooltip="Tipo de sistema permitido (ej: 2/3 significa 2 aciertos de 3 selecciones)"
              containerClassName="md:col-span-2"
            />
          </div>
        )}

        {/* Configuración de Resultado */}
        <SelectField<T>
          control={control}
          name={`${basePath}.conditions.requiredBetOutcome` as Path<T>}
          label="Resultado Requerido"
          options={requiredBetOutcomeOptions}
          tooltip="Resultado que debe tener la apuesta para contar (Ganada, Perdida, Cualquiera)"
        />

        {/* Opciones de Comportamiento */}
        <CheckboxField<T>
          control={control}
          name={`${basePath}.conditions.allowLiveOddsChanges` as Path<T>}
          label="Permitir cambios de cuota en vivo"
          tooltip="La apuesta puede aceptar cambios de cuota durante el evento en vivo"
        />
        <CheckboxField<T>
          control={control}
          name={`${basePath}.conditions.onlyFirstBetCounts` as Path<T>}
          label="Solo cuenta la primera apuesta"
          tooltip="Solo la primera apuesta del usuario cuenta para esta condición"
        />

        {/* Restricciones Adicionales (texto libre) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextareaField<T>
            control={control}
            name={`${basePath}.conditions.betTypeRestrictions` as Path<T>}
            label="Restricciones de Tipo de Apuesta"
            placeholder="Ej: No se permiten apuestas simples"
            rows={2}
            tooltip="Texto libre para describir restricciones sobre el tipo de apuesta"
          />
          <TextareaField<T>
            control={control}
            name={`${basePath}.conditions.selectionRestrictions` as Path<T>}
            label="Restricciones de Selección"
            placeholder="Ej: No se permiten apuestas en liga española"
            rows={2}
            tooltip="Texto libre para describir restricciones adicionales sobre las selecciones"
          />
        </div>
      </div>
    </div>
  );
}
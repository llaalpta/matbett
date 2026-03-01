"use client";

import { requiredBetOutcomeOptions } from "@matbett/shared";
import { FieldValues, Path, useFormContext } from "react-hook-form";

import { CheckboxField, InputField, SelectField, TextareaField } from "@/components/atoms";

export interface BetRestrictionsPaths<T extends FieldValues> {
  stakeMin?: Path<T>;
  stakeMax?: Path<T>;
  oddsMin?: Path<T>;
  oddsMax?: Path<T>;
  requiredBetOutcome?: Path<T>;
  allowLiveOddsChanges?: Path<T>;
  onlyFirstBetCounts?: Path<T>;
  allowMultipleBets?: Path<T>;
  multipleMinSelections?: Path<T>;
  multipleMaxSelections?: Path<T>;
  multipleMinOddsPerSelection?: Path<T>;
  multipleMaxOddsPerSelection?: Path<T>;
  betTypeRestrictions?: Path<T>;
  selectionRestrictions?: Path<T>;
  otherRestrictions?: Path<T>;
}

interface BetStakeRestrictionFieldsProps<T extends FieldValues> {
  paths: Pick<BetRestrictionsPaths<T>, "stakeMin" | "stakeMax">;
}

export function BetStakeRestrictionFields<T extends FieldValues>({
  paths,
}: BetStakeRestrictionFieldsProps<T>) {
  if (!paths.stakeMin && !paths.stakeMax) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {paths.stakeMin ? (
        <InputField<T>
          name={paths.stakeMin}
          label="Stake mínimo permitido (€)"
          type="number"
          step={1}
          placeholder="10"
        />
      ) : null}
      {paths.stakeMax ? (
        <InputField<T>
          name={paths.stakeMax}
          label="Stake máximo permitido (€)"
          type="number"
          step={1}
          placeholder="Sin límite"
        />
      ) : null}
    </div>
  );
}

interface BetOddsRestrictionFieldsProps<T extends FieldValues> {
  paths: Pick<BetRestrictionsPaths<T>, "oddsMin" | "oddsMax">;
}

export function BetOddsRestrictionFields<T extends FieldValues>({
  paths,
}: BetOddsRestrictionFieldsProps<T>) {
  if (!paths.oddsMin && !paths.oddsMax) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {paths.oddsMin ? (
        <InputField<T>
          name={paths.oddsMin}
          label="Cuota mínima requerida"
          type="number"
          step={0.01}
          placeholder="1.50"
        />
      ) : null}
      {paths.oddsMax ? (
        <InputField<T>
          name={paths.oddsMax}
          label="Cuota máxima permitida"
          type="number"
          step={0.01}
          placeholder="Sin límite"
        />
      ) : null}
    </div>
  );
}

interface BetRequiredOutcomeFieldProps<T extends FieldValues> {
  path?: Path<T>;
}

export function BetRequiredOutcomeField<T extends FieldValues>({
  path,
}: BetRequiredOutcomeFieldProps<T>) {
  if (!path) {
    return null;
  }

  return (
    <SelectField<T>
      name={path}
      label="Resultado de apuesta requerido"
      options={requiredBetOutcomeOptions}
    />
  );
}

interface BetLiveOddsCheckboxProps<T extends FieldValues> {
  path?: Path<T>;
}

export function BetLiveOddsCheckbox<T extends FieldValues>({
  path,
}: BetLiveOddsCheckboxProps<T>) {
  if (!path) {
    return null;
  }

  return (
    <CheckboxField<T>
      name={path}
      label="Se permiten cambios de cuota en vivo"
    />
  );
}

interface BetOnlyFirstBetCheckboxProps<T extends FieldValues> {
  path?: Path<T>;
  label?: string;
}

export function BetOnlyFirstBetCheckbox<T extends FieldValues>({
  path,
  label = "Sólo cuenta la primera apuesta por evento",
}: BetOnlyFirstBetCheckboxProps<T>) {
  if (!path) {
    return null;
  }

  return <CheckboxField<T> name={path} label={label} />;
}

interface BetMultipleBetsFieldsProps<T extends FieldValues> {
  paths: Pick<
    BetRestrictionsPaths<T>,
    | "allowMultipleBets"
    | "multipleMinSelections"
    | "multipleMaxSelections"
    | "multipleMinOddsPerSelection"
    | "multipleMaxOddsPerSelection"
  >;
}

export function BetMultipleBetsFields<T extends FieldValues>({
  paths,
}: BetMultipleBetsFieldsProps<T>) {
  const { watch } = useFormContext<T>();
  const allowMultiple = paths.allowMultipleBets
    ? Boolean(watch(paths.allowMultipleBets))
    : false;

  if (!paths.allowMultipleBets) {
    return null;
  }

  return (
    <div className="space-y-4">
      <CheckboxField<T>
        name={paths.allowMultipleBets}
        label="Se permiten apuestas combinadas"
      />

      {allowMultiple ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {paths.multipleMinSelections ? (
            <InputField<T>
              name={paths.multipleMinSelections}
              label="Número mínimo de selecciones en apuestas combinadas"
              type="number"
              placeholder="2"
            />
          ) : null}
          {paths.multipleMaxSelections ? (
            <InputField<T>
              name={paths.multipleMaxSelections}
              label="Numero máximo de selecciones en apuestas combinadas"
              type="number"
              placeholder="Sin límite"
            />
          ) : null}
          {paths.multipleMinOddsPerSelection ? (
            <InputField<T>
              name={paths.multipleMinOddsPerSelection}
              label="Cuota mínima permitida por selección en apuestas combinadas"
              type="number"
              step={0.01}
              placeholder="1.20"
            />
          ) : null}
          {paths.multipleMaxOddsPerSelection ? (
            <InputField<T>
              name={paths.multipleMaxOddsPerSelection}
              label="Cuota máxima permitida por selección en apuestas combinadas"
              type="number"
              step={0.01}
              placeholder="Sin límite"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

interface BetTextRestrictionsFieldsProps<T extends FieldValues> {
  paths: Pick<
    BetRestrictionsPaths<T>,
    "betTypeRestrictions" | "selectionRestrictions" | "otherRestrictions"
  >;
}

export function BetTextRestrictionsFields<T extends FieldValues>({
  paths,
}: BetTextRestrictionsFieldsProps<T>) {
  if (!paths.betTypeRestrictions && !paths.selectionRestrictions && !paths.otherRestrictions) {
    return null;
  }

  return (
    <div className="space-y-4">
      {paths.betTypeRestrictions ? (
        <TextareaField<T>
          name={paths.betTypeRestrictions}
          label="Restricciones de tipo de apuesta"
          placeholder="Ej: Sólo apuestas simples o combinadas; no sistema."
          rows={3}
        />
      ) : null}

      {paths.selectionRestrictions ? (
        <TextareaField<T>
          name={paths.selectionRestrictions}
          label="Restricciones de eventos, mercados o selección"
          placeholder="Ej: Sólo futbol; excluir mercados especiales."
          rows={3}
        />
      ) : null}

      {paths.otherRestrictions ? (
        <TextareaField<T>
          name={paths.otherRestrictions}
          label="Otras restricciones"
          placeholder="Ej: No combinable con otras promos; sólo por app; validez limitada."
          rows={3}
        />
      ) : null}
    </div>
  );
}

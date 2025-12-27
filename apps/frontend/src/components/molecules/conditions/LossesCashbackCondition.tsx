"use client";

import { cashbackCalculationMethodOptions, requiredBetOutcomeOptions } from "@matbett/shared";
import { Control, FieldValues, Path, useWatch } from "react-hook-form";

import { CheckboxField, InputField, SelectField, TextareaField } from "@/components/atoms";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface LossesCashbackConditionProps<T extends FieldValues> {
  control: Control<T>;
  basePath: Path<T>;
}

export function LossesCashbackCondition<T extends FieldValues>({
  control,
  basePath,
}: LossesCashbackConditionProps<T>) {
  const allowMultipleBets = useWatch({
    control,
    name: `${basePath}.conditions.allowMultipleBets` as Path<T>,
  });

  return (
    <div className="space-y-4">
      {/* 1. Configuración de Cashback */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField<T>
          control={control}
          name={`${basePath}.conditions.cashbackPercentage` as Path<T>}
          label="Porcentaje de Cashback (%)"
          type="number"
          placeholder="100"
          required
        />
        <InputField<T>
          control={control}
          name={`${basePath}.conditions.maxCashbackAmount` as Path<T>}
          label="Cashback Máximo (€)"
          type="number"
          placeholder="50"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField<T>
          control={control}
          name={`${basePath}.conditions.calculationMethod` as Path<T>}
          label="Método de Cálculo"
          options={cashbackCalculationMethodOptions}
          required
        />
        <InputField<T>
          control={control}
          name={`${basePath}.conditions.calculationPeriod` as Path<T>}
          label="Periodo de Cálculo"
          placeholder="Ej: Fin de semana, Lunes a Viernes"
        />
      </div>

      {/* 2. Restricciones de Apuesta (Opcionales) */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="bet-restrictions" className="border rounded-md px-4">
          <AccordionTrigger className="hover:no-underline py-3">
            <span className="text-sm font-medium">Restricciones de Apuesta (Opcional)</span>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4 space-y-4">
            <p className="text-xs text-muted-foreground mb-2">
              Si se definen, el cashback solo aplicará si las apuestas pérdidas cumplen estas condiciones.
            </p>

            {/* Restricciones de Cuota */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField<T>
                control={control}
                name={`${basePath}.conditions.oddsRestriction.minOdds` as Path<T>}
                label="Cuota Mínima"
                type="number"
                step={0.01}
                placeholder="1.50"
              />
              <InputField<T>
                control={control}
                name={`${basePath}.conditions.oddsRestriction.maxOdds` as Path<T>}
                label="Cuota Máxima"
                type="number"
                step={0.01}
                placeholder="Sin límite"
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
              />
              <InputField<T>
                control={control}
                name={`${basePath}.conditions.stakeRestriction.maxStake` as Path<T>}
                label="Apuesta Máxima (€)"
                type="number"
                step={0.01}
                placeholder="Sin límite"
              />
            </div>

            {/* Configuración de Resultado */}
            <SelectField<T>
              control={control}
              name={`${basePath}.conditions.requiredBetOutcome` as Path<T>}
              label="Resultado Requerido"
              options={requiredBetOutcomeOptions}
              placeholder="Cualquiera (por defecto)"
            />

            {/* Tipo de Apuesta - Combinadas */}
            <CheckboxField<T>
              control={control}
              name={`${basePath}.conditions.allowMultipleBets` as Path<T>}
              label="Permitir Apuestas Combinadas"
            />

            {allowMultipleBets && (
              <div className="grid grid-cols-1 gap-4 rounded-md border border-border/40 bg-muted/20 p-4 md:grid-cols-2">
                <InputField<T>
                  control={control}
                  name={`${basePath}.conditions.multipleBetCondition.minSelections` as Path<T>}
                  label="Mín. Selecciones"
                  type="number"
                  placeholder="2"
                />
                <InputField<T>
                  control={control}
                  name={`${basePath}.conditions.multipleBetCondition.maxSelections` as Path<T>}
                  label="Máx. Selecciones"
                  type="number"
                  placeholder="Sin límite"
                />
                <InputField<T>
                  control={control}
                  name={`${basePath}.conditions.multipleBetCondition.minOddsPerSelection` as Path<T>}
                  label="Cuota Mín. Sel."
                  type="number"
                  step={0.01}
                  placeholder="1.20"
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextareaField<T>
                    control={control}
                    name={`${basePath}.conditions.betTypeRestrictions` as Path<T>}
                    label="Restricciones de Tipo"
                    placeholder="Ej: Solo simples"
                    rows={2}
                />
                <TextareaField<T>
                    control={control}
                    name={`${basePath}.conditions.selectionRestrictions` as Path<T>}
                    label="Restricciones de Selección"
                    placeholder="Ej: Solo fútbol"
                    rows={2}
                />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
"use client";

import { optionsOptions, strategyKindOptions } from "@matbett/shared";
import { useFormContext, useWatch } from "react-hook-form";

import { DateTimeField, InputField, SelectField } from "@/components/atoms";
import { useBetBatchStrategyLogic } from "@/hooks/domain/bets/useBetBatchStrategyLogic";
import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";

type BetBatchSetupSectionProps = {
  mode: "create" | "edit";
  defaultBookmakerAccountId: string;
};

const compactLabelClassName =
  "text-muted-foreground text-[11px] font-medium leading-none";
const setupGroupHeaderClassName =
  "text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground";
const setupGroupClassName = "space-y-2 px-3 py-2";
const setupFieldsGridClassName =
  "grid items-end gap-2 sm:grid-cols-2 xl:grid-cols-4";

export function BetBatchSetupSection({
  mode,
  defaultBookmakerAccountId,
}: BetBatchSetupSectionProps) {
  const form = useFormContext<BetBatchFormValues>();
  const {
    strategy,
    strategyTypeOptionsFiltered,
    lineModeOptionsFiltered,
    modeOptionsFiltered,
  } = useBetBatchStrategyLogic({
    mode,
    defaultBookmakerAccountId,
  });
  const events = useWatch({ control: form.control, name: "events" }) ?? [];

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b bg-muted/20 px-3 py-2">
        <h3 className="text-sm font-semibold">Configuración de la operación</h3>
      </div>

      <div className="divide-y">
        <div className={setupGroupClassName}>
          <div className={setupGroupHeaderClassName}>Formato y cobertura</div>
          <div className={setupFieldsGridClassName}>
            <SelectField<BetBatchFormValues>
              name="operation.lineMode"
              label="Formato de apuesta"
              labelClassName={compactLabelClassName}
              options={lineModeOptionsFiltered}
              size="sm"
              required
              tooltip="Define si la operación registra una apuesta simple o una combinada con varios eventos."
            />
            <SelectField<BetBatchFormValues>
              name="strategy.kind"
              label="Cobertura"
              labelClassName={compactLabelClassName}
              options={strategyKindOptions}
              size="sm"
              required
            />
            {strategy.kind === "HEDGE" ? (
              <>
                <SelectField<BetBatchFormValues>
                  name="strategy.strategyType"
                  label="Tipo de cobertura"
                  labelClassName={compactLabelClassName}
                  options={strategyTypeOptionsFiltered}
                  size="sm"
                  required
                />
                <SelectField<BetBatchFormValues>
                  name="strategy.mode"
                  label="Modo"
                  labelClassName={compactLabelClassName}
                  options={modeOptionsFiltered}
                  size="sm"
                  required
                />
              </>
            ) : null}
          </div>
        </div>

        {events.map((_, eventIndex) => (
          <div
            key={`setup-event-${eventIndex}`}
            className={setupGroupClassName}
          >
            <div className={setupGroupHeaderClassName}>
              {events.length === 1 ? "Evento" : `Evento ${eventIndex + 1}`}
            </div>
            <div className={setupFieldsGridClassName}>
              <InputField<BetBatchFormValues>
                name={`events.${eventIndex}.eventName`}
                label="Evento"
                labelClassName={compactLabelClassName}
                placeholder="Evento"
                size="sm"
                required
              />
              <SelectField<BetBatchFormValues>
                name={`events.${eventIndex}.eventOptions`}
                label="Opciones de mercado de apuesta"
                labelClassName={compactLabelClassName}
                options={optionsOptions}
                size="sm"
                required
                tooltip="Define cuántos resultados mutuamente excluyentes tiene el mercado; condiciona las coberturas disponibles."
              />
              <InputField<BetBatchFormValues>
                name={`events.${eventIndex}.marketName`}
                label="Mercado específico"
                labelClassName={compactLabelClassName}
                placeholder="1X2, ganador, más/menos..."
                size="sm"
                required
              />
              <DateTimeField<BetBatchFormValues>
                name={`events.${eventIndex}.eventDate`}
                label="Fecha del evento"
                labelClassName={compactLabelClassName}
                size="sm"
                required
              />
            </div>
          </div>
        ))}

      </div>
    </section>
  );
}

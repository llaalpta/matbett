"use client";

import { betStatusOptions } from "@matbett/shared";

import { DateTimeField, InputField, SelectField } from "@/components/atoms";
import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";

import type { BatchEventFormValue } from "../types";
import { formatEventDateSummary } from "../utils";

type SingleMatchedLegConfigurationProps = {
  legIndex: number;
  bookmakerOptions: Array<{ value: string; label: string }>;
  isMainLeg: boolean;
  sharedEvent: BatchEventFormValue | undefined;
  derivedHedge1Selection: string;
};

export function SingleMatchedLegConfiguration({
  legIndex,
  bookmakerOptions,
  isMainLeg,
  sharedEvent,
  derivedHedge1Selection,
}: SingleMatchedLegConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField<BetBatchFormValues>
          name={`legs.${legIndex}.bookmakerAccountId`}
          label="Cuenta"
          options={bookmakerOptions}
          required
        />
        <InputField<BetBatchFormValues>
          name={`legs.${legIndex}.commission`}
          label="Comisión %"
          type="number"
          step={0.01}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isMainLeg ? (
          <>
            <InputField<BetBatchFormValues>
              name="events.0.eventName"
              label="Evento"
              required
            />
            <DateTimeField<BetBatchFormValues>
              name="events.0.eventDate"
              label="Fecha del evento"
              required
            />
          </>
        ) : (
          <>
            <StaticSummaryField
              label="Evento"
              value={sharedEvent?.eventName || "Sin evento"}
            />
            <StaticSummaryField
              label="Fecha del evento"
              value={formatEventDateSummary(sharedEvent?.eventDate)}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isMainLeg ? (
          <>
            <InputField<BetBatchFormValues>
              name="events.0.marketName"
              label="Mercado"
              required
            />
            <InputField<BetBatchFormValues>
              name={`legs.${legIndex}.selections.0.selection`}
              label="Selección"
              required
            />
          </>
        ) : (
          <>
            <StaticSummaryField
              label="Mercado"
              value={sharedEvent?.marketName || "Sin mercado"}
            />
            <StaticSummaryField
              label="Selección"
              value={derivedHedge1Selection || "Se deriva desde MAIN"}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InputField<BetBatchFormValues>
          name={`legs.${legIndex}.odds`}
          label="Cuota selección"
          type="number"
          step={0.01}
          required
          treatZeroAsEmpty
        />
        <InputField<BetBatchFormValues>
          name={`legs.${legIndex}.stake`}
          label={isMainLeg ? "Stake selección" : "Stake propuesto"}
          description={
            isMainLeg
              ? undefined
              : "Valor recomendado para colocar la cobertura."
          }
          tooltip={
            isMainLeg
              ? undefined
              : "Se propone automáticamente según la fórmula del escenario, pero puedes ajustarlo manualmente."
          }
          type="number"
          step={0.01}
          required={isMainLeg}
          treatZeroAsEmpty={isMainLeg}
          containerClassName={
            isMainLeg
              ? undefined
              : "rounded-lg border border-sky-200 bg-sky-50/80 p-3 shadow-sm"
          }
          inputClassName={
            isMainLeg
              ? undefined
              : "border-sky-300 bg-white text-lg font-semibold text-sky-900 shadow-sm focus-visible:border-sky-400 focus-visible:ring-sky-200"
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DateTimeField<BetBatchFormValues>
          name={`legs.${legIndex}.placedAt`}
          label="Fecha de colocación"
        />
        <SelectField<BetBatchFormValues>
          name={`legs.${legIndex}.status`}
          label="Estado"
          options={betStatusOptions}
        />
      </div>
    </div>
  );
}

function StaticSummaryField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <div className="text-muted-foreground rounded-md border bg-muted/20 px-3 py-2 text-sm">
        {value}
      </div>
    </div>
  );
}

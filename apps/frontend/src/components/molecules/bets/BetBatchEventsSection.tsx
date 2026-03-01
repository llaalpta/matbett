"use client";

import { optionsOptions } from "@matbett/shared";
import { useFormContext, useWatch } from "react-hook-form";

import { DateTimeField, InputField, SelectField } from "@/components/atoms";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";

function isSingleMatchedBettingLayout(strategy: BetBatchFormValues["strategy"]) {
  return (
    strategy.kind === "HEDGE" &&
    strategy.strategyType === "MATCHED_BETTING" &&
    strategy.lineMode === "SINGLE"
  );
}

export function BetBatchEventsSection() {
  const form = useFormContext<BetBatchFormValues>();
  const strategy = useWatch({ control: form.control, name: "strategy" });
  const events = useWatch({ control: form.control, name: "events" }) ?? [];
  const isSingleMatchedLayout = isSingleMatchedBettingLayout(strategy);

  if (isSingleMatchedLayout) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eventos del batch</CardTitle>
        <CardDescription>
          En simples hay 1 evento; en combinadas, 2 o 3.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((_, eventIndex) => (
          <div
            key={`event-${eventIndex}`}
            className="grid gap-4 rounded-md border p-4 md:grid-cols-2 xl:grid-cols-4"
          >
            <InputField<BetBatchFormValues>
              name={`events.${eventIndex}.eventName`}
              label={`Evento ${eventIndex + 1}`}
              required
            />
            <InputField<BetBatchFormValues>
              name={`events.${eventIndex}.marketName`}
              label="Mercado"
              required
            />
            <SelectField<BetBatchFormValues>
              name={`events.${eventIndex}.eventOptions`}
              label="Opciones del mercado"
              options={optionsOptions}
              required
            />
            <DateTimeField<BetBatchFormValues>
              name={`events.${eventIndex}.eventDate`}
              label="Fecha del evento"
              required
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

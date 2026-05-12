"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { InputField } from "@/components/atoms";
import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";

type BetBatchSelectionsSectionProps = {
  legIndex: number;
};

export function BetBatchSelectionsSection({
  legIndex,
}: BetBatchSelectionsSectionProps) {
  const form = useFormContext<BetBatchFormValues>();
  const selections =
    useWatch({
      control: form.control,
      name: `legs.${legIndex}.selections`,
    }) ?? [];
  const strategy = useWatch({ control: form.control, name: "strategy" });
  const operation = useWatch({ control: form.control, name: "operation" });
  const events = useWatch({ control: form.control, name: "events" }) ?? [];
  const legRole = form.getValues(`legs.${legIndex}.legRole`);

  return (
    <div className="min-w-0 space-y-2">
      <div>
        <h4 className="text-sm font-semibold">Selecciones</h4>
        <p className="text-muted-foreground text-xs">
          Cada selección referencia un evento de la operación.
        </p>
      </div>

      <div className="grid min-w-[520px] gap-2 md:grid-cols-2 xl:grid-cols-3">
        {selections.map((selection, selectionIndex) => {
          const showSelectionOdds =
            operation?.lineMode !== "SINGLE" &&
            (legRole === "MAIN" || legRole === undefined);
          const eventName =
            events[selection.eventIndex]?.eventName?.trim() ||
            `Evento ${selection.eventIndex + 1}`;

          return (
            <div
              key={`selection-${selection.eventIndex}-${selectionIndex}`}
              className="min-w-0 rounded-md border bg-background px-2 py-2"
            >
              <div
                className="text-muted-foreground mb-1 truncate text-[11px] font-semibold uppercase tracking-[0.04em]"
                title={eventName}
              >
                {eventName}
              </div>
              <div
                className={
                  showSelectionOdds
                    ? "grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(96px,120px)]"
                    : undefined
                }
              >
                <InputField<BetBatchFormValues>
                  name={`legs.${legIndex}.selections.${selectionIndex}.selection`}
                  label="Selección"
                  labelClassName="text-muted-foreground text-[11px] font-medium leading-none"
                  placeholder="Equipo, resultado o selección"
                  size="sm"
                  required
                  inputClassName="truncate"
                />
                {showSelectionOdds ? (
                  <InputField<BetBatchFormValues>
                    name={`legs.${legIndex}.selections.${selectionIndex}.odds`}
                    label="Cuota"
                    labelClassName="text-muted-foreground text-[11px] font-medium leading-none"
                    placeholder="Cuota"
                    type="number"
                    step={0.01}
                    size="sm"
                    required
                    treatZeroAsEmpty
                    inputClassName="text-right"
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

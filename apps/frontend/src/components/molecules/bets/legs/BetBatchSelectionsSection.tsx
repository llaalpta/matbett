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
  const legRole = form.getValues(`legs.${legIndex}.legRole`);

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold">Selecciones</h4>
        <p className="text-muted-foreground text-sm">
          `selections[]` es el formato unificado por leg.
        </p>
      </div>

      {selections.map((selection, selectionIndex) => {
        const showSelectionOdds =
          strategy.kind === "HEDGE" &&
          strategy.lineMode !== "SINGLE" &&
          legRole === "MAIN";

        return (
          <div
            key={`selection-${selection.eventIndex}-${selectionIndex}`}
            className="grid gap-4 rounded-md border p-4 md:grid-cols-3"
          >
            <InputField<BetBatchFormValues>
              name={`legs.${legIndex}.selections.${selectionIndex}.selection`}
              label={`Selección evento ${selection.eventIndex + 1}`}
              required
            />
            <InputField<BetBatchFormValues>
              name={`legs.${legIndex}.selections.${selectionIndex}.eventIndex`}
              label="Índice evento"
              type="number"
              disabled
            />
            {showSelectionOdds ? (
              <InputField<BetBatchFormValues>
                name={`legs.${legIndex}.selections.${selectionIndex}.odds`}
                label="Cuota individual"
                type="number"
                step={0.01}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

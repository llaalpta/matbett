"use client";

import { getLabel, qualifyConditionTypeOptions } from "@matbett/shared";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type QualifyConditionPickerOption = {
  id: string;
  type: string;
  description?: string | null;
};

interface QualifyConditionPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: QualifyConditionPickerOption[];
  onSelect: (conditionId: string) => void;
}

export function QualifyConditionPickerDialog({
  open,
  onOpenChange,
  options,
  onSelect,
}: QualifyConditionPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seleccionar condición existente</DialogTitle>
          <DialogDescription>
            Reutiliza una qualify condition ya registrada en esta promoción.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {options.length === 0 ? (
            <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
              No hay condiciones disponibles para reutilizar.
            </div>
          ) : (
            options.map((condition) => (
              <button
                key={condition.id}
                type="button"
                onClick={() => onSelect(condition.id)}
                className="hover:border-primary/50 hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-ring/50 block w-full rounded-lg border p-4 text-left transition outline-none focus-visible:ring-[3px]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">
                      {getLabel(qualifyConditionTypeOptions, condition.type)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {condition.description?.trim()
                        ? condition.description
                        : "Sin descripción"}
                    </p>
                  </div>
                  <Badge variant="outline">{condition.type}</Badge>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

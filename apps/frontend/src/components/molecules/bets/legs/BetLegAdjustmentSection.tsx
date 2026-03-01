"use client";

import { Button } from "@/components/ui/button";

type BetLegAdjustmentSectionProps = {
  options: Array<{ value: "UNMATCHED" | "PREPAYMENT"; label: string }>;
  value?: "UNMATCHED" | "PREPAYMENT";
  onValueChange: (value?: "UNMATCHED" | "PREPAYMENT") => void;
};

export function BetLegAdjustmentSection({
  options,
  value,
  onValueChange,
}: BetLegAdjustmentSectionProps) {
  if (options.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Ajuste</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = value === option.value;

          return (
            <Button
              key={option.value}
              type="button"
              variant={isActive ? "default" : "outline"}
              onClick={() => onValueChange(isActive ? undefined : option.value)}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

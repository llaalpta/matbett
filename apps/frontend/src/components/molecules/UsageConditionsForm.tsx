"use client";

import type { AvailableTimeframes } from "@matbett/shared";
import { useWatch, FieldValues, Path, useFormContext } from "react-hook-form";

import {
  FreeBetUsageForm,
  RolloverUsageForm,
  CashbackUsageForm,
  BonusNoRolloverUsageForm,
  EnhancedOddsUsageForm,
  CasinoSpinsUsageForm,
} from "./usage-conditions";

interface UsageConditionsFormProps<T extends FieldValues> {
  fieldPath: Path<T>;
  availableTimeframes?: AvailableTimeframes;
}

/**
 * Componente principal para condiciones de uso
 * Delega a componentes específicos según el tipo de usage condition
 */
export function UsageConditionsForm<T extends FieldValues>({
  fieldPath,
  availableTimeframes,
}: UsageConditionsFormProps<T>) {
  const { control } = useFormContext<T>();

  const usageType = useWatch({
    control,
    name: `${fieldPath}.type` as Path<T>,
  });

  if (!usageType) return null;

  return (
    <div className="space-y-4">
      {usageType === "FREEBET" && (
        <FreeBetUsageForm<T>
          basePath={fieldPath}
          availableTimeframes={availableTimeframes}
        />
      )}

      {usageType === "BET_BONUS_ROLLOVER" && (
        <RolloverUsageForm<T>
          basePath={fieldPath}
          availableTimeframes={availableTimeframes}
        />
      )}

      {usageType === "CASHBACK_FREEBET" && (
        <CashbackUsageForm<T>
          basePath={fieldPath}
          availableTimeframes={availableTimeframes}
        />
      )}

      {usageType === "BET_BONUS_NO_ROLLOVER" && (
        <BonusNoRolloverUsageForm<T>
          basePath={fieldPath}
          availableTimeframes={availableTimeframes}
        />
      )}

      {usageType === "ENHANCED_ODDS" && (
        <EnhancedOddsUsageForm<T>
          basePath={fieldPath}
          availableTimeframes={availableTimeframes}
        />
      )}

      {usageType === "CASINO_SPINS" && (
        <CasinoSpinsUsageForm<T>
          basePath={fieldPath}
          availableTimeframes={availableTimeframes}
        />
      )}

      {!["FREEBET", "BET_BONUS_ROLLOVER", "BET_BONUS_NO_ROLLOVER", "CASHBACK_FREEBET", "ENHANCED_ODDS", "CASINO_SPINS"].includes(usageType as string) && (
        <div className="text-muted-foreground text-sm">
          Configuración básica para {usageType}
        </div>
      )}
    </div>
  );
}

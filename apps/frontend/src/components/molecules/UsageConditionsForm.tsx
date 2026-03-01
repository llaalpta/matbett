"use client";

import type { AnchorCatalog, AnchorOccurrences } from "@matbett/shared";
import { useWatch, FieldValues, Path, useFormContext } from "react-hook-form";

import {
  FreeBetUsageForm,
  type FreeBetUsageFormPaths,
  RolloverUsageForm,
  type RolloverUsageFormPaths,
  CashbackUsageForm,
  type CashbackUsageFormPaths,
  BonusNoRolloverUsageForm,
  type BonusNoRolloverUsageFormPaths,
  EnhancedOddsUsageForm,
  type EnhancedOddsUsageFormPaths,
  CasinoSpinsUsageForm,
  type CasinoSpinsUsageFormPaths,
} from "./usage-conditions";

export interface UsageConditionsFormPaths<T extends FieldValues> {
  type: Path<T>;
  freebet: FreeBetUsageFormPaths<T>;
  rollover: RolloverUsageFormPaths<T>;
  cashback: CashbackUsageFormPaths<T>;
  bonusNoRollover: BonusNoRolloverUsageFormPaths<T>;
  enhancedOdds: EnhancedOddsUsageFormPaths<T>;
  casinoSpins: CasinoSpinsUsageFormPaths<T>;
}

interface UsageConditionsFormProps<T extends FieldValues> {
  paths: UsageConditionsFormPaths<T>;
  anchorCatalog?: AnchorCatalog;
  anchorOccurrences?: AnchorOccurrences;
  rewardValueForAnalysis?: number;
  depositRequiredForAnalysis?: number;
}

/**
 * Componente principal para condiciones de uso
 * Delega a componentes especificos segun el tipo de usage condition
 */
export function UsageConditionsForm<T extends FieldValues>({
  paths,
  anchorCatalog,
  anchorOccurrences,
  rewardValueForAnalysis,
  depositRequiredForAnalysis,
}: UsageConditionsFormProps<T>) {
  const { control } = useFormContext<T>();

  const usageTypeRaw = useWatch({
    control,
    name: paths.type,
  });

  const usageType = typeof usageTypeRaw === "string" ? usageTypeRaw : undefined;

  if (!usageType) {
    return null;
  }

  return (
    <div className="space-y-4">
      {usageType === "FREEBET" && (
        <FreeBetUsageForm<T>
          paths={paths.freebet}
          anchorCatalog={anchorCatalog}
          anchorOccurrences={anchorOccurrences}
        />
      )}

      {usageType === "BET_BONUS_ROLLOVER" && (
        <RolloverUsageForm<T>
          paths={paths.rollover}
          anchorCatalog={anchorCatalog}
          anchorOccurrences={anchorOccurrences}
          rewardValueForAnalysis={rewardValueForAnalysis}
          depositRequiredForAnalysis={depositRequiredForAnalysis}
        />
      )}

      {usageType === "CASHBACK_FREEBET" && (
        <CashbackUsageForm<T>
          paths={paths.cashback}
          anchorCatalog={anchorCatalog}
          anchorOccurrences={anchorOccurrences}
        />
      )}

      {usageType === "BET_BONUS_NO_ROLLOVER" && (
        <BonusNoRolloverUsageForm<T>
          paths={paths.bonusNoRollover}
          anchorCatalog={anchorCatalog}
          anchorOccurrences={anchorOccurrences}
        />
      )}

      {usageType === "ENHANCED_ODDS" && (
        <EnhancedOddsUsageForm<T>
          paths={paths.enhancedOdds}
          anchorCatalog={anchorCatalog}
          anchorOccurrences={anchorOccurrences}
        />
      )}

      {usageType === "CASINO_SPINS" && (
        <CasinoSpinsUsageForm<T>
          paths={paths.casinoSpins}
          anchorCatalog={anchorCatalog}
          anchorOccurrences={anchorOccurrences}
        />
      )}

      {![
        "FREEBET",
        "BET_BONUS_ROLLOVER",
        "BET_BONUS_NO_ROLLOVER",
        "CASHBACK_FREEBET",
        "ENHANCED_ODDS",
        "CASINO_SPINS",
      ].includes(usageType) && (
        <div className="text-muted-foreground text-sm">
          Configuracion basica para {usageType}
        </div>
      )}
    </div>
  );
}


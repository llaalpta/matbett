"use client";

import React, { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRolloverProfitabilityCalculation } from "@/hooks/useRolloverProfitabilityCalculation";
import type {
  RewardUsageConditionsFormData
} from "@/types/hooks";
import { RewardDepositQualifyConditionFormData } from "@/types/ui";

interface RewardPreviewCalculatorProps {
  depositAmount: number;
  qualifyCondition: RewardDepositQualifyConditionFormData;
  usageConditions?: RewardUsageConditionsFormData;
  rewardValue?: number; // Si existe valor fijo de reward
}

export const RewardPreviewCalculator: React.FC<RewardPreviewCalculatorProps> = ({
  depositAmount,
  qualifyCondition,
  usageConditions,
  rewardValue
}) => {
  // Calcular valor de reward preview
  const previewRewardValue = useMemo(() => {
    // 1. Si hay valor fijo de reward, usarlo
    if (rewardValue && rewardValue > 0) {
      return rewardValue;
    }

    const conditions = qualifyCondition.conditions;

    // Type narrowing: solo calcular si es CALCULATED VALUE
    if (conditions.contributesToRewardValue) {
      // 2. Si no hay depósito, usar máximo teórico
      if (!depositAmount || depositAmount <= 0) {
        return conditions.maxBonusAmount || 0;
      }

      // 3. Calcular basado en depósito real
      const {
        maxAmount,
        bonusPercentage = 0,
        maxBonusAmount
      } = conditions;

      const eligibleAmount = maxAmount
        ? Math.min(depositAmount, maxAmount)
        : depositAmount;

      const calculatedBonus = (eligibleAmount * bonusPercentage) / 100;

      return maxBonusAmount
        ? Math.min(calculatedBonus, maxBonusAmount)
        : calculatedBonus;
    } else {
      // FIXED VALUE: el valor de la reward no depende del depósito
      // En este caso, rewardValue debe estar definido
      return 0;
    }
  }, [depositAmount, qualifyCondition, rewardValue]);

  // Cálculo de rollover - solo si las usage conditions son de tipo BET_BONUS_ROLLOVER
  const rolloverAnalysis = useRolloverProfitabilityCalculation(
    usageConditions?.type === 'BET_BONUS_ROLLOVER'
      ? {
          bonusValue: previewRewardValue,
          multiplier: usageConditions.multiplier || 1,
          maxConversionMultiplier: usageConditions.maxConversionMultiplier,
          // Campos aplanados (estructura aplanada - sin wrapper betConditions)
          minOdds: usageConditions.oddsRestriction?.minOdds,
          maxStake: usageConditions.stakeRestriction?.maxStake,
          depositRequired: depositAmount,
          onlyBonusMoneyCountsForRollover: usageConditions.onlyBonusMoneyCountsForRollover,
          onlyRealMoneyCountsForRollover: usageConditions.onlyRealMoneyCountsForRollover,
          minBetsRequired: usageConditions.minBetsRequired,
        }
      : {
          bonusValue: previewRewardValue,
          multiplier: 1,
          depositRequired: depositAmount,
        }
  );

  if (previewRewardValue <= 0) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-sm text-yellow-800">
            ⚠️ Sin valor para calcular
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-yellow-700">
            No hay valor de reward para calcular la estrategia de liberación.
            Configura el valor fijo o añade un depósito.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!rolloverAnalysis) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-sm text-red-800">
            ❌ Error en cálculo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-red-700">
            No se pudo calcular la estrategia de rollover.
            Verifica la configuración.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-sm text-blue-800">
          📊 Preview de Estrategia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Valores básicos */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-medium">Depósito:</span>
            <div className="text-blue-700">€{depositAmount.toFixed(2)}</div>
          </div>
          <div>
            <span className="font-medium">Bonus:</span>
            <div className="text-blue-700">€{previewRewardValue.toFixed(2)}</div>
          </div>
        </div>

        {/* Rollover */}
        <div className="border-t pt-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span>Rollover requerido:</span>
            <span className="font-medium">€{rolloverAnalysis.totalRolloverRequired.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Pérdida estimada:</span>
            <span className="font-medium text-red-600">€{rolloverAnalysis.estimatedLoss.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Valor esperado:</span>
            <span className={`font-medium ${rolloverAnalysis.expectedValue > 0 ? 'text-green-600' : 'text-red-600'}`}>
              €{rolloverAnalysis.expectedValue.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Recomendación */}
        <div className="border-t pt-2">
          <div className="text-xs">
            <span className="font-medium">Recomendación: </span>
            <span className={rolloverAnalysis.expectedValue > 0 ? 'text-green-700' : 'text-red-700'}>
              {rolloverAnalysis.expectedValue > 0 ? 'Rentable' : 'No rentable'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
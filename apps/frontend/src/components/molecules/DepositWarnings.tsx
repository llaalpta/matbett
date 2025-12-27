"use client";

import { AlertTriangle, Info, XCircle } from "lucide-react";
import React from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { RewardDepositQualifyConditionFormData } from "@/types/ui";

interface WarningType {
  type: "error" | "warning" | "info";
  message: string;
}

interface DepositWarningsProps {
  depositAmount: number;
  qualifyCondition?: RewardDepositQualifyConditionFormData;
}

export function DepositWarnings({
  depositAmount,
  qualifyCondition,
}: DepositWarningsProps) {
  // Calcular warnings dinámicamente
  const warnings: WarningType[] = React.useMemo(() => {
    const warningsList: WarningType[] = [];

    if (!qualifyCondition || !depositAmount || depositAmount <= 0) {
      return warningsList;
    }

    const conditions = qualifyCondition.conditions;
    const { firstDepositOnly, depositCode } = conditions;

    // Type narrowing: solo mostrar warnings de CALCULATED VALUE
    if (conditions.contributesToRewardValue) {
      const { minAmount, maxAmount, bonusPercentage, maxBonusAmount } = conditions;

      // Guard: Si faltan valores requeridos, no mostrar warnings de cálculo
      if (minAmount === undefined || bonusPercentage === undefined || maxBonusAmount === undefined) {
        return warningsList;
      }

      // Warning: Depósito por debajo del mínimo
      if (depositAmount < minAmount) {
        warningsList.push({
          type: "error",
          message: `El depósito debe ser de al menos ${minAmount}€ para calificar para el bonus.`,
        });
      }

      // Warning: Depósito por encima del máximo
      if (maxAmount && depositAmount > maxAmount) {
        warningsList.push({
          type: "warning",
          message: `El depósito excede el máximo elegible de ${maxAmount}€. Solo se calculará bonus sobre ${maxAmount}€.`,
        });
      }

      // Info: Cálculo del bonus esperado
      if (depositAmount >= minAmount && bonusPercentage > 0) {
        const eligibleAmount = maxAmount
          ? Math.min(depositAmount, maxAmount)
          : depositAmount;
        const calculatedBonus = (eligibleAmount * bonusPercentage) / 100;
        const finalBonus = Math.min(calculatedBonus, maxBonusAmount);

        warningsList.push({
          type: "info",
          message: `Bonus esperado: ${finalBonus.toFixed(2)}€ (${bonusPercentage.toFixed(0)}% sobre ${eligibleAmount}€)`,
        });
      }
    } else {
      // FIXED VALUE: solo verificar si coincide con targetAmount
      const { targetAmount } = conditions;

      if (depositAmount !== targetAmount) {
        warningsList.push({
          type: "error",
          message: `Debes depositar exactamente ${targetAmount}€ para calificar.`,
        });
      } else {
        warningsList.push({
          type: "info",
          message: `Depósito correcto: ${targetAmount}€`,
        });
      }
    }

    // Warning: Primer depósito únicamente
    if (firstDepositOnly) {
      warningsList.push({
        type: "warning",
        message:
          "Esta promoción solo aplica para el primer depósito en la casa de apuestas.",
      });
    }

    // Info: Código de depósito requerido
    if (depositCode) {
      warningsList.push({
        type: "info",
        message: `Asegúrate de usar el código de depósito: ${depositCode}`,
      });
    }

    return warningsList;
  }, [depositAmount, qualifyCondition]);

  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {warnings.map((warning: WarningType, index: number) => (
        <Alert
          key={index}
          className={`${
            warning.type === "error"
              ? "border-red-200 bg-red-50"
              : warning.type === "warning"
                ? "border-yellow-200 bg-yellow-50"
                : "border-blue-200 bg-blue-50"
          }`}
        >
          {warning.type === "error" && (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          {warning.type === "warning" && (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
          {warning.type === "info" && (
            <Info className="h-4 w-4 text-blue-500" />
          )}
          <AlertDescription
            className={
              warning.type === "error"
                ? "text-red-700"
                : warning.type === "warning"
                  ? "text-yellow-700"
                  : "text-blue-700"
            }
          >
            {warning.message}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

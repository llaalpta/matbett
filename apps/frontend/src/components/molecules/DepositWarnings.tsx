"use client";

import { AlertTriangle, Info, XCircle } from "lucide-react";
import React from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { RewardDepositQualifyConditionFormData } from "@/types/ui";
import { formatCurrency, formatPercentage } from "@/utils/formatters";

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
  const warnings: WarningType[] = React.useMemo(() => {
    const warningsList: WarningType[] = [];

    if (!qualifyCondition || !depositAmount || depositAmount <= 0) {
      return warningsList;
    }

    const conditions = qualifyCondition.conditions;
    const { firstDepositOnly, depositCode } = conditions;

    if (conditions.contributesToRewardValue) {
      const { minAmount, maxAmount, bonusPercentage, maxBonusAmount } = conditions;

      if (
        minAmount === undefined ||
        bonusPercentage === undefined ||
        maxBonusAmount === undefined
      ) {
        return warningsList;
      }

      if (depositAmount < minAmount) {
        warningsList.push({
          type: "error",
          message: `El depósito debe ser de al menos ${formatCurrency(minAmount)} para calificar para el bonus.`,
        });
      }

      if (maxAmount && depositAmount > maxAmount) {
        warningsList.push({
          type: "warning",
          message: `El depósito excede el máximo elegible de ${formatCurrency(maxAmount)}. Sólo se calculará bonus sobre ${formatCurrency(maxAmount)}.`,
        });
      }

      if (depositAmount >= minAmount && bonusPercentage > 0) {
        const eligibleAmount = maxAmount
          ? Math.min(depositAmount, maxAmount)
          : depositAmount;
        const calculatedBonus = (eligibleAmount * bonusPercentage) / 100;
        const finalBonus = Math.min(calculatedBonus, maxBonusAmount);

        warningsList.push({
          type: "info",
          message: `Bonus esperado: ${formatCurrency(finalBonus)} (${formatPercentage(
            bonusPercentage,
            "es-ES",
            0
          )} sobre ${formatCurrency(eligibleAmount)})`,
        });
      }
    } else {
      const { targetAmount } = conditions;
      if (targetAmount === undefined) {
        return warningsList;
      }

      if (depositAmount !== targetAmount) {
        warningsList.push({
          type: "error",
          message: `Debes depositar exactamente ${formatCurrency(targetAmount)} para calificar.`,
        });
      } else {
        warningsList.push({
          type: "info",
          message: `Depósito correcto: ${formatCurrency(targetAmount)}`,
        });
      }
    }

    if (firstDepositOnly) {
      warningsList.push({
        type: "warning",
        message:
          "Esta promoción sólo aplica para el primer depósito en la casa de apuestas.",
      });
    }

    if (depositCode) {
      warningsList.push({
        type: "info",
        message: `Asegurate de usar el código de depósito: ${depositCode}`,
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

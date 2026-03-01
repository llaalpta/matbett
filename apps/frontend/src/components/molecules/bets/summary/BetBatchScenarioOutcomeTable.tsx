"use client";

import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";
import { cn } from "@/lib/utils";
import {
  formatCurrencyAmount,
  formatFixedNumber,
  formatFixedPercentage,
  formatSignedCurrencyAmount,
  getSignedMetricToneClass,
} from "@/utils/formatters";

import type { ScenarioOutcomeSummary } from "../types";

type BetBatchScenarioOutcomeTableProps = {
  summary: ScenarioOutcomeSummary;
  mainLeg: BetBatchFormValues["legs"][number] | undefined;
  hedge1Leg: BetBatchFormValues["legs"][number] | undefined;
};

export function BetBatchScenarioOutcomeTable({
  summary,
  mainLeg,
  hedge1Leg,
}: BetBatchScenarioOutcomeTableProps) {
  const backReturn = summary.totals.mainStake + summary.mainWins.mainProfit;
  const layReturn = summary.totals.hedge1Stake;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="px-4 py-3 text-left font-medium"></th>
              <th className="px-4 py-3 text-right font-medium">Stake</th>
              <th className="px-4 py-3 text-right font-medium">Cuota</th>
              <th className="px-4 py-3 text-right font-medium">Retorno</th>
              <th className="px-4 py-3 text-right font-medium">Riesgo</th>
              <th className="px-4 py-3 text-right font-medium">
                Beneficio si gana
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="px-4 py-3 font-medium">Back</td>
              <td className="px-4 py-3 text-right">
                {formatCurrencyAmount(summary.totals.mainStake)}
              </td>
              <td className="px-4 py-3 text-right">
                {mainLeg?.odds ? formatFixedNumber(mainLeg.odds) : "—"}
              </td>
              <td className="px-4 py-3 text-right font-semibold">
                {formatCurrencyAmount(backReturn)}
              </td>
              <td
                className={cn(
                  "px-4 py-3 text-right font-semibold",
                  getSignedMetricToneClass(summary.hedge1Wins.mainRisk)
                )}
              >
                {formatSignedCurrencyAmount(summary.hedge1Wins.mainRisk)}
              </td>
              <td
                className={cn(
                  "px-4 py-3 text-right font-semibold",
                  getSignedMetricToneClass(summary.mainWins.mainProfit)
                )}
              >
                {formatSignedCurrencyAmount(summary.mainWins.mainProfit)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Lay</td>
              <td className="px-4 py-3 text-right">
                {formatCurrencyAmount(summary.totals.hedge1Stake)}
              </td>
              <td className="px-4 py-3 text-right">
                {hedge1Leg?.odds ? formatFixedNumber(hedge1Leg.odds) : "—"}
              </td>
              <td className="px-4 py-3 text-right font-semibold">
                {formatCurrencyAmount(layReturn)}
              </td>
              <td
                className={cn(
                  "px-4 py-3 text-right font-semibold",
                  getSignedMetricToneClass(summary.mainWins.hedge1Risk)
                )}
              >
                {formatSignedCurrencyAmount(summary.mainWins.hedge1Risk)}
              </td>
              <td
                className={cn(
                  "px-4 py-3 text-right font-semibold",
                  getSignedMetricToneClass(summary.hedge1Wins.hedge1Profit)
                )}
              >
                {formatSignedCurrencyAmount(summary.hedge1Wins.hedge1Profit)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="px-4 py-3 text-left font-medium"></th>
              <th className="px-4 py-3 text-right font-medium">Turnover</th>
              <th className="px-4 py-3 text-right font-medium">
                Beneficio si gana Backbet
              </th>
              <th className="px-4 py-3 text-right font-medium">
                Beneficio si gana Laybet
              </th>
              <th className="px-4 py-3 text-right font-medium">
                Yield si gana Backbet
              </th>
              <th className="px-4 py-3 text-right font-medium">
                Yield si gana Laybet
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-3 font-medium">Global</td>
              <td className="px-4 py-3 text-right font-semibold">
                {formatCurrencyAmount(summary.totals.turnover)}
              </td>
              <td
                className={cn(
                  "px-4 py-3 text-right font-semibold",
                  getSignedMetricToneClass(summary.mainWins.balance)
                )}
              >
                {formatSignedCurrencyAmount(summary.mainWins.balance)}
              </td>
              <td
                className={cn(
                  "px-4 py-3 text-right font-semibold",
                  getSignedMetricToneClass(summary.hedge1Wins.balance)
                )}
              >
                {formatSignedCurrencyAmount(summary.hedge1Wins.balance)}
              </td>
              <td
                className={cn(
                  "px-4 py-3 text-right font-semibold",
                  getSignedMetricToneClass(summary.mainWins.yield)
                )}
              >
                {formatFixedPercentage(summary.mainWins.yield)}
              </td>
              <td
                className={cn(
                  "px-4 py-3 text-right font-semibold",
                  getSignedMetricToneClass(summary.hedge1Wins.yield)
                )}
              >
                {formatFixedPercentage(summary.hedge1Wins.yield)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

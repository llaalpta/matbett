"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BetBatchFormValues } from "@/hooks/useBetBatchForm";
import { cn } from "@/lib/utils";
import {
  formatCurrencyAmount,
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

const headClassName =
  "text-muted-foreground h-8 px-2 py-1.5 text-left text-[11px] font-semibold";
const numericHeadClassName = cn(headClassName, "text-right");
const cellClassName = "px-2 py-1.5 text-xs";
const numericCellClassName = cn(cellClassName, "text-right tabular-nums");

export function BetBatchScenarioOutcomeTable({
  summary,
}: BetBatchScenarioOutcomeTableProps) {
  return (
    <div className="max-w-full overflow-x-auto rounded-md border [contain:layout_paint]">
      <Table className="w-full min-w-[720px] border-separate border-spacing-0 text-xs table-fixed">
        <colgroup>
          <col className="w-[240px]" />
          <col className="w-[160px]" />
          <col className="w-[160px]" />
          <col className="w-[160px]" />
        </colgroup>
        <TableHeader>
          <TableRow className="border-border/70 bg-muted/40 hover:bg-muted/40">
            <TableHead className={headClassName}>Resultado posible</TableHead>
            <TableHead className={numericHeadClassName}>Turnover</TableHead>
            <TableHead className={numericHeadClassName}>
              Balance estimado
            </TableHead>
            <TableHead className={numericHeadClassName}>Yield estimado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <ScenarioResultRow
            label="Gana la apuesta principal"
            turnover={summary.totals.turnover}
            balance={summary.mainWins.balance}
            yieldValue={summary.mainWins.yield}
          />
          <ScenarioResultRow
            label="Gana la cobertura"
            turnover={summary.totals.turnover}
            balance={summary.hedge1Wins.balance}
            yieldValue={summary.hedge1Wins.yield}
          />
        </TableBody>
      </Table>
    </div>
  );
}

function ScenarioResultRow({
  label,
  turnover,
  balance,
  yieldValue,
}: {
  label: string;
  turnover: number;
  balance: number;
  yieldValue: number;
}) {
  return (
    <TableRow className="hover:bg-muted/20">
      <TableCell className={cn(cellClassName, "font-medium")}>{label}</TableCell>
      <TableCell className={cn(numericCellClassName, "font-semibold")}>
        {formatCurrencyAmount(turnover)}
      </TableCell>
      <TableCell
        className={cn(
          numericCellClassName,
          "font-semibold",
          getSignedMetricToneClass(balance)
        )}
      >
        {formatSignedCurrencyAmount(balance)}
      </TableCell>
      <TableCell
        className={cn(
          numericCellClassName,
          "font-semibold",
          getSignedMetricToneClass(yieldValue)
        )}
      >
        {formatFixedPercentage(yieldValue)}
      </TableCell>
    </TableRow>
  );
}

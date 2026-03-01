"use client";

import type { BetListItem } from "@matbett/shared";
import { betStatusOptions, getLabel } from "@matbett/shared";
import { Eye } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import {
  getBetBalanceTone,
  getBetEventSummary,
  getBetSelectionSummary,
} from "@/utils/bets";
import {
  formatCurrencyAmount,
  formatDate,
  formatFixedNumber,
  formatTime,
  formatSignedCurrencyAmount,
} from "@/utils/formatters";
import { getCompactStatusLabel } from "@/utils/statusLabels";

function TrackingValue({
  value,
  tone = "neutral",
  className,
}: {
  value: string;
  tone?: "positive" | "negative" | "neutral";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-[96px] text-right font-medium tabular-nums whitespace-nowrap",
        tone === "positive" && "text-emerald-600 dark:text-emerald-400",
        tone === "negative" && "text-red-600 dark:text-red-400",
        className
      )}
    >
      {value}
    </div>
  );
}

function getAccountLabel(
  bet: BetListItem,
  bookmakerAccountLabelById?: Map<string, string>
) {
  return bookmakerAccountLabelById?.get(bet.bookmakerAccountId) ?? bet.bookmakerAccountId;
}

export function BetTrackingTable({
  bets,
  bookmakerAccountLabelById,
  contextColumn,
}: {
  bets: BetListItem[];
  bookmakerAccountLabelById?: Map<string, string>;
  contextColumn?: {
    header: string;
    render: (bet: BetListItem) => {
      primary: string;
      secondary?: string;
    };
  };
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead className="bg-muted/25">
          <tr className="border-b">
            <th className="text-muted-foreground px-2.5 py-1 text-left text-[11px] font-medium tracking-[0.03em]">
              Fecha
            </th>
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-left text-[11px] font-medium tracking-[0.03em]">
              Hora
            </th>
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-left text-[11px] font-medium tracking-[0.03em]">
              Apuesta
            </th>
            {contextColumn ? (
              <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-left text-[11px] font-medium tracking-[0.03em]">
                {contextColumn.header}
              </th>
            ) : null}
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-left text-[11px] font-medium tracking-[0.03em]">
              Cuenta
            </th>
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-left text-[11px] font-medium tracking-[0.03em]">
              Estado
            </th>
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-right text-[11px] font-medium tracking-[0.03em]">
              Stake
            </th>
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-right text-[11px] font-medium tracking-[0.03em]">
              Cuota
            </th>
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-right text-[11px] font-medium tracking-[0.03em]">
              Balance
            </th>
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-left text-[11px] font-medium tracking-[0.03em]">
            </th>
          </tr>
        </thead>
        <tbody>
          {bets.map((bet) => {
            const contextSummary = contextColumn?.render(bet);

            return (
              <tr key={bet.id} className="border-b border-border/50 last:border-b-0">
                <td className="px-2.5 py-1.5">
                  <div className="min-w-[104px] font-medium tabular-nums whitespace-nowrap">
                    {formatDate(bet.placedAt)}
                  </div>
                </td>
                <td className="border-l border-border/30 px-2.5 py-1.5">
                  <div className="min-w-[78px] tabular-nums whitespace-nowrap">
                    {formatTime(bet.placedAt)}
                  </div>
                </td>
                <td className="border-l border-border/30 px-2.5 py-1.5">
                  <div
                    className="min-w-[220px] max-w-[280px] truncate font-medium"
                    title={`${getBetSelectionSummary(bet)} · ${getBetEventSummary(bet)}`}
                  >
                    {getBetSelectionSummary(bet)} · {getBetEventSummary(bet)}
                  </div>
                </td>
                {contextSummary ? (
                  <td className="border-l border-border/30 px-2.5 py-1.5">
                    <div className="min-w-[132px] max-w-[170px]">
                      <div className="truncate font-medium" title={contextSummary.primary}>
                        {contextSummary.primary}
                      </div>
                      {contextSummary.secondary ? (
                        <div className="text-muted-foreground truncate text-[11px]" title={contextSummary.secondary}>
                          {contextSummary.secondary}
                        </div>
                      ) : null}
                    </div>
                  </td>
                ) : null}
                <td className="border-l border-border/30 px-2.5 py-1.5 font-normal">
                  <div
                    className="min-w-[160px] max-w-[220px] truncate"
                    title={getAccountLabel(bet, bookmakerAccountLabelById)}
                  >
                    {getAccountLabel(bet, bookmakerAccountLabelById)}
                  </div>
                </td>
                <td className="border-l border-border/30 px-2.5 py-1.5">
                  <StatusBadge
                    status={bet.status}
                    label={getCompactStatusLabel(bet.status, getLabel(betStatusOptions, bet.status))}
                    title={getLabel(betStatusOptions, bet.status)}
                  />
                </td>
                <td className="border-l border-border/30 px-2.5 py-1.5">
                  <TrackingValue value={formatCurrencyAmount(bet.stake)} className="min-w-[112px]" />
                </td>
                <td className="border-l border-border/30 px-2.5 py-1.5">
                  <TrackingValue value={formatFixedNumber(bet.odds)} className="min-w-[88px]" />
                </td>
                <td className="border-l border-border/30 px-2.5 py-1.5">
                  <TrackingValue
                    value={
                      bet.balance === null || bet.balance === undefined
                        ? "-"
                        : formatSignedCurrencyAmount(bet.balance)
                    }
                    className="min-w-[112px]"
                    tone={getBetBalanceTone(bet.balance)}
                  />
                </td>
                <td className="border-l border-border/30 px-2.5 py-1.5">
                  <Link href={`/bets/batches/${bet.batchId}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      title="Abrir batch"
                      aria-label="Abrir batch"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

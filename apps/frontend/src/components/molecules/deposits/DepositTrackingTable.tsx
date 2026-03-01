"use client";

import type { DepositEntity } from "@matbett/shared";
import { Eye } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatBookmakerAccountLabel } from "@/utils/bookmakerAccounts";
import { formatCurrencyAmount, formatDate, formatTime } from "@/utils/formatters";

export function DepositTrackingTable({
  deposits,
  contextColumn,
}: {
  deposits: DepositEntity[];
  contextColumn?: {
    header: string;
    render: (deposit: DepositEntity) => {
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
            {contextColumn ? (
              <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-left text-[11px] font-medium tracking-[0.03em]">
                {contextColumn.header}
              </th>
            ) : null}
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-left text-[11px] font-medium tracking-[0.03em]">
              Código
            </th>
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-left text-[11px] font-medium tracking-[0.03em]">
              Cuenta
            </th>
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-right text-[11px] font-medium tracking-[0.03em]">
              Importe
            </th>
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-left text-[11px] font-medium tracking-[0.03em]">
            </th>
          </tr>
        </thead>
        <tbody>
          {deposits.map((deposit) => {
            const contextSummary = contextColumn?.render(deposit);

            return (
              <tr key={deposit.id} className="border-b border-border/50 last:border-b-0">
                <td className="px-2.5 py-1.5">
                  <div className="min-w-[104px] font-medium tabular-nums whitespace-nowrap">
                    {formatDate(deposit.date)}
                  </div>
                </td>
                <td className="border-l border-border/30 px-2.5 py-1.5">
                  <div className="min-w-[78px] tabular-nums whitespace-nowrap">
                    {formatTime(deposit.date)}
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
                <td className="border-l border-border/30 px-2.5 py-1.5">
                  <div className="min-w-[120px] max-w-[150px] truncate" title={deposit.code ?? "Sin código"}>
                    {deposit.code ?? "Sin código"}
                  </div>
                </td>
                <td className="border-l border-border/30 px-2.5 py-1.5 font-normal">
                  <div className="min-w-[160px] max-w-[220px] truncate" title={formatBookmakerAccountLabel(deposit)}>
                    {formatBookmakerAccountLabel(deposit)}
                  </div>
                </td>
                <td className="border-l border-border/30 px-2.5 py-1.5">
                  <div className="min-w-[112px] text-right font-medium tabular-nums whitespace-nowrap">
                    {formatCurrencyAmount(deposit.amount)}
                  </div>
                </td>
                <td className="border-l border-border/30 px-2.5 py-1.5">
                  <Link href={`/deposits/${deposit.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      title="Abrir depósito"
                      aria-label="Abrir depósito"
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

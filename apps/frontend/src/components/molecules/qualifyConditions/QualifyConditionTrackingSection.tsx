"use client";

import type { QualifyConditionEntity } from "@matbett/shared";
import Link from "next/link";

import { BetTrackingTable } from "@/components/molecules/bets/BetTrackingTable";
import { DepositTrackingTable } from "@/components/molecules/deposits/DepositTrackingTable";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useBetsByQualifyCondition } from "@/hooks/api/useBets";
import { useBookmakerAccounts } from "@/hooks/api/useBookmakerAccounts";
import { useDepositsByQualifyCondition } from "@/hooks/api/useDeposits";
import { formatBookmakerAccountLabel } from "@/utils/bookmakerAccounts";

type QualifyConditionTrackingSectionProps = {
  condition: QualifyConditionEntity;
  canLaunchBetEntry?: boolean;
  betEntryHref?: string;
};

export function QualifyConditionTrackingSection({
  condition,
  canLaunchBetEntry = false,
  betEntryHref,
}: QualifyConditionTrackingSectionProps) {
  const betsQuery = useBetsByQualifyCondition(condition.id, {
    pageIndex: 0,
    pageSize: 50,
  });
  const depositsQuery = useDepositsByQualifyCondition(condition.id, {
    pageIndex: 0,
    pageSize: 50,
  });
  const bookmakerAccountsQuery = useBookmakerAccounts({
    pageIndex: 0,
    pageSize: 100,
  });

  const bookmakerAccountLabelById = new Map(
    (bookmakerAccountsQuery.data?.data ?? []).map((account) => [
      account.id,
      formatBookmakerAccountLabel(account),
    ])
  );
  const bets = betsQuery.data?.data ?? [];
  const deposits = depositsQuery.data?.data ?? [];
  const isLoading =
    betsQuery.isLoading ||
    depositsQuery.isLoading ||
    bookmakerAccountsQuery.isLoading;
  const title =
    condition.type === "DEPOSIT"
      ? "Depósitos relacionados"
      : "Apuestas relacionadas";

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-muted-foreground text-sm">
            Tracking registrado manualmente para esta condición de calificación.
          </p>
        </div>

        {condition.type !== "DEPOSIT" && canLaunchBetEntry && betEntryHref ? (
          <Link href={betEntryHref}>
            <Button type="button" size="sm">
              Registrar apuesta
            </Button>
          </Link>
        ) : null}
      </div>

      {isLoading ? (
        <LoadingState label="Cargando tracking..." />
      ) : condition.type === "DEPOSIT" ? (
        deposits.length > 0 ? (
          <div className="overflow-hidden rounded-md border bg-card">
            <div className="overflow-x-auto">
              <DepositTrackingTable deposits={deposits} />
            </div>
          </div>
        ) : (
          <EmptyState
            title="Sin depósitos registrados"
            description="No hay depósitos registrados para esta condición."
            className="min-h-[120px]"
          />
        )
      ) : bets.length > 0 ? (
        <div className="overflow-hidden rounded-md border bg-card">
          <div className="overflow-x-auto">
            <BetTrackingTable
              bets={bets}
              bookmakerAccountLabelById={bookmakerAccountLabelById}
            />
          </div>
        </div>
      ) : (
        <EmptyState
          title="Sin apuestas registradas"
          description="No hay apuestas registradas para esta condición."
          className="min-h-[120px]"
        />
      )}
    </section>
  );
}

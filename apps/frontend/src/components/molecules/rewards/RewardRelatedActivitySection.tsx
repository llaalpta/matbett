"use client";

import { BetTrackingTable } from "@/components/molecules/bets/BetTrackingTable";
import { DepositTrackingTable } from "@/components/molecules/deposits/DepositTrackingTable";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useBookmakerAccounts } from "@/hooks/api/useBookmakerAccounts";
import { useRewardRelatedTracking } from "@/hooks/api/useRewards";
import { formatBookmakerAccountLabel } from "@/utils/bookmakerAccounts";
import {
  getRewardRelatedBetContextSummary,
  getRewardRelatedDepositContextSummary,
} from "@/utils/rewards";

type RewardRelatedActivitySectionProps = {
  rewardId: string;
};

export function RewardRelatedActivitySection({
  rewardId,
}: RewardRelatedActivitySectionProps) {
  const relatedTrackingQuery = useRewardRelatedTracking(rewardId);
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
  const relatedBets = relatedTrackingQuery.data?.relatedBets ?? [];
  const relatedDeposits = relatedTrackingQuery.data?.relatedDeposits ?? [];
  const isLoading =
    relatedTrackingQuery.isLoading || bookmakerAccountsQuery.isLoading;

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">Actividad relacionada</h2>
        <p className="text-muted-foreground text-sm">
          Apuestas y depósitos registrados contra la calificación o uso de esta recompensa.
        </p>
      </div>

      {isLoading ? (
        <LoadingState label="Cargando actividad relacionada..." />
      ) : relatedTrackingQuery.error ? (
        <EmptyState
          title="No se pudo cargar la actividad"
          description="Reintenta más tarde o revisa el estado de la conexión."
          className="min-h-[120px]"
        />
      ) : relatedBets.length === 0 && relatedDeposits.length === 0 ? (
        <EmptyState
          title="Sin actividad relacionada"
          description="Las apuestas o depósitos aparecerán aquí cuando se registren desde esta recompensa o sus condiciones."
          className="min-h-[120px]"
        />
      ) : (
        <div className="grid gap-4">
          {relatedBets.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.06em]">
                Apuestas relacionadas
              </h3>
              <div className="overflow-hidden rounded-md border bg-card">
                <div className="overflow-x-auto">
                  <BetTrackingTable
                    bets={relatedBets.map((item) => item.bet)}
                    bookmakerAccountLabelById={bookmakerAccountLabelById}
                    contextColumn={{
                      header: "Contexto",
                      render: (bet) => {
                        const item = relatedBets.find(
                          (candidate) => candidate.bet.id === bet.id
                        );
                        return item
                          ? getRewardRelatedBetContextSummary(item)
                          : { primary: "Actividad relacionada" };
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {relatedDeposits.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.06em]">
                Depósitos relacionados
              </h3>
              <div className="overflow-hidden rounded-md border bg-card">
                <div className="overflow-x-auto">
                  <DepositTrackingTable
                    deposits={relatedDeposits.map((item) => item.deposit)}
                    contextColumn={{
                      header: "Contexto",
                      render: (deposit) => {
                        const item = relatedDeposits.find(
                          (candidate) => candidate.deposit.id === deposit.id
                        );
                        return item
                          ? getRewardRelatedDepositContextSummary(item)
                          : { primary: "Condición · Depósito" };
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

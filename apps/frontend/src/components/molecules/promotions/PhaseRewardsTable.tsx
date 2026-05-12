"use client";

import {
  getLabel,
  rewardStatusOptions,
  rewardTypeOptions,
  type RewardEntity,
} from "@matbett/shared";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrencyAmount } from "@/utils/formatters";
import { getCompactStatusLabel } from "@/utils/statusLabels";

type PhaseRewardsTableProps = {
  rewards: RewardEntity[];
  phaseId?: string;
  promotionId?: string;
  canAddReward: boolean;
  addRewardDisabledReason?: string;
  title?: string;
  description?: string;
  emptyDescription?: string;
};

export function PhaseRewardsTable({
  rewards,
  phaseId,
  promotionId,
  canAddReward,
  addRewardDisabledReason,
  title = "Recompensas de la fase",
  description,
  emptyDescription = "Guarda la fase y añade una recompensa desde este contexto.",
}: PhaseRewardsTableProps) {
  const columns = useMemo<Array<ColumnDef<RewardEntity>>>(
    () => [
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => (
          <div className="min-w-[110px] font-medium">
            {getLabel(rewardTypeOptions, row.original.type)}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            label={getCompactStatusLabel(
              row.original.status,
              getLabel(rewardStatusOptions, row.original.status)
            )}
            title={getLabel(rewardStatusOptions, row.original.status)}
          />
        ),
      },
      {
        accessorKey: "value",
        header: "Valor",
        cell: ({ row }) => (
          <div className="min-w-[112px] text-right font-medium tabular-nums whitespace-nowrap">
            {formatCurrencyAmount(row.original.value ?? 0)}
          </div>
        ),
      },
      {
        id: "qualifyConditions",
        header: "Condiciones",
        cell: ({ row }) => {
          const fulfilledCount = row.original.qualifyConditions.filter(
            (condition) => condition.status === "FULFILLED"
          ).length;
          const total = row.original.qualifyConditions.length;

          return (
            <div className="min-w-[70px] font-medium">
              {total === 0 ? "Sin condiciones" : `${fulfilledCount}/${total}`}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Link href={`/rewards/${row.original.id}`}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                aria-label="Abrir recompensa"
                title="Abrir recompensa"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  const canCreate = canAddReward && Boolean(phaseId && promotionId);

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-muted-foreground text-sm">
            {description ??
              (rewards.length === 0
                ? "Fase sin recompensas persistidas."
                : `${rewards.length} recompensa${rewards.length === 1 ? "" : "s"} persistida${rewards.length === 1 ? "" : "s"}.`)}
          </p>
        </div>

        {canCreate ? (
          <Link href={`/rewards/new/from-phase/${phaseId}?promotionId=${promotionId}`}>
            <Button type="button" variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Añadir recompensa
            </Button>
          </Link>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            title={addRewardDisabledReason}
          >
            <Plus className="mr-2 h-4 w-4" />
            Añadir recompensa
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={rewards}
        getRowId={(reward) => reward.id}
        showFooter={false}
        variant="embedded"
        emptyState={
          <EmptyState
            title="Sin recompensas"
            description={emptyDescription}
            className="min-h-[120px] border-none px-0 py-0"
          />
        }
      />
    </section>
  );
}

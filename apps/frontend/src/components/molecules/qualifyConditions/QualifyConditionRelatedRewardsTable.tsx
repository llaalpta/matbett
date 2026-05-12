"use client";

import {
  getLabel,
  phaseStatusOptions,
  promotionStatusOptions,
  rewardStatusOptions,
  rewardTypeOptions,
  type QualifyConditionEntity,
} from "@matbett/shared";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCompactStatusLabel } from "@/utils/statusLabels";

type LinkedRewardRow = QualifyConditionEntity["linkedRewards"][number];

type QualifyConditionRelatedRewardsTableProps = {
  rewards: LinkedRewardRow[];
};

export function QualifyConditionRelatedRewardsTable({
  rewards,
}: QualifyConditionRelatedRewardsTableProps) {
  const columns = useMemo<Array<ColumnDef<LinkedRewardRow>>>(
    () => [
      {
        accessorKey: "type",
        header: "Recompensa",
        cell: ({ row }) => (
          <div className="min-w-[120px] font-medium">
            {getLabel(rewardTypeOptions, row.original.type)}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado de la recompensa",
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
        id: "phase",
        header: "Fase",
        cell: ({ row }) => (
          <div className="min-w-[130px] max-w-[220px] truncate" title={row.original.phaseName}>
            {row.original.phaseName ?? `F${(row.original.phaseIndex ?? 0) + 1}`}
          </div>
        ),
      },
      {
        accessorKey: "phaseStatus",
        header: "Estado fase",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.phaseStatus}
            label={getCompactStatusLabel(
              row.original.phaseStatus,
              getLabel(phaseStatusOptions, row.original.phaseStatus)
            )}
            title={getLabel(phaseStatusOptions, row.original.phaseStatus)}
          />
        ),
      },
      {
        accessorKey: "promotionStatus",
        header: "Estado promoción",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.promotionStatus}
            label={getCompactStatusLabel(
              row.original.promotionStatus,
              getLabel(promotionStatusOptions, row.original.promotionStatus)
            )}
            title={getLabel(promotionStatusOptions, row.original.promotionStatus)}
          />
        ),
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

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">Recompensas asociadas</h2>
        <p className="text-muted-foreground text-sm">
          El estado de estas recompensas puede bloquear la edición o el tracking de esta condición.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={rewards}
        getRowId={(reward) => reward.id}
        showFooter={false}
        variant="embedded"
        emptyState={
          <EmptyState
            title="Sin recompensas asociadas"
            description="No se encontraron recompensas asociadas dentro de la promoción actual."
            className="min-h-[120px] border-none px-0 py-0"
          />
        }
      />
    </section>
  );
}

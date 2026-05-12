"use client";

import {
  getLabel,
  qualifyConditionStatusOptions,
  qualifyConditionTypeOptions,
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
import {
  getQualifyConditionSummary,
  getQualifyTrackingSummary,
} from "@/utils/qualifyConditions";
import { getCompactStatusLabel } from "@/utils/statusLabels";

type RewardQualifyConditionsTableProps = {
  reward: RewardEntity;
  canAdd: boolean;
  disabledReason?: string;
};

type RewardQualifyConditionRow = RewardEntity["qualifyConditions"][number];

export function RewardQualifyConditionsTable({
  reward,
  canAdd,
  disabledReason,
}: RewardQualifyConditionsTableProps) {
  const columns = useMemo<Array<ColumnDef<RewardQualifyConditionRow>>>(
    () => [
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => (
          <div className="min-w-[100px] font-medium">
            {getLabel(qualifyConditionTypeOptions, row.original.type)}
          </div>
        ),
      },
      {
        id: "details",
        header: "Detalles",
        cell: ({ row }) => {
          const details = getQualifyConditionSummary(row.original);

          return (
            <div
              className="max-w-[360px] truncate"
              title={details.primary}
            >
              {details.primary}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            label={getCompactStatusLabel(
              row.original.status,
              getLabel(qualifyConditionStatusOptions, row.original.status)
            )}
            title={getLabel(qualifyConditionStatusOptions, row.original.status)}
          />
        ),
      },
      {
        id: "tracking",
        header: "Progreso",
        cell: ({ row }) => {
          const tracking = getQualifyTrackingSummary(row.original);

          return (
            <div className="max-w-[180px] truncate" title={tracking.label}>
              {tracking.label}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Link href={`/qualify-conditions/${row.original.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                aria-label="Abrir condición"
                title="Abrir condición"
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Condiciones de calificación</h2>
          <p className="text-muted-foreground text-sm">
            Las condiciones se gestionan como entidades propias desde el contexto de la recompensa.
          </p>
        </div>
        {canAdd ? (
          <Link href={`/qualify-conditions/new/from-reward/${reward.id}`}>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Añadir condición
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" disabled title={disabledReason}>
            <Plus className="mr-2 h-4 w-4" />
            Añadir condición
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={reward.qualifyConditions}
        getRowId={(condition) => condition.id}
        showFooter={false}
        variant="embedded"
        emptyState={
          <EmptyState
            title="Sin condiciones de calificación"
            description="Si la recompensa se obtiene automáticamente, puede quedarse sin condiciones."
            className="min-h-[120px] border-none px-0 py-0"
          />
        }
      />
    </section>
  );
}

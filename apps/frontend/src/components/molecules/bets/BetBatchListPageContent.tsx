"use client";

import type { BetBatchSummary, BetBatchListInput } from "@matbett/shared";
import {
  betLineModeOptions,
  betStatusOptions,
  getLabel,
  hedgeModeOptions,
  strategyKindOptions,
  strategyTypeOptions,
  type BetStatus,
  type StrategyKind,
} from "@matbett/shared";
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table";
import { Eye, Pencil, Plus, ReceiptText, Rows3, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/atoms/ConfirmDialog";
import { ApiErrorBanner, CenteredErrorState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useBetBatches, useDeleteBetBatch } from "@/hooks/api/useBets";
import { useBookmakerAccounts } from "@/hooks/api/useBookmakerAccounts";
import { useApiErrorMessage } from "@/hooks/useApiErrorMessage";
import { useApiSuccessToast } from "@/hooks/useApiSuccessToast";
import { cn } from "@/lib/utils";
import { formatBookmakerAccountLabel } from "@/utils/bookmakerAccounts";
import {
  formatDateTime,
  formatFixedPercentage,
  formatSignedCurrencyAmount,
} from "@/utils/formatters";

type BatchFilters = {
  status: BetStatus | "ALL";
  strategyKind: StrategyKind | "ALL";
  bookmakerAccountId: string | "ALL";
};

const defaultFilters: BatchFilters = {
  status: "ALL",
  strategyKind: "ALL",
  bookmakerAccountId: "ALL",
};

function isBetStatusFilter(value: string): value is BatchFilters["status"] {
  return value === "ALL" || betStatusOptions.some((option) => option.value === value);
}

function isStrategyKindFilter(value: string): value is BatchFilters["strategyKind"] {
  return (
    value === "ALL" || strategyKindOptions.some((option) => option.value === value)
  );
}

function getStrategySummary(batch: BetBatchSummary) {
  if (batch.strategy.kind === "NONE") {
    return {
      primary: getLabel(strategyKindOptions, batch.strategy.kind),
      secondary: "Batch standalone",
    };
  }

  return {
    primary: getLabel(betLineModeOptions, batch.strategy.lineMode),
    secondary: `${getLabel(strategyTypeOptions, batch.strategy.strategyType)} · ${getLabel(hedgeModeOptions, batch.strategy.mode)}`,
  };
}

function getBatchAccountSummary(
  batch: BetBatchSummary,
  accountLabelById: Map<string, string>
) {
  const labels = batch.bookmakerAccountIds
    .map((id) => accountLabelById.get(id))
    .filter((value): value is string => Boolean(value));

  if (labels.length === 0) {
    return "Sin cuentas";
  }

  if (labels.length <= 2) {
    return labels.join(" · ");
  }

  return `${labels.slice(0, 2).join(" · ")} +${labels.length - 2}`;
}

function getUniqueStatuses(statuses: readonly string[]) {
  return [...new Set(statuses)];
}

function BatchValue({
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
        "min-w-[96px] text-right font-medium tabular-nums",
        tone === "positive" && "text-emerald-600 dark:text-emerald-400",
        tone === "negative" && "text-red-600 dark:text-red-400",
        tone === "neutral" && "text-foreground",
        className
      )}
    >
      {value}
    </div>
  );
}

export default function BetBatchListPageContent() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [filters, setFilters] = useState<BatchFilters>(defaultFilters);
  const [batchPendingDelete, setBatchPendingDelete] = useState<BetBatchSummary | null>(
    null
  );

  const { apiErrorMessage, clearApiError, setApiError } = useApiErrorMessage();
  const { notifySuccess } = useApiSuccessToast();

  const queryInput: BetBatchListInput = {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting,
    status: filters.status === "ALL" ? undefined : filters.status,
    strategyKind:
      filters.strategyKind === "ALL" ? undefined : filters.strategyKind,
    bookmakerAccountId:
      filters.bookmakerAccountId === "ALL"
        ? undefined
        : filters.bookmakerAccountId,
  };

  const { data, isLoading, error, isFetching, refetch } = useBetBatches(queryInput);
  const deleteBatch = useDeleteBetBatch();
  const { data: bookmakerAccountsData } = useBookmakerAccounts({
    pageIndex: 0,
    pageSize: 100,
  });

  const batches = data?.data ?? [];
  const meta = data?.meta;
  const bookmakerAccounts = bookmakerAccountsData?.data;

  const bookmakerAccountLabelById = useMemo(
    () =>
      new Map(
        (bookmakerAccounts ?? []).map((account) => [
          account.id,
          formatBookmakerAccountLabel(account),
        ])
      ),
    [bookmakerAccounts]
  );

  const columns = useMemo<Array<ColumnDef<BetBatchSummary>>>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Registrado",
        enableSorting: true,
        cell: ({ row }) => (
          <div className="min-w-[140px]">
            <div className="font-medium tabular-nums">
              {formatDateTime(row.original.createdAt)}
            </div>
            <div className="text-muted-foreground mt-1 max-w-[260px] truncate font-mono text-[11px]">
              {row.original.scenarioId ?? "Sin scenarioId"}
            </div>
          </div>
        ),
      },
      {
        id: "strategy",
        header: "Estrategia",
        cell: ({ row }) => {
          const strategy = getStrategySummary(row.original);

          return (
            <div className="min-w-[180px]">
              <div className="font-medium">{strategy.primary}</div>
              <div className="text-muted-foreground mt-1 text-xs">
                {strategy.secondary}
              </div>
            </div>
          );
        },
      },
      {
        id: "accounts",
        header: "Cuentas",
        cell: ({ row }) => (
          <div className="min-w-[200px] text-sm">
            {getBatchAccountSummary(row.original, bookmakerAccountLabelById)}
          </div>
        ),
      },
      {
        id: "statuses",
        header: "Estados",
        cell: ({ row }) => (
          <div className="flex min-w-[170px] flex-wrap gap-1">
            {getUniqueStatuses(row.original.statuses).map((status) => (
              <StatusBadge
                key={`${row.original.id}-${status}`}
                status={status}
                label={getLabel(betStatusOptions, status)}
              />
            ))}
          </div>
        ),
      },
      {
        accessorKey: "legsCount",
        header: "Legs",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-right font-medium tabular-nums">
            {row.original.legsCount}
          </div>
        ),
      },
      {
        accessorKey: "profit",
        header: "Profit",
        enableSorting: true,
        cell: ({ row }) => (
          <BatchValue
            value={formatSignedCurrencyAmount(row.original.profit)}
            className="min-w-[108px]"
            tone={row.original.profit > 0 ? "positive" : row.original.profit < 0 ? "negative" : "neutral"}
          />
        ),
      },
      {
        accessorKey: "risk",
        header: "Risk",
        enableSorting: true,
        cell: ({ row }) => (
          <BatchValue
            value={formatSignedCurrencyAmount(row.original.risk)}
            className="min-w-[108px]"
            tone={row.original.risk < 0 ? "negative" : row.original.risk > 0 ? "positive" : "neutral"}
          />
        ),
      },
      {
        accessorKey: "yield",
        header: "Yield",
        enableSorting: true,
        cell: ({ row }) => (
          <BatchValue value={formatFixedPercentage(row.original.yield)} className="min-w-[88px]" />
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Link href={`/bets/batches/${row.original.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Abrir batch"
                aria-label="Abrir batch"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/bets/${row.original.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Editar batch"
                aria-label="Editar batch"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              title="Eliminar batch"
              aria-label="Eliminar batch"
              onClick={() => {
                clearApiError();
                setBatchPendingDelete(row.original);
              }}
              disabled={deleteBatch.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [bookmakerAccountLabelById, clearApiError, deleteBatch.isPending]
  );

  const resetToFirstPage = () => {
    setPagination((current) => ({
      ...current,
      pageIndex: 0,
    }));
  };

  const handleStatusFilterChange = (value: string) => {
    if (!isBetStatusFilter(value)) {
      return;
    }

    setFilters((current) => ({
      ...current,
      status: value,
    }));
    resetToFirstPage();
  };

  const handleStrategyKindChange = (value: string) => {
    if (!isStrategyKindFilter(value)) {
      return;
    }

    setFilters((current) => ({
      ...current,
      strategyKind: value,
    }));
    resetToFirstPage();
  };

  const handleBookmakerAccountChange = (value: string) => {
    setFilters((current) => ({
      ...current,
      bookmakerAccountId: value,
    }));
    resetToFirstPage();
  };

  const handleConfirmDelete = async () => {
    if (!batchPendingDelete) {
      return;
    }

    clearApiError();

    try {
      await deleteBatch.mutateAsync({ id: batchPendingDelete.id });
      notifySuccess("Batch eliminado.");
      setBatchPendingDelete(null);
    } catch (deleteError) {
      setApiError(deleteError, "No se pudo eliminar el batch.");
    }
  };

  if (error && !data) {
    return (
      <CenteredErrorState
        error={error}
        fallbackMessage="No se pudieron cargar los batches."
        onRetry={() => {
          void refetch();
        }}
        backHref="/"
        backLabel="Volver al inicio"
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operativa"
        title="Batches de apuestas"
        description="Vista agregada de grupos de legs registrados. Úsala para revisar el batch completo; la operativa diaria principal está en la lista flat de apuestas."
        actions={
          <>
            <Link href="/bets">
              <Button variant="outline">
                <Rows3 className="mr-2 h-4 w-4" />
                Ver bets
              </Button>
            </Link>
            <Link href="/bets/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo batch
              </Button>
            </Link>
          </>
        }
        meta={
          <>
            <span>{meta?.rowCount ?? 0} batches</span>
            <span>{isFetching ? "Actualizando datos..." : "Datos sincronizados"}</span>
          </>
        }
      />

      <ApiErrorBanner
        errorMessage={apiErrorMessage}
        onDismissError={clearApiError}
      />

      <DataTable
        columns={columns}
        data={batches}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowCount={meta?.rowCount}
        pageCount={meta?.pageCount}
        isLoading={isLoading}
        toolbar={
          <FilterBar>
            <div className="grid flex-1 gap-3 md:grid-cols-3 xl:grid-cols-4">
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs font-medium uppercase tracking-[0.06em]">
                  Estado
                </div>
                <Select
                  name="batchStatus"
                  value={filters.status}
                  onValueChange={handleStatusFilterChange}
                >
                  <SelectTrigger className="w-full" aria-label="Filtrar por estado">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los estados</SelectItem>
                    {betStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <div className="text-muted-foreground text-xs font-medium uppercase tracking-[0.06em]">
                  Cobertura
                </div>
                <Select
                  name="batchStrategyKind"
                  value={filters.strategyKind}
                  onValueChange={handleStrategyKindChange}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label="Filtrar por cobertura"
                  >
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los tipos</SelectItem>
                    {strategyKindOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 md:col-span-2 xl:col-span-1">
                <div className="text-muted-foreground text-xs font-medium uppercase tracking-[0.06em]">
                  Cuenta
                </div>
                <Select
                  name="batchBookmakerAccount"
                  value={filters.bookmakerAccountId}
                  onValueChange={handleBookmakerAccountChange}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label="Filtrar por cuenta"
                  >
                    <SelectValue placeholder="Todas las cuentas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas las cuentas</SelectItem>
                    {(bookmakerAccounts ?? []).map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {formatBookmakerAccountLabel(account)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters(defaultFilters);
                  setSorting([{ id: "createdAt", desc: true }]);
                  setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </FilterBar>
        }
        emptyState={
          <EmptyState
            title="No hay batches registrados"
            description="Empieza registrando un batch y usa después esta vista para revisar el conjunto completo de legs y resultados."
            icon={ReceiptText}
            action={
              <Link href="/bets/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar primer batch
                </Button>
              </Link>
            }
            className="min-h-[220px] border-none px-0 py-0"
          />
        }
      />

      <ConfirmDialog
        open={Boolean(batchPendingDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setBatchPendingDelete(null);
          }
        }}
        title="Eliminar batch"
        description="Se eliminará el batch completo con sus legs y participaciones. Esta acción no se puede deshacer."
        confirmText="Eliminar batch"
        cancelText="Cancelar"
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </div>
  );
}

"use client";

import type { BetListInput, BetListItem, BetStatus } from "@matbett/shared";
import {
  betStatusOptions,
  getLabel,
} from "@matbett/shared";
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table";
import { Eye, Pencil, Plus, ReceiptText, Rows3 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { CenteredErrorState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useFlatBets } from "@/hooks/api/useBets";
import { useBookmakerAccounts } from "@/hooks/api/useBookmakerAccounts";
import { cn } from "@/lib/utils";
import {
  getBetBalanceTone,
  getBetEventSummary,
  getBetPromotionSummary,
  getBetSelectionSummary,
} from "@/utils/bets";
import { formatBookmakerAccountLabel } from "@/utils/bookmakerAccounts";
import {
  formatCurrencyAmount,
  formatDate,
  formatFixedNumber,
  formatTime,
  formatSignedCurrencyAmount,
} from "@/utils/formatters";
import { getCompactStatusLabel } from "@/utils/statusLabels";

type BetFilters = {
  status: BetStatus | "ALL";
  bookmakerAccountId: string | "ALL";
  placedFrom: string;
  placedTo: string;
};

const defaultFilters: BetFilters = {
  status: "ALL",
  bookmakerAccountId: "ALL",
  placedFrom: "",
  placedTo: "",
};

function isBetStatusFilter(value: string): value is BetFilters["status"] {
  return value === "ALL" || betStatusOptions.some((option) => option.value === value);
}

function toStartOfDay(dateValue: string) {
  return dateValue ? new Date(`${dateValue}T00:00:00`) : undefined;
}

function toEndOfDay(dateValue: string) {
  return dateValue ? new Date(`${dateValue}T23:59:59.999`) : undefined;
}

function BetValue({
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
        tone === "neutral" && "text-foreground",
        className
      )}
    >
      {value}
    </div>
  );
}

export default function BetFlatListPageContent() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "placedAt", desc: true },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [filters, setFilters] = useState<BetFilters>(defaultFilters);

  const { data: bookmakerAccountsData } = useBookmakerAccounts({
    pageIndex: 0,
    pageSize: 100,
  });

  const queryInput: BetListInput = {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting,
    status: filters.status === "ALL" ? undefined : filters.status,
    bookmakerAccountId:
      filters.bookmakerAccountId === "ALL"
        ? undefined
        : filters.bookmakerAccountId,
    placedFrom: toStartOfDay(filters.placedFrom),
    placedTo: toEndOfDay(filters.placedTo),
  };

  const { data, isLoading, error, isFetching, refetch } = useFlatBets(queryInput);
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

  const bets = data?.data ?? [];
  const meta = data?.meta;

  const columns = useMemo<Array<ColumnDef<BetListItem>>>(
    () => [
      {
        accessorKey: "placedAt",
        header: "Fecha",
        enableSorting: true,
        cell: ({ row }) => (
          <div className="min-w-[104px] font-medium tabular-nums whitespace-nowrap">
            {formatDate(row.original.placedAt)}
          </div>
        ),
      },
      {
        id: "placedTime",
        header: "Hora",
        cell: ({ row }) => (
          <div className="min-w-[78px] tabular-nums whitespace-nowrap">
            {formatTime(row.original.placedAt)}
          </div>
        ),
      },
      {
        id: "selection",
        header: "Apuesta",
        cell: ({ row }) => (
          <div
            className="min-w-[220px] max-w-[290px] truncate font-medium"
            title={`${getBetSelectionSummary(row.original)} · ${getBetEventSummary(row.original)}`}
          >
            {getBetSelectionSummary(row.original)} · {getBetEventSummary(row.original)}
          </div>
        ),
      },
      {
        id: "promotion",
        header: "Promoción",
        cell: ({ row }) => {
          const summary = getBetPromotionSummary(row.original.promotionContext);

          return (
            <div className="min-w-[200px] max-w-[260px] truncate font-medium" title={summary.primary}>
              {summary.primary}
            </div>
          );
        },
      },
      {
        id: "account",
        header: "Casa / cuenta",
        cell: ({ row }) => (
          <div
            className="min-w-[170px] max-w-[220px] truncate font-normal"
            title={
              bookmakerAccountLabelById.get(row.original.bookmakerAccountId) ??
              row.original.bookmakerAccountId
            }
          >
            {bookmakerAccountLabelById.get(row.original.bookmakerAccountId) ??
              row.original.bookmakerAccountId}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        enableSorting: true,
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            label={getCompactStatusLabel(
              row.original.status,
              getLabel(betStatusOptions, row.original.status)
            )}
            title={getLabel(betStatusOptions, row.original.status)}
          />
        ),
      },
      {
        accessorKey: "stake",
        header: "Stake",
        enableSorting: true,
        cell: ({ row }) => <BetValue value={formatCurrencyAmount(row.original.stake)} className="min-w-[112px]" />,
      },
      {
        accessorKey: "odds",
        header: "Cuota",
        enableSorting: true,
        cell: ({ row }) => <BetValue value={formatFixedNumber(row.original.odds)} className="min-w-[88px]" />,
      },
      {
        accessorKey: "balance",
        header: "Balance",
        enableSorting: true,
        cell: ({ row }) => (
          <BetValue
            value={
              row.original.balance === null || row.original.balance === undefined
                ? "-"
                : formatSignedCurrencyAmount(row.original.balance)
            }
            className="min-w-[112px]"
            tone={getBetBalanceTone(row.original.balance)}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-0.5">
            <Link href={`/bets/batches/${row.original.batchId}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                title="Abrir batch"
                aria-label="Abrir batch"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/bets/${row.original.batchId}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                title="Editar batch"
                aria-label="Editar batch"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ),
      },
    ],
    [bookmakerAccountLabelById]
  );

  if (error && !data) {
    return (
      <CenteredErrorState
        error={error}
        fallbackMessage="No se pudieron cargar las apuestas."
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
        title="Apuestas"
        description="Lista operativa de legs registradas para revisar ejecución real, contexto promocional, estado y balance de cierre."
        actions={
          <>
            <Link href="/bets/batches">
              <Button variant="outline">
                <Rows3 className="mr-2 h-4 w-4" />
                Ver batches
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
            <span>{meta?.rowCount ?? 0} apuestas</span>
            <span>{isFetching ? "Actualizando datos..." : "Datos sincronizados"}</span>
          </>
        }
      />
      <DataTable
        columns={columns}
        data={bets}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowCount={meta?.rowCount}
        pageCount={meta?.pageCount}
        isLoading={isLoading}
        toolbar={
          <FilterBar>
            <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs font-medium uppercase tracking-[0.06em]">
                  Estado
                </div>
                <Select
                  name="betStatus"
                  value={filters.status}
                  onValueChange={(value) => {
                    if (!isBetStatusFilter(value)) {
                      return;
                    }

                    setFilters((current) => ({ ...current, status: value }));
                    setPagination((current) => ({ ...current, pageIndex: 0 }));
                  }}
                >
                  <SelectTrigger className="w-full" aria-label="Filtrar bets por estado">
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

              <div className="space-y-1 xl:col-span-2">
                <div className="text-muted-foreground text-xs font-medium uppercase tracking-[0.06em]">
                  Casa / cuenta
                </div>
                <Select
                  name="betBookmakerAccount"
                  value={filters.bookmakerAccountId}
                  onValueChange={(value) => {
                    setFilters((current) => ({
                      ...current,
                      bookmakerAccountId: value,
                    }));
                    setPagination((current) => ({ ...current, pageIndex: 0 }));
                  }}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label="Filtrar bets por casa y cuenta"
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

              <div className="space-y-1">
                <label
                  htmlFor="betPlacedFrom"
                  className="text-muted-foreground block text-xs font-medium uppercase tracking-[0.06em]"
                >
                  Desde
                </label>
                <Input
                  id="betPlacedFrom"
                  name="betPlacedFrom"
                  type="date"
                  value={filters.placedFrom}
                  onChange={(event) => {
                    setFilters((current) => ({
                      ...current,
                      placedFrom: event.target.value,
                    }));
                    setPagination((current) => ({ ...current, pageIndex: 0 }));
                  }}
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="betPlacedTo"
                  className="text-muted-foreground block text-xs font-medium uppercase tracking-[0.06em]"
                >
                  Hasta
                </label>
                <Input
                  id="betPlacedTo"
                  name="betPlacedTo"
                  type="date"
                  value={filters.placedTo}
                  onChange={(event) => {
                    setFilters((current) => ({
                      ...current,
                      placedTo: event.target.value,
                    }));
                    setPagination((current) => ({ ...current, pageIndex: 0 }));
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters(defaultFilters);
                  setSorting([{ id: "placedAt", desc: true }]);
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
            title="No hay apuestas registradas"
            description="Cuando registres batches, aquí podrás revisar cada leg por separado con su contexto promocional y balance real."
            icon={ReceiptText}
            action={
              <Link href="/bets/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar primera apuesta
                </Button>
              </Link>
            }
            className="min-h-[220px] border-none px-0 py-0"
          />
        }
      />
    </div>
  );
}

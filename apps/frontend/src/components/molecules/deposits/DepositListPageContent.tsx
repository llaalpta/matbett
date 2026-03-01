"use client";

import type { DepositEntity, DepositListInput } from "@matbett/shared";
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table";
import { Eye, FolderKanban, Plus } from "lucide-react";
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
import { useBookmakerAccounts } from "@/hooks/api/useBookmakerAccounts";
import { useDepositsList } from "@/hooks/api/useDeposits";
import { formatBookmakerAccountLabel } from "@/utils/bookmakerAccounts";
import { getDepositPromotionSummary } from "@/utils/deposits";
import { formatCurrencyAmount, formatDate, formatTime } from "@/utils/formatters";

type DepositFilters = {
  bookmakerAccountId: string | "ALL";
  globalFilter: string;
};

const defaultFilters: DepositFilters = {
  bookmakerAccountId: "ALL",
  globalFilter: "",
};

function DepositContextCell({ deposit }: { deposit: DepositEntity }) {
  const summary = getDepositPromotionSummary(deposit);

  return (
    <div className="min-w-[200px] max-w-[260px] truncate font-medium" title={summary.primary}>
      {summary.primary}
    </div>
  );
}

export default function DepositListPageContent() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [filters, setFilters] = useState<DepositFilters>(defaultFilters);

  const { data: bookmakerAccountsData } = useBookmakerAccounts({
    pageIndex: 0,
    pageSize: 100,
  });

  const queryInput: DepositListInput = {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting,
    bookmakerAccountId:
      filters.bookmakerAccountId === "ALL" ? undefined : filters.bookmakerAccountId,
    globalFilter: filters.globalFilter.trim() || undefined,
  };

  const { data, isLoading, isError, error, isFetching, refetch } = useDepositsList(queryInput);
  const deposits = data?.data ?? [];
  const meta = data?.meta;
  const bookmakerAccounts = useMemo(
    () => bookmakerAccountsData?.data ?? [],
    [bookmakerAccountsData]
  );

  const bookmakerAccountLabelById = useMemo(
    () =>
      new Map(
        bookmakerAccounts.map((account) => [account.id, formatBookmakerAccountLabel(account)])
      ),
    [bookmakerAccounts]
  );

  const columns = useMemo<Array<ColumnDef<DepositEntity>>>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Fecha",
        enableSorting: true,
        cell: ({ row }) => (
          <div className="min-w-[104px] font-medium tabular-nums whitespace-nowrap">
            {formatDate(row.original.createdAt)}
          </div>
        ),
      },
      {
        id: "createdTime",
        header: "Hora",
        cell: ({ row }) => (
          <div className="min-w-[78px] tabular-nums whitespace-nowrap">
            {formatTime(row.original.createdAt)}
          </div>
        ),
      },
      {
        accessorKey: "code",
        header: "Código",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="min-w-[140px] font-mono text-xs">
            {row.original.code ?? "Sin código"}
          </div>
        ),
      },
      {
        id: "promotion",
        header: "Promoción",
        cell: ({ row }) => <DepositContextCell deposit={row.original} />,
      },
      {
        accessorKey: "amount",
        header: "Importe",
        enableSorting: true,
        cell: ({ row }) => (
          <div className="min-w-[112px] text-right font-medium tabular-nums whitespace-nowrap">
            {formatCurrencyAmount(row.original.amount)}
          </div>
        ),
      },
      {
        id: "account",
        header: "Casa / cuenta",
        cell: ({ row }) => (
          <div
            className="min-w-[180px] max-w-[230px] truncate font-normal"
            title={
              bookmakerAccountLabelById.get(row.original.bookmakerAccountId ?? "") ??
              `${row.original.bookmaker}${row.original.bookmakerAccountIdentifier ? ` · ${row.original.bookmakerAccountIdentifier}` : ""}`
            }
          >
            {bookmakerAccountLabelById.get(row.original.bookmakerAccountId ?? "") ??
              `${row.original.bookmaker}${row.original.bookmakerAccountIdentifier ? ` · ${row.original.bookmakerAccountIdentifier}` : ""}`}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-0.5">
            <Link href={`/deposits/${row.original.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                title="Abrir depósito"
                aria-label="Abrir depósito"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ),
      },
    ],
    [bookmakerAccountLabelById]
  );

  if (isError && !data) {
    return (
      <CenteredErrorState
        error={error}
        fallbackMessage="No se pudieron cargar los depósitos."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operativa"
        title="Depósitos"
        description="Vista operativa de depósitos persistidos para revisar importe, contexto promocional y cuenta antes de entrar en detalle."
        actions={
          <Link href="/deposits/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo depósito
            </Button>
          </Link>
        }
        meta={
          <>
            <span>{meta?.rowCount ?? 0} depósitos</span>
            <span>{isFetching ? "Actualizando datos..." : "Datos sincronizados"}</span>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={deposits}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowCount={meta?.rowCount}
        pageCount={meta?.pageCount}
        isLoading={isLoading}
        toolbar={
          <FilterBar>
            <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-1 xl:col-span-2">
                <label
                  htmlFor="depositSearch"
                  className="text-muted-foreground block text-xs font-medium uppercase tracking-[0.06em]"
                >
                  Buscar
                </label>
                <Input
                  id="depositSearch"
                  name="depositSearch"
                  placeholder="Código, promoción o cuenta"
                  value={filters.globalFilter}
                  onChange={(event) => {
                    setFilters((current) => ({
                      ...current,
                      globalFilter: event.target.value,
                    }));
                    setPagination((current) => ({ ...current, pageIndex: 0 }));
                  }}
                />
              </div>

              <div className="space-y-1 xl:col-span-2">
                <div className="text-muted-foreground text-xs font-medium uppercase tracking-[0.06em]">
                  Casa / cuenta
                </div>
                <Select
                  name="depositBookmakerAccount"
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
                    aria-label="Filtrar depósitos por casa y cuenta"
                  >
                    <SelectValue placeholder="Todas las cuentas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas las cuentas</SelectItem>
                    {bookmakerAccounts.map((account) => (
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
            title="No hay depósitos"
            description="Los depósitos persistidos aparecerán aquí para revisión operativa y acceso rápido a su detalle."
            icon={FolderKanban}
            action={
              <Link href="/deposits/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar primer depósito
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

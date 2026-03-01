"use client";

import type {
  PromotionEntity,
  PromotionListInput,
  PromotionStatus,
  RewardEntity,
} from "@matbett/shared";
import {
  getLabel,
  promotionStatusOptions,
  rewardStatusOptions,
  rewardTypeOptions,
} from "@matbett/shared";
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Eye, FolderKanban, Plus } from "lucide-react";
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
import { useBookmakerAccounts } from "@/hooks/api/useBookmakerAccounts";
import { usePromotions } from "@/hooks/api/usePromotions";
import { cn } from "@/lib/utils";
import { formatBookmakerAccountLabel } from "@/utils/bookmakerAccounts";
import {
  formatCurrencyAmount,
  formatDate,
  formatFixedPercentage,
  isGenericPhaseName,
} from "@/utils/formatters";
import { getCompactStatusLabel } from "@/utils/statusLabels";

type PromotionFilters = {
  status: PromotionStatus | "ALL";
  bookmakerAccountId: string | "ALL";
  globalFilter: string;
};

type PromotionRewardRow = {
  phaseId: string;
  phaseName: string;
  phaseIndex: number;
  reward: RewardEntity;
};

const defaultFilters: PromotionFilters = {
  status: "ALL",
  bookmakerAccountId: "ALL",
  globalFilter: "",
};

function isPromotionStatusFilter(value: string): value is PromotionFilters["status"] {
  return value === "ALL" || promotionStatusOptions.some((option) => option.value === value);
}

function MetricValue({
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

function getPromotionRewardCount(promotion: PromotionEntity) {
  return promotion.phases.reduce((sum, phase) => sum + phase.rewards.length, 0);
}

function flattenPromotionRewards(promotion: PromotionEntity): PromotionRewardRow[] {
  return promotion.phases.flatMap((phase, phaseIndex) =>
    phase.rewards.map((reward) => ({
      phaseId: phase.id,
      phaseName: phase.name,
      phaseIndex,
      reward,
    }))
  );
}

function getPromotionPhaseSummary(promotionName: string, phaseName: string, phaseIndex: number) {
  const phaseLabel = `F${phaseIndex + 1}`;
  const normalizedPhaseName = phaseName.trim().toLocaleLowerCase();
  const normalizedPromotionName = promotionName.trim().toLocaleLowerCase();

  if (!normalizedPhaseName || normalizedPhaseName === normalizedPromotionName) {
    return {
      primary: phaseLabel,
      secondary: undefined,
    };
  }

  if (isGenericPhaseName(phaseName)) {
    return {
      primary: phaseLabel,
      secondary: undefined,
    };
  }

  return {
    primary: `${phaseLabel} · ${phaseName}`,
    secondary: undefined,
  };
}

function getPromotionRewardQualifySummary(reward: RewardEntity) {
  if (reward.qualifyConditions.length === 0) {
    return {
      primary: "Sin QC",
      secondary: "No requiere calificación",
    };
  }

  const fulfilledCount = reward.qualifyConditions.filter(
    (condition) => condition.status === "FULFILLED"
  ).length;

  return {
    primary: `${fulfilledCount}/${reward.qualifyConditions.length}`,
    secondary: undefined,
  };
}

function getPromotionRewardUsageFollowUp(reward: RewardEntity) {
  if (!reward.usageTracking) {
    return {
      primary: "Sin uso",
      secondary: undefined,
    };
  }

  switch (reward.usageTracking.type) {
    case "FREEBET":
      return {
        primary: `${formatCurrencyAmount(reward.usageTracking.totalUsed)} usado · ${formatCurrencyAmount(reward.usageTracking.remainingBalance)} restante`,
        secondary: undefined,
      };
    case "BET_BONUS_ROLLOVER":
      return {
        primary: `${formatCurrencyAmount(reward.usageTracking.rolloverProgress)} rollover · ${formatCurrencyAmount(reward.usageTracking.remainingRollover)} restante`,
        secondary: undefined,
      };
    case "BET_BONUS_NO_ROLLOVER":
      return {
        primary: `${formatCurrencyAmount(reward.usageTracking.totalUsed)} usado`,
        secondary: undefined,
      };
    case "CASHBACK_FREEBET":
      return {
        primary: `${formatCurrencyAmount(reward.usageTracking.totalCashback)} cashback`,
        secondary: undefined,
      };
    case "ENHANCED_ODDS":
      return {
        primary: reward.usageTracking.oddsUsed ? "Cuota usada" : "Sin uso",
        secondary: undefined,
      };
    case "CASINO_SPINS":
      return {
        primary: `${reward.usageTracking.spinsUsed} usados · ${reward.usageTracking.remainingSpins} restantes`,
        secondary: undefined,
      };
    default:
      return {
        primary: `Balance ${formatCurrencyAmount(reward.totalBalance)}`,
        secondary: undefined,
      };
  }
}

function PromotionExpandedPanel({ promotion }: { promotion: PromotionEntity }) {
  const rewardRows = flattenPromotionRewards(promotion);

  if (rewardRows.length === 0) {
    return (
      <div className="text-muted-foreground px-1 py-1 text-[13px]">
        Esta promoción todavía no tiene rewards persistidas.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="text-muted-foreground px-0.5 text-[11px] font-medium tracking-[0.03em]">
        Rewards de la promoción
      </div>
      <div className="overflow-hidden rounded-md border border-border/70 bg-background/80">
        <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead className="bg-muted/25">
          <tr className="border-b">
            <th className="text-muted-foreground px-2.5 py-1 text-left text-[11px] font-medium tracking-[0.03em]">
              Tipo
            </th>
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-left text-[11px] font-medium tracking-[0.03em]">
              Fase
            </th>
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-right text-[11px] font-medium tracking-[0.03em]">
              Valor
            </th>
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-left text-[11px] font-medium tracking-[0.03em]">
              Estado
            </th>
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-left text-[11px] font-medium tracking-[0.03em]">
              Calificación
            </th>
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-left text-[11px] font-medium tracking-[0.03em]">
              Uso
            </th>
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-right text-[11px] font-medium tracking-[0.03em]">
              Stake
            </th>
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-right text-[11px] font-medium tracking-[0.03em]">
              Balance
            </th>
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-right text-[11px] font-medium tracking-[0.03em]">
              Yield
            </th>
            <th className="text-muted-foreground border-l border-border/30 px-2.5 py-1 text-left text-[11px] font-medium tracking-[0.03em]">
            </th>
          </tr>
        </thead>
        <tbody>
          {rewardRows.map(({ phaseId, phaseName, phaseIndex, reward }) => {
            const qualify = getPromotionRewardQualifySummary(reward);
            const usage = getPromotionRewardUsageFollowUp(reward);
            const phaseSummary = getPromotionPhaseSummary(promotion.name, phaseName, phaseIndex);

            return (
              <tr key={`${phaseId}-${reward.id}`} className="border-b border-border/50 last:border-b-0">
                <td className="px-2.5 py-1.5">
                  <div
                    className="min-w-[150px] max-w-[190px] truncate font-medium"
                    title={getLabel(rewardTypeOptions, reward.type)}
                  >
                    {getLabel(rewardTypeOptions, reward.type)}
                  </div>
                </td>
                <td className="border-l border-border/30 px-2.5 py-1.5">
                  <div className="min-w-[90px] max-w-[140px] truncate font-medium" title={phaseSummary.primary}>
                    {phaseSummary.primary}
                  </div>
                </td>
                <td className="border-l border-border/30 px-2.5 py-1.5">
                  <MetricValue value={formatCurrencyAmount(reward.value ?? 0)} className="min-w-[112px]" />
                </td>
                <td className="border-l border-border/30 px-2.5 py-1.5">
                  <StatusBadge
                    status={reward.status}
                    label={getCompactStatusLabel(
                      reward.status,
                      getLabel(rewardStatusOptions, reward.status)
                    )}
                    title={getLabel(rewardStatusOptions, reward.status)}
                  />
                </td>
                <td className="border-l border-border/30 px-2.5 py-1.5">
                  <div className="min-w-[92px] max-w-[110px] truncate font-medium" title={qualify.primary}>
                    {qualify.primary}
                  </div>
                </td>
                <td className="border-l border-border/30 px-2.5 py-1.5">
                  <div className="min-w-[168px] max-w-[230px] truncate font-medium" title={usage.primary}>
                    {usage.primary}
                  </div>
                </td>
                <td className="border-l border-border/30 px-2.5 py-1.5">
                  <MetricValue value={formatCurrencyAmount(reward.totalStake ?? 0)} className="min-w-[112px]" />
                </td>
                <td className="border-l border-border/30 px-2.5 py-1.5">
                  <MetricValue
                    value={formatCurrencyAmount(reward.totalBalance)}
                    className="min-w-[112px]"
                    tone={
                      reward.totalBalance > 0
                        ? "positive"
                        : reward.totalBalance < 0
                          ? "negative"
                          : "neutral"
                    }
                  />
                </td>
                <td className="border-l border-border/30 px-2.5 py-1.5">
                  <MetricValue value={formatFixedPercentage(reward.aggregateYield ?? 0)} className="min-w-[92px]" />
                </td>
                <td className="border-l border-border/30 px-2.5 py-1.5">
                  <Link href={`/rewards/${reward.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      title="Abrir reward"
                      aria-label="Abrir reward"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
        </div>
      </div>
    </div>
  );
}

export default function PromotionListPageContent() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "timeframeEnd", desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [filters, setFilters] = useState<PromotionFilters>(defaultFilters);

  const { data: bookmakerAccountsData } = useBookmakerAccounts({
    pageIndex: 0,
    pageSize: 100,
  });

  const queryInput: PromotionListInput = {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting,
    status: filters.status === "ALL" ? undefined : filters.status,
    bookmakerAccountId:
      filters.bookmakerAccountId === "ALL" ? undefined : filters.bookmakerAccountId,
    globalFilter: filters.globalFilter.trim() || undefined,
  };

  const { data, isLoading, error, isFetching, refetch } = usePromotions(queryInput);

  const promotions = data?.data ?? [];
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

  const columns = useMemo<Array<ColumnDef<PromotionEntity>>>(
    () => [
      {
        id: "expand",
        header: "",
        cell: ({ row }) =>
          flattenPromotionRewards(row.original).length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => {
                row.toggleExpanded();
              }}
              aria-label={
                row.getIsExpanded()
                  ? "Ocultar rewards de la promoción"
                  : "Ver rewards de la promoción"
              }
              title={
                row.getIsExpanded()
                  ? "Ocultar rewards de la promoción"
                  : "Ver rewards de la promoción"
              }
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <span className="block h-7 w-7" aria-hidden="true" />
          ),
      },
      {
        accessorKey: "timeframeStart",
        header: "Inicio",
        enableSorting: true,
        cell: ({ row }) => (
          <div
            className="min-w-[104px] font-medium tabular-nums whitespace-nowrap"
            title={row.original.timeframeStart ? formatDate(row.original.timeframeStart) : "Sin resolver"}
          >
            {row.original.timeframeStart ? formatDate(row.original.timeframeStart) : "Sin resolver"}
          </div>
        ),
      },
      {
        accessorKey: "timeframeEnd",
        header: "Fin",
        enableSorting: true,
        cell: ({ row }) => (
          <div
            className="min-w-[104px] tabular-nums whitespace-nowrap"
            title={row.original.timeframeEnd ? formatDate(row.original.timeframeEnd) : "Sin resolver"}
          >
            {row.original.timeframeEnd ? formatDate(row.original.timeframeEnd) : "Sin resolver"}
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: "Promoción",
        enableSorting: true,
        cell: ({ row }) => (
          <div className="min-w-[220px] max-w-[320px] truncate font-medium" title={row.original.name}>
            {row.original.name}
          </div>
        ),
      },
      {
        id: "account",
        header: "Casa / cuenta",
        cell: ({ row }) => (
          <div
            className="min-w-[190px] max-w-[240px] truncate font-normal"
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
        accessorKey: "status",
        header: "Estado",
        enableSorting: true,
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            label={getCompactStatusLabel(
              row.original.status,
              getLabel(promotionStatusOptions, row.original.status)
            )}
            title={getLabel(promotionStatusOptions, row.original.status)}
          />
        ),
      },
      {
        id: "rewardsCount",
        header: "Rewards",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-center font-medium tabular-nums">
            {getPromotionRewardCount(row.original)}
          </div>
        ),
      },
      {
        accessorKey: "totalLegs",
        header: "Apuestas realizadas",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-center font-medium tabular-nums">
            {row.original.totalLegs ?? 0}
          </div>
        ),
      },
      {
        accessorKey: "totalDeposits",
        header: "Depósitos",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-center font-medium tabular-nums">
            {row.original.totalDeposits ?? 0}
          </div>
        ),
      },
      {
        accessorKey: "totalStake",
        header: "Stake",
        enableSorting: false,
        cell: ({ row }) => (
          <MetricValue value={formatCurrencyAmount(row.original.totalStake ?? 0)} className="min-w-[112px]" />
        ),
      },
      {
        accessorKey: "totalBalance",
        header: "Balance",
        enableSorting: false,
        cell: ({ row }) => (
          <MetricValue
            value={formatCurrencyAmount(row.original.totalBalance)}
            className="min-w-[112px]"
            tone={
              row.original.totalBalance > 0
                ? "positive"
                : row.original.totalBalance < 0
                  ? "negative"
                  : "neutral"
            }
          />
        ),
      },
      {
        accessorKey: "aggregateYield",
        header: "Yield",
        enableSorting: false,
        cell: ({ row }) => (
          <MetricValue value={formatFixedPercentage(row.original.aggregateYield ?? 0)} className="min-w-[92px]" />
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-0.5">
            <Link href={`/promotions/${row.original.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                title="Abrir promoción"
                aria-label="Abrir promoción"
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

  if (error && !data) {
    return (
      <CenteredErrorState
        error={error}
        fallbackMessage="No se pudieron cargar las promociones."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Promociones"
        title="Promociones"
        description="Vista operativa de promociones persistidas para comparar estado, rewards, actividad, stake real, balance y yield antes de entrar en detalle."
        actions={
          <Link href="/promotions/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Registrar promoción
            </Button>
          </Link>
        }
        meta={
          <>
            <span>{meta?.rowCount ?? 0} promociones</span>
            <span>{isFetching ? "Actualizando datos..." : "Datos sincronizados"}</span>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={promotions}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowCount={meta?.rowCount}
        pageCount={meta?.pageCount}
        isLoading={isLoading}
        getRowId={(promotion) => promotion.id}
        getRowCanExpand={(row) => flattenPromotionRewards(row.original).length > 0}
        renderExpandedRow={(row) => <PromotionExpandedPanel promotion={row.original} />}
        toolbar={
          <FilterBar>
            <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="space-y-1 xl:col-span-2">
                <label
                  htmlFor="promotionSearch"
                  className="text-muted-foreground block text-xs font-medium uppercase tracking-[0.06em]"
                >
                  Buscar
                </label>
                <Input
                  id="promotionSearch"
                  name="promotionSearch"
                  placeholder="Nombre o descripción"
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

              <div className="space-y-1">
                <div className="text-muted-foreground text-xs font-medium uppercase tracking-[0.06em]">
                  Estado
                </div>
                <Select
                  name="promotionStatus"
                  value={filters.status}
                  onValueChange={(value) => {
                    if (!isPromotionStatusFilter(value)) {
                      return;
                    }
                    setFilters((current) => ({ ...current, status: value }));
                    setPagination((current) => ({ ...current, pageIndex: 0 }));
                  }}
                >
                  <SelectTrigger className="w-full" aria-label="Filtrar promociones por estado">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los estados</SelectItem>
                    {promotionStatusOptions.map((option) => (
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
                  name="promotionBookmakerAccount"
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
                    aria-label="Filtrar promociones por casa y cuenta"
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
                  setSorting([{ id: "timeframeEnd", desc: false }]);
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
            title="No hay promociones"
            description="Las promociones persistidas aparecerán aquí para revisión operativa y acceso rápido a su detalle."
            icon={FolderKanban}
            action={
              <Link href="/promotions/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar promoción
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

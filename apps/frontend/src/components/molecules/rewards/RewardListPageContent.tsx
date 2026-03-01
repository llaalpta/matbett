"use client";

import type { RewardEntity, RewardListInput, RewardStatus, RewardType } from "@matbett/shared";
import {
  getRewardNextQualifyDeadline,
  getLabel,
  resolveTimeframeWindow,
  rewardStatusOptions,
  rewardTypeOptions,
} from "@matbett/shared";
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table";
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  Eye,
  FolderKanban,
  Gift,
  Rows3,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { CenteredErrorState } from "@/components/feedback";
import { BetTrackingTable } from "@/components/molecules/bets/BetTrackingTable";
import { DepositTrackingTable } from "@/components/molecules/deposits/DepositTrackingTable";
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
import { useRewardRelatedTracking, useRewards } from "@/hooks/api/useRewards";
import { useRewardAccessLogic } from "@/hooks/domain/rewards/useRewardAccessLogic";
import type { PromotionServerModel } from "@/types/hooks";
import { formatBookmakerAccountLabel } from "@/utils/bookmakerAccounts";
import {
  formatCurrencyAmount,
  formatDate,
  isGenericPhaseName,
} from "@/utils/formatters";
import {
  getRewardIdentitySummary,
  getRewardPromotionSummary,
  getRewardQualifySummary,
  getRewardRelatedBetContextSummary,
  getRewardRelatedDepositContextSummary,
  getRewardUsageSummary,
} from "@/utils/rewards";
import { getCompactStatusLabel } from "@/utils/statusLabels";

type RewardFilters = {
  status: RewardStatus | "ALL";
  type: RewardType | "ALL";
  promotionId: string | "ALL";
  globalFilter: string;
};

type PromotionSummary = {
  id: string;
  name: string;
  status: NonNullable<PromotionServerModel>["status"];
  promotion: PromotionServerModel;
};

const defaultFilters: RewardFilters = {
  status: "ALL",
  type: "ALL",
  promotionId: "ALL",
  globalFilter: "",
};

function isRewardStatusFilter(value: string): value is RewardFilters["status"] {
  return value === "ALL" || rewardStatusOptions.some((option) => option.value === value);
}

function isRewardTypeFilter(value: string): value is RewardFilters["type"] {
  return value === "ALL" || rewardTypeOptions.some((option) => option.value === value);
}

function getRewardPhaseSummary(
  reward: RewardEntity,
  promotionDataById: Map<string, PromotionSummary>
) {
  const promotion = promotionDataById.get(reward.promotionId ?? "");
  const phases = promotion?.promotion?.phases ?? [];
  const phaseIndex =
    phases.findIndex((phase) => phase.id === reward.phaseId);
  const resolvedPhaseName =
    phaseIndex >= 0
      ? phases[phaseIndex]?.name?.trim()
      : reward.phaseName?.trim();

  if (phaseIndex >= 0) {
    const phaseLabel = `F${phaseIndex + 1}`;
    const normalizedPhaseName = resolvedPhaseName?.toLocaleLowerCase().trim();
    const normalizedPromotionName = reward.promotionName?.toLocaleLowerCase().trim();

    if (
      !normalizedPhaseName ||
      normalizedPhaseName === normalizedPromotionName ||
      isGenericPhaseName(resolvedPhaseName)
    ) {
      return phaseLabel;
    }

    return `${phaseLabel} · ${resolvedPhaseName}`;
  }

  return resolvedPhaseName || undefined;
}

function hasRewardRelatedActivity(reward: RewardEntity) {
  return (
    reward.qualifyConditions.some(
      (condition) => condition.trackingStats.totalParticipations > 0
    ) || (reward.totalStake ?? 0) > 0
  );
}

function RewardActions({
  reward,
  promotion,
}: {
  reward: RewardEntity;
  promotion: PromotionSummary | undefined;
}) {
  const rewardAccess = useRewardAccessLogic({
    isPersisted: true,
    rewardType: reward.type,
    rewardStatus: reward.status,
    claimMethod: reward.claimMethod,
    qualifyConditionStatuses: reward.qualifyConditions.map((condition) => condition.status),
    promotion: promotion?.promotion ?? null,
    phaseId: reward.phaseId,
    usageTimeframe: reward.usageConditions.timeframe,
  });

  return (
    <div className="flex justify-end gap-0.5">
      {promotion ? (
        <Link href={`/promotions/${promotion.id}`}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title="Abrir promoción"
            aria-label="Abrir promoción"
          >
            <Rows3 className="h-4 w-4" />
          </Button>
        </Link>
      ) : null}
      {rewardAccess.supportsBetUsage ? (
        <Link
          href={rewardAccess.canLaunchBetEntry ? `/bets/new/from-reward/${reward.id}` : "#"}
          aria-disabled={!rewardAccess.canLaunchBetEntry}
          onClick={(event) => {
            if (!rewardAccess.canLaunchBetEntry) {
              event.preventDefault();
            }
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title={rewardAccess.betEntryDisabledReason || "Registrar uso en apuesta"}
            aria-label="Registrar uso en apuesta"
            disabled={!rewardAccess.canLaunchBetEntry}
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </Link>
      ) : null}
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
    </div>
  );
}

function RewardExpandedPanel({
  reward,
  bookmakerAccountLabelById,
}: {
  reward: RewardEntity;
  bookmakerAccountLabelById: Map<string, string>;
}) {
  const relatedTrackingQuery = useRewardRelatedTracking(reward.id);
  const relatedBets = relatedTrackingQuery.data?.relatedBets ?? [];
  const relatedDeposits = relatedTrackingQuery.data?.relatedDeposits ?? [];

  if (relatedTrackingQuery.isLoading) {
    return (
      <div className="text-muted-foreground px-1 py-1 text-[13px]">
        Cargando actividad relacionada...
      </div>
    );
  }

  if (relatedTrackingQuery.error) {
    return (
      <div className="text-muted-foreground px-1 py-1 text-[13px]">
        No se pudo cargar la actividad relacionada de esta reward.
      </div>
    );
  }

  if (relatedBets.length === 0 && relatedDeposits.length === 0) {
    return (
      <div className="text-muted-foreground px-1 py-1 text-[13px]">
        No hay actividad relacionada registrada todavía para esta reward.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {relatedBets.length > 0 ? (
        <div className="space-y-1.5">
          <div className="text-muted-foreground px-0.5 text-[11px] font-medium tracking-[0.03em]">
            Apuestas relacionadas
          </div>
          <div className="overflow-hidden rounded-md border border-border/70 bg-background/80">
            <div className="overflow-x-auto">
              <BetTrackingTable
                bets={relatedBets.map((item) => item.bet)}
                bookmakerAccountLabelById={bookmakerAccountLabelById}
                contextColumn={{
                  header: "Contexto",
                  render: (bet) => {
                    const item = relatedBets.find((candidate) => candidate.bet.id === bet.id);
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
        <div className="space-y-1.5">
          <div className="text-muted-foreground px-0.5 text-[11px] font-medium tracking-[0.03em]">
            Depósitos relacionados
          </div>
          <div className="overflow-hidden rounded-md border border-border/70 bg-background/80">
            <div className="overflow-x-auto">
              <DepositTrackingTable
                deposits={relatedDeposits.map((item) => item.deposit)}
                contextColumn={{
                  header: "Contexto",
                  render: (deposit) => {
                    const item = relatedDeposits.find((candidate) => candidate.deposit.id === deposit.id);
                    return item
                      ? getRewardRelatedDepositContextSummary(item)
                      : { primary: "QC · Depósito" };
                  },
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function RewardListPageContent() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "nextQualifyDeadline", desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [filters, setFilters] = useState<RewardFilters>(defaultFilters);

  const promotionsQuery = usePromotions({
    pageIndex: 0,
    pageSize: 100,
  });
  const bookmakerAccountsQuery = useBookmakerAccounts({
    pageIndex: 0,
    pageSize: 100,
  });
  const promotions = useMemo(() => promotionsQuery.data?.data ?? [], [promotionsQuery.data]);
  const bookmakerAccounts = useMemo(
    () => bookmakerAccountsQuery.data?.data ?? [],
    [bookmakerAccountsQuery.data]
  );

  const queryInput: RewardListInput = {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting,
    status: filters.status === "ALL" ? undefined : filters.status,
    type: filters.type === "ALL" ? undefined : filters.type,
    promotionId: filters.promotionId === "ALL" ? undefined : filters.promotionId,
    globalFilter: filters.globalFilter.trim() || undefined,
  };

  const { data, isLoading, error, isFetching, refetch } = useRewards(queryInput);

  const rewards = data?.data ?? [];
  const meta = data?.meta;
  const bookmakerAccountLabelById = useMemo(
    () =>
      new Map(
        bookmakerAccounts.map((account) => [account.id, formatBookmakerAccountLabel(account)])
      ),
    [bookmakerAccounts]
  );

  const promotionDataById = useMemo(
    () =>
      new Map(
        promotions.map((promotion) => [
          promotion.id,
          {
            id: promotion.id,
            name: promotion.name,
            status: promotion.status,
            promotion,
          } satisfies PromotionSummary,
        ])
      ),
    [promotions]
  );

  const columns = useMemo<Array<ColumnDef<RewardEntity>>>(
    () => [
      {
        id: "expand",
        header: "",
        cell: ({ row }) =>
          hasRewardRelatedActivity(row.original) ? (
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
                  ? "Ocultar apuestas o depósitos relacionados"
                  : "Ver apuestas o depósitos relacionados"
              }
              title={
                row.getIsExpanded()
                  ? "Ocultar apuestas o depósitos relacionados"
                  : "Ver apuestas o depósitos relacionados"
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
        id: "promotion",
        header: "Promoción",
        cell: ({ row }) => {
          const summary = getRewardPromotionSummary(
            row.original,
            getRewardPhaseSummary(row.original, promotionDataById)
          );

          return (
            <div className="min-w-[180px] max-w-[240px] truncate font-medium" title={summary.primary}>
              {summary.primary}
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Tipo de reward",
        enableSorting: true,
        cell: ({ row }) => {
          const summary = getRewardIdentitySummary(row.original);

          return (
            <div className="min-w-[120px] max-w-[150px] truncate font-medium" title={summary.primary}>
              {summary.primary}
            </div>
          );
        },
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
              getLabel(rewardStatusOptions, row.original.status)
            )}
            title={getLabel(rewardStatusOptions, row.original.status)}
          />
        ),
      },
      {
        accessorKey: "value",
        header: "Valor",
        enableSorting: true,
        cell: ({ row }) => (
          <div className="min-w-[110px] text-right font-medium tabular-nums whitespace-nowrap">
            {formatCurrencyAmount(row.original.value ?? 0)}
          </div>
        ),
      },
      {
        accessorKey: "nextQualifyDeadline",
        header: "Calificación hasta",
        enableSorting: true,
        cell: ({ row }) => {
          const promotion = promotionDataById.get(row.original.promotionId ?? "")?.promotion;
          const deadline = getRewardNextQualifyDeadline(row.original, promotion);
          const label =
            deadline.state === "date" && deadline.date
              ? formatDate(deadline.date)
              : deadline.state === "no_qc"
                ? "Sin QC"
                : deadline.state === "closed"
                  ? "Cerrada"
                  : deadline.state === "open_ended"
                    ? "Sin resolver"
                    : "Sin resolver";

          return (
            <div className="min-w-[104px] font-medium tabular-nums whitespace-nowrap" title={label}>
              {label}
            </div>
          );
        },
      },
      {
        id: "qualify",
        header: "QC",
        cell: ({ row }) => {
          const summary = getRewardQualifySummary(row.original);

          return (
            <div className="min-w-[92px] max-w-[110px] truncate font-medium" title={summary.primary}>
              {summary.primary}
            </div>
          );
        },
      },
      {
        accessorKey: "usageTimeframeEnd",
        header: "Uso hasta",
        enableSorting: true,
        cell: ({ row }) => {
          const promotion = promotionDataById.get(row.original.promotionId ?? "")?.promotion;
          const usageWindow = resolveTimeframeWindow(
            row.original.usageConditions.timeframe,
            promotion
          );
          const label = !usageWindow.resolved
            ? "Sin resolver"
            : usageWindow.end
              ? formatDate(usageWindow.end)
              : "Sin resolver";

          return (
            <div className="min-w-[104px] tabular-nums whitespace-nowrap" title={label}>
              {label}
            </div>
          );
        },
      },
      {
        id: "usage",
        header: "Uso",
        cell: ({ row }) => {
          const summary = getRewardUsageSummary(row.original);

          return (
            <div className="min-w-[155px] max-w-[210px] truncate font-medium" title={summary.primary}>
              {summary.primary}
            </div>
          );
        },
      },
      {
        accessorKey: "totalBalance",
        header: "Balance",
        enableSorting: false,
        cell: ({ row }) => (
          <div
            className={[
              "min-w-[110px] text-right font-medium tabular-nums whitespace-nowrap",
              row.original.totalBalance > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : row.original.totalBalance < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-foreground",
            ].join(" ")}
          >
            {formatCurrencyAmount(row.original.totalBalance)}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <RewardActions
            reward={row.original}
            promotion={promotionDataById.get(row.original.promotionId ?? "")}
          />
        ),
      },
    ],
    [promotionDataById]
  );

  if (error && !data) {
    return (
      <CenteredErrorState
        error={error}
        fallbackMessage="No se pudieron cargar las recompensas."
        onRetry={() => {
          void refetch();
        }}
        backHref="/promotions"
        backLabel="Volver a promociones"
      />
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Promociones"
        title="Recompensas"
        description="Vista operativa de rewards persistidas para revisar su ciclo, calificación, uso y balance antes de entrar en detalle."
        actions={
          <Link href="/promotions">
            <Button variant="outline">
              <FolderKanban className="mr-2 h-4 w-4" />
              Ir a promociones
            </Button>
          </Link>
        }
        meta={
          <>
            <span>{meta?.rowCount ?? 0} rewards</span>
            <span>{isFetching ? "Actualizando datos..." : "Datos sincronizados"}</span>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={rewards}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowCount={meta?.rowCount}
        pageCount={meta?.pageCount}
        isLoading={isLoading}
        getRowId={(reward) => reward.id}
        getRowCanExpand={(row) => hasRewardRelatedActivity(row.original)}
        renderExpandedRow={(row) => (
          <RewardExpandedPanel
            reward={row.original}
            bookmakerAccountLabelById={bookmakerAccountLabelById}
          />
        )}
        toolbar={
          <FilterBar>
            <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="space-y-1 xl:col-span-2">
                <label
                  htmlFor="rewardSearch"
                  className="text-muted-foreground block text-xs font-medium uppercase tracking-[0.06em]"
                >
                  Buscar
                </label>
                <Input
                  id="rewardSearch"
                  name="rewardSearch"
                  placeholder="Promoción, tipo o restricciones"
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
                  name="rewardStatus"
                  value={filters.status}
                  onValueChange={(value) => {
                    if (!isRewardStatusFilter(value)) {
                      return;
                    }
                    setFilters((current) => ({ ...current, status: value }));
                    setPagination((current) => ({ ...current, pageIndex: 0 }));
                  }}
                >
                  <SelectTrigger className="w-full" aria-label="Filtrar rewards por estado">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los estados</SelectItem>
                    {rewardStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <div className="text-muted-foreground text-xs font-medium uppercase tracking-[0.06em]">
                  Tipo
                </div>
                <Select
                  name="rewardType"
                  value={filters.type}
                  onValueChange={(value) => {
                    if (!isRewardTypeFilter(value)) {
                      return;
                    }
                    setFilters((current) => ({ ...current, type: value }));
                    setPagination((current) => ({ ...current, pageIndex: 0 }));
                  }}
                >
                  <SelectTrigger className="w-full" aria-label="Filtrar rewards por tipo">
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los tipos</SelectItem>
                    {rewardTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <div className="text-muted-foreground text-xs font-medium uppercase tracking-[0.06em]">
                  Promoción
                </div>
                <Select
                  name="rewardPromotion"
                  value={filters.promotionId}
                  onValueChange={(value) => {
                    setFilters((current) => ({
                      ...current,
                      promotionId: value,
                    }));
                    setPagination((current) => ({ ...current, pageIndex: 0 }));
                  }}
                >
                  <SelectTrigger className="w-full" aria-label="Filtrar rewards por promoción">
                    <SelectValue placeholder="Todas las promociones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas las promociones</SelectItem>
                    {promotions.map((promotion) => (
                      <SelectItem key={promotion.id} value={promotion.id}>
                        {promotion.name}
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
                  setSorting([{ id: "nextQualifyDeadline", desc: false }]);
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
            title="No hay recompensas"
            description="Las rewards persistidas aparecerán aquí para revisión operativa y acceso rápido a su detalle."
            icon={Gift}
            action={
              <Link href="/promotions">
                <Button>
                  <FolderKanban className="mr-2 h-4 w-4" />
                  Gestionar promociones
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

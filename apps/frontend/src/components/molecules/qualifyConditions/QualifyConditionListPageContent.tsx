"use client";

import type {
  QualifyConditionEntity,
  QualifyConditionListInput,
  QualifyConditionStatus,
  QualifyConditionType,
} from "@matbett/shared";
import {
  getQualifyConditionLifecyclePolicy,
  getLabel,
  qualifyConditionStatusOptions,
  qualifyConditionTypeOptions,
} from "@matbett/shared";
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table";
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  Eye,
  FolderKanban,
  Rows3,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { CenteredErrorState } from "@/components/feedback";
import { BetTrackingTable } from "@/components/molecules/bets/BetTrackingTable";
import { DepositModal } from "@/components/molecules/DepositModal";
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
import { useBetsByQualifyCondition } from "@/hooks/api/useBets";
import { useBookmakerAccounts } from "@/hooks/api/useBookmakerAccounts";
import { useDepositsByQualifyCondition } from "@/hooks/api/useDeposits";
import { usePromotions } from "@/hooks/api/usePromotions";
import { useQualifyConditions } from "@/hooks/api/useQualifyConditions";
import type { RewardDepositQualifyConditionFormData } from "@/types/ui";
import { formatBookmakerAccountLabel } from "@/utils/bookmakerAccounts";
import { formatDate } from "@/utils/formatters";
import {
  getQualifyConditionParentSummary,
  getQualifyConditionSummary,
  getQualifyTrackingSummary,
} from "@/utils/qualifyConditions";
import { getCompactStatusLabel } from "@/utils/statusLabels";

type QualifyConditionFilters = {
  status: QualifyConditionStatus | "ALL";
  type: QualifyConditionType | "ALL";
  promotionId: string | "ALL";
  globalFilter: string;
};

const defaultFilters: QualifyConditionFilters = {
  status: "ALL",
  type: "ALL",
  promotionId: "ALL",
  globalFilter: "",
};

function isQualifyConditionStatusFilter(
  value: string
): value is QualifyConditionFilters["status"] {
  return (
    value === "ALL" ||
    qualifyConditionStatusOptions.some((option) => option.value === value)
  );
}

function isQualifyConditionTypeFilter(
  value: string
): value is QualifyConditionFilters["type"] {
  return (
    value === "ALL" ||
    qualifyConditionTypeOptions.some((option) => option.value === value)
  );
}

function getTrackingActionTooltip(reasons: string[]) {
  if (reasons.length === 0) {
    return undefined;
  }

  if (reasons.length === 1) {
    return reasons[0];
  }

  return `${reasons[0]} (+${reasons.length - 1} bloqueos más)`;
}

function QualifyConditionTrackingPanel({
  condition,
  bookmakerAccountLabelById,
}: {
  condition: QualifyConditionEntity;
  bookmakerAccountLabelById: Map<string, string>;
}) {
  const betsQuery = useBetsByQualifyCondition(condition.id, {
    pageIndex: 0,
    pageSize: 50,
  });
  const depositsQuery = useDepositsByQualifyCondition(condition.id, {
    pageIndex: 0,
    pageSize: 50,
  });

  const bets = betsQuery.data?.data ?? [];
  const deposits = depositsQuery.data?.data ?? [];
  const isLoading = betsQuery.isLoading || depositsQuery.isLoading;

  if (condition.type === "DEPOSIT") {
    if (isLoading) {
      return <div className="text-muted-foreground px-1 py-1 text-[13px]">Cargando depósitos...</div>;
    }

    if (deposits.length === 0) {
      return (
        <div className="text-muted-foreground px-1 py-1 text-[13px]">
          No hay depósitos registrados para esta qualify condition.
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        <div className="text-muted-foreground px-0.5 text-[11px] font-medium tracking-[0.03em]">
          Depósitos relacionados
        </div>
        <div className="overflow-hidden rounded-md border border-border/70 bg-background/80">
          <div className="overflow-x-auto">
            <DepositTrackingTable deposits={deposits} />
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-muted-foreground px-1 py-1 text-[13px]">Cargando apuestas...</div>;
  }

  if (bets.length === 0) {
    return (
      <div className="text-muted-foreground px-1 py-1 text-[13px]">
        No hay apuestas registradas para esta qualify condition.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="text-muted-foreground px-0.5 text-[11px] font-medium tracking-[0.03em]">
        Apuestas relacionadas
      </div>
      <div className="overflow-hidden rounded-md border border-border/70 bg-background/80">
        <div className="overflow-x-auto">
          <BetTrackingTable bets={bets} bookmakerAccountLabelById={bookmakerAccountLabelById} />
        </div>
      </div>
    </div>
  );
}

function QualifyConditionActions({
  condition,
  promotionData,
}: {
  condition: QualifyConditionEntity;
  promotionData:
    | {
        id: string;
        bookmakerAccountId?: string;
      }
    | undefined;
}) {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const primaryReward = condition.linkedRewards[0];
  const lifecycle = getQualifyConditionLifecyclePolicy({
    isPersisted: true,
    conditionType: condition.type,
    conditionStatus: condition.status,
    parents: condition.linkedRewards.map((reward) => ({
      rewardStatus: reward.status,
      phaseStatus: reward.phaseStatus,
      promotionStatus: reward.promotionStatus,
    })),
  });

  const trackingReasons = lifecycle.trackingAction.reasons.map((reason) => reason.message);
  const trackingTooltip = getTrackingActionTooltip(trackingReasons);

  const canRegisterBet = lifecycle.betEntry.enabled;
  const canRegisterDeposit = lifecycle.depositEntry.enabled;
  const canOpenDepositModal =
    condition.type === "DEPOSIT" &&
    canRegisterDeposit &&
    Boolean(primaryReward?.id) &&
    Boolean(promotionData?.id);
  const depositConditionForModal: RewardDepositQualifyConditionFormData | undefined =
    condition.type === "DEPOSIT"
      ? {
          id: condition.id,
          description: condition.description,
          status: condition.status,
          statusDate: condition.statusDate,
          timeframe: condition.timeframe,
          type: condition.type,
          conditions: condition.conditions,
        }
      : undefined;
  const depositContext =
    canOpenDepositModal && primaryReward && promotionData
      ? {
          promotionId: promotionData.id,
          phaseId: primaryReward.phaseId,
          rewardId: primaryReward.id,
          qualifyConditionId: condition.id,
          bookmakerAccountId: promotionData.bookmakerAccountId,
        }
      : undefined;

  return (
    <>
      <div className="flex justify-end gap-0.5">
        {primaryReward ? (
          <Link href={`/rewards/${primaryReward.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              title="Abrir reward"
              aria-label="Abrir reward"
            >
              <Rows3 className="h-4 w-4" />
            </Button>
          </Link>
        ) : null}
        <Link href={`/qualify-conditions/${condition.id}`}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title="Abrir detalle"
            aria-label="Abrir detalle"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
        {condition.type === "DEPOSIT" ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title={trackingTooltip || "Registrar depósito"}
            aria-label="Registrar depósito"
            disabled={!canOpenDepositModal}
            onClick={() => {
              setIsDepositModalOpen(true);
            }}
          >
            <Wallet className="h-4 w-4" />
          </Button>
        ) : canRegisterBet ? (
          <Link
            href={`/bets/new/from-qualify-condition/${condition.id}`}
            aria-label="Registrar apuesta"
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              title="Registrar apuesta"
              aria-label="Registrar apuesta"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title={trackingTooltip || "Registrar apuesta"}
            aria-label="Registrar apuesta"
            disabled
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {canOpenDepositModal && primaryReward ? (
        <DepositModal
          isOpen={isDepositModalOpen}
          onClose={() => {
            setIsDepositModalOpen(false);
          }}
          title="Registrar depósito para qualify condition"
          context={depositContext}
          qualifyCondition={depositConditionForModal}
        />
      ) : null}
    </>
  );
}

export default function QualifyConditionListPageContent() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "timeframeEnd", desc: false },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [filters, setFilters] = useState<QualifyConditionFilters>(defaultFilters);

  const promotionsQuery = usePromotions({
    pageIndex: 0,
    pageSize: 100,
  });
  const bookmakerAccountsQuery = useBookmakerAccounts({
    pageIndex: 0,
    pageSize: 100,
  });

  const queryInput: QualifyConditionListInput = {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting,
    status: filters.status === "ALL" ? undefined : filters.status,
    type: filters.type === "ALL" ? undefined : filters.type,
    promotionId: filters.promotionId === "ALL" ? undefined : filters.promotionId,
    globalFilter: filters.globalFilter.trim() || undefined,
  };

  const { data, isLoading, error, isFetching, refetch } =
    useQualifyConditions(queryInput);

  const promotions = useMemo(() => promotionsQuery.data?.data ?? [], [promotionsQuery.data]);
  const bookmakerAccounts = useMemo(
    () => bookmakerAccountsQuery.data?.data ?? [],
    [bookmakerAccountsQuery.data]
  );
  const conditions = data?.data ?? [];
  const meta = data?.meta;

  const promotionDataById = useMemo(
    () =>
      new Map(
        promotions.map((promotion) => [
          promotion.id,
          {
            id: promotion.id,
            bookmakerAccountId: promotion.bookmakerAccountId,
          },
        ])
      ),
    [promotions]
  );
  const bookmakerAccountLabelById = useMemo(
    () =>
      new Map(
        bookmakerAccounts.map((account) => [
          account.id,
          formatBookmakerAccountLabel(account),
        ])
      ),
    [bookmakerAccounts]
  );

  const columns = useMemo<Array<ColumnDef<QualifyConditionEntity>>>(
    () => [
      {
        id: "expand",
        header: "",
        cell: ({ row }) =>
          row.original.trackingStats.totalParticipations > 0 ? (
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
        id: "parent",
        header: "Promoción / reward",
        cell: ({ row }) => {
          const summary = getQualifyConditionParentSummary(row.original);

          return (
          <div className="min-w-[210px] max-w-[280px] truncate font-medium" title={summary.primary}>
            {summary.primary}
          </div>
        );
      },
      },
      {
        accessorKey: "type",
        header: "Tipo",
        enableSorting: true,
        cell: ({ row }) => (
          <div
            className="min-w-[110px] max-w-[140px] truncate font-medium"
            title={getLabel(qualifyConditionTypeOptions, row.original.type)}
          >
            {getLabel(qualifyConditionTypeOptions, row.original.type)}
          </div>
        ),
      },
      {
        id: "details",
        header: "Detalles de la condición",
        cell: ({ row }) => {
          const summary = getQualifyConditionSummary(row.original);

          return (
            <div className="min-w-[230px] max-w-[300px] truncate font-medium" title={summary.primary}>
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
          const summary = getQualifyTrackingSummary(row.original);

          return (
            <div className="min-w-[150px] max-w-[210px]">
              <div className="truncate font-medium" title={summary.label}>
                {summary.label}
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <QualifyConditionActions
            condition={row.original}
            promotionData={promotionDataById.get(row.original.promotionId)}
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
        fallbackMessage="No se pudieron cargar las condiciones de calificación."
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
        title="Condiciones de calificación"
        description="Vista operativa para decidir rápido si una condición requiere tracking, revisión o navegación a su reward."
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
            <span>{meta?.rowCount ?? 0} condiciones</span>
            <span>{isFetching ? "Actualizando datos..." : "Datos sincronizados"}</span>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={conditions}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowCount={meta?.rowCount}
        pageCount={meta?.pageCount}
        isLoading={isLoading}
        getRowId={(condition) => condition.id}
        getRowCanExpand={(row) => row.original.trackingStats.totalParticipations > 0}
        renderExpandedRow={(row) => (
          <QualifyConditionTrackingPanel
            condition={row.original}
            bookmakerAccountLabelById={bookmakerAccountLabelById}
          />
        )}
        toolbar={
          <FilterBar>
            <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="space-y-1 xl:col-span-2">
                <label
                  htmlFor="qualifyConditionSearch"
                  className="text-muted-foreground block text-xs font-medium uppercase tracking-[0.06em]"
                >
                  Buscar
                </label>
                <Input
                  id="qualifyConditionSearch"
                  name="qualifyConditionSearch"
                  placeholder="Promoción, reward o descripción"
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
                  name="qualifyConditionStatus"
                  value={filters.status}
                  onValueChange={(value) => {
                    if (!isQualifyConditionStatusFilter(value)) {
                      return;
                    }

                    setFilters((current) => ({ ...current, status: value }));
                    setPagination((current) => ({ ...current, pageIndex: 0 }));
                  }}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label="Filtrar condiciones por estado"
                  >
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los estados</SelectItem>
                    {qualifyConditionStatusOptions.map((option) => (
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
                  name="qualifyConditionType"
                  value={filters.type}
                  onValueChange={(value) => {
                    if (!isQualifyConditionTypeFilter(value)) {
                      return;
                    }

                    setFilters((current) => ({ ...current, type: value }));
                    setPagination((current) => ({ ...current, pageIndex: 0 }));
                  }}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label="Filtrar condiciones por tipo"
                  >
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los tipos</SelectItem>
                    {qualifyConditionTypeOptions.map((option) => (
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
                  name="qualifyConditionPromotion"
                  value={filters.promotionId}
                  onValueChange={(value) => {
                    setFilters((current) => ({
                      ...current,
                      promotionId: value,
                    }));
                    setPagination((current) => ({ ...current, pageIndex: 0 }));
                  }}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label="Filtrar condiciones por promoción"
                  >
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
            title="No hay condiciones de calificación"
            description="Las condiciones persistidas aparecerán aquí para revisión operativa y acceso rápido a su detalle."
            icon={FolderKanban}
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

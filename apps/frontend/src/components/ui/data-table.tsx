"use client";

import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  type ColumnDef,
  type ExpandedState,
  type OnChangeFn,
  functionalUpdate,
  type PaginationState,
  type Row,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Fragment, type ReactNode, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { cn } from "@/lib/utils";

type DataTableProps<TData> = {
  columns: Array<ColumnDef<TData>>;
  data: TData[];
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  rowCount?: number;
  pageCount?: number;
  pageSizeOptions?: number[];
  isLoading?: boolean;
  emptyState?: ReactNode;
  toolbar?: ReactNode;
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string;
  getRowCanExpand?: (row: Row<TData>) => boolean;
  renderExpandedRow?: (row: Row<TData>) => ReactNode;
  className?: string;
  tableClassName?: string;
};

export function DataTable<TData>({
  columns,
  data,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  rowCount,
  pageCount,
  pageSizeOptions = [10, 20, 50],
  isLoading,
  emptyState,
  toolbar,
  getRowId,
  getRowCanExpand,
  renderExpandedRow,
  className,
  tableClassName,
}: DataTableProps<TData>) {
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const resolvedPagination = pagination ?? { pageIndex: 0, pageSize: 20 };
  const resolvedSorting = sorting ?? [];

  const totalPages = Math.max(
    1,
    pageCount ?? Math.ceil((rowCount ?? data.length) / resolvedPagination.pageSize)
  );

  const handleExpandedChange: OnChangeFn<ExpandedState> = (updater) => {
    setExpanded((current) => {
      const nextExpanded = functionalUpdate(updater, current);

      if (nextExpanded === true) {
        return nextExpanded;
      }

      const expandedEntries = Object.entries(nextExpanded).filter(([, isExpanded]) => isExpanded);

      if (expandedEntries.length <= 1) {
        return nextExpanded;
      }

      const newlyExpandedRowId = expandedEntries.find(([rowId, isExpanded]) => {
        if (!isExpanded) {
          return false;
        }

        return current === true ? false : !current[rowId];
      })?.[0];

      if (newlyExpandedRowId) {
        return { [newlyExpandedRowId]: true };
      }

      const [fallbackRowId] = expandedEntries[0];
      return fallbackRowId ? { [fallbackRowId]: true } : {};
    });
  };

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId,
    getRowCanExpand,
    enableSortingRemoval: false,
    manualSorting: Boolean(onSortingChange),
    manualPagination: Boolean(onPaginationChange),
    onSortingChange,
    onPaginationChange,
    onExpandedChange: handleExpandedChange,
    pageCount: totalPages,
    state: {
      sorting: resolvedSorting,
      pagination: resolvedPagination,
      expanded,
    },
  });

  const visibleHeaders = useMemo(
    () =>
      table
        .getFlatHeaders()
        .filter((header) => header.column.getIsVisible()).length || 1,
    [table]
  );

  if (isLoading && data.length === 0) {
    return <LoadingState label="Cargando registros..." />;
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {toolbar}

      <div className="bg-card overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className={cn("min-w-full border-collapse text-[13px]", tableClassName)}>
            <thead className="bg-muted/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-border/70 border-b">
                  {headerGroup.headers.map((header, headerIndex) => {
                    if (header.isPlaceholder) {
                      return null;
                    }

                    const canSort = header.column.getCanSort();
                    const sortingState = header.column.getIsSorted();

                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        className={cn(
                          "text-muted-foreground px-2.5 py-1.5 text-left text-[11px] font-semibold tracking-[0.04em] whitespace-nowrap",
                          headerIndex > 0 && "border-l border-border/40"
                        )}
                      >
                        {canSort ? (
                          <button
                            type="button"
                            className="flex items-center gap-1 whitespace-nowrap transition-colors hover:text-foreground"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {sortingState === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : sortingState === "desc" ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : null}
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                    <td colSpan={visibleHeaders} className="px-3 py-6">
                    {emptyState ?? (
                      <EmptyState
                        title="No hay registros"
                        description="Ajusta los filtros o crea un nuevo registro."
                        className="min-h-[180px] border-none px-0 py-0"
                      />
                    )}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    <tr
                      className={cn(
                        "border-border/60 border-b last:border-b-0",
                        row.getIsExpanded()
                          ? "border-sky-200/80 bg-sky-50/70 dark:border-sky-800/70 dark:bg-sky-950/20"
                          : "hover:bg-muted/20"
                      )}
                    >
                      {row.getVisibleCells().map((cell, cellIndex) => (
                        <td
                          key={cell.id}
                          className={cn(
                            "px-2.5 py-1.5 align-top",
                            cellIndex > 0 && "border-l border-border/40"
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                    {row.getIsExpanded() && renderExpandedRow ? (
                      <tr className="bg-sky-50/55 dark:bg-sky-950/15">
                        <td
                          colSpan={visibleHeaders}
                          className="border-sky-200/70 border-b px-2.5 py-1.5 dark:border-sky-800/60"
                        >
                          <div className="ml-5">
                            {renderExpandedRow(row)}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-card flex flex-col gap-2.5 border-t px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-muted-foreground text-xs">
            Mostrando {data.length} de {rowCount ?? data.length} registros
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {onPaginationChange ? (
              <div className="flex items-center gap-2">
                <label className="text-muted-foreground text-[11px] font-medium">
                  Filas
                </label>
                <select
                  id="data-table-page-size"
                  name="pageSize"
                  aria-label="Filas por página"
                  className="border-input bg-background h-8 rounded-md border px-2 text-[13px]"
                  value={resolvedPagination.pageSize}
                  onChange={(event) => {
                    onPaginationChange({
                      pageIndex: 0,
                      pageSize: Number(event.target.value),
                    });
                  }}
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onPaginationChange?.({
                    ...resolvedPagination,
                    pageIndex: 0,
                  })
                }
                disabled={!onPaginationChange || resolvedPagination.pageIndex === 0}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onPaginationChange?.({
                    ...resolvedPagination,
                    pageIndex: Math.max(0, resolvedPagination.pageIndex - 1),
                  })
                }
                disabled={!onPaginationChange || resolvedPagination.pageIndex === 0}
              >
                Anterior
              </Button>
              <div className="text-muted-foreground min-w-[120px] text-center text-[11px] font-medium">
                Página {resolvedPagination.pageIndex + 1} de {totalPages}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onPaginationChange?.({
                    ...resolvedPagination,
                    pageIndex: Math.min(
                      totalPages - 1,
                      resolvedPagination.pageIndex + 1
                    ),
                  })
                }
                disabled={
                  !onPaginationChange ||
                  resolvedPagination.pageIndex >= totalPages - 1
                }
              >
                Siguiente
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onPaginationChange?.({
                    ...resolvedPagination,
                    pageIndex: Math.max(0, totalPages - 1),
                  })
                }
                disabled={
                  !onPaginationChange ||
                  resolvedPagination.pageIndex >= totalPages - 1
                }
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

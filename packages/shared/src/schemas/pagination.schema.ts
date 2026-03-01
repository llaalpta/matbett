/**
 * Pagination Schemas - Compatible with TanStack Table
 * https://tanstack.com/table/latest/docs/api/features/pagination
 */

import { z } from 'zod';

// =============================================
// PRIMITIVES & UTILS
// =============================================

/**
 * Tipos de valores permitidos en filtros
 * Reemplaza el uso inseguro de 'unknown'
 */
export const FilterValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
  z.array(z.number()),
  z.array(z.boolean()),
]);

// =============================================
// SORTING (TanStack Table compatible)
// =============================================

/**
 * Schema para un sort individual
 * Compatible con TanStack Table ColumnSort
 */
export const ColumnSortSchema = z.object({
  id: z.string(),        // ID de la columna
  desc: z.boolean(),     // true = descendente, false = ascendente
});

/**
 * Schema para array de sorts (múltiples columnas)
 */
export const SortingStateSchema = z.array(ColumnSortSchema);

// =============================================
// FILTERING (TanStack Table compatible)
// =============================================

/**
 * Schema para un filtro de columna
 * Compatible con TanStack Table ColumnFilter
 */
export const ColumnFilterSchema = z.object({
  id: z.string(),
  value: FilterValueSchema,
});

/**
 * Schema para array de filtros de columna
 */
export const ColumnFiltersStateSchema = z.array(ColumnFilterSchema);

// =============================================
// PAGINATION INPUT (TanStack Table compatible)
// =============================================

/**
 * Schema de input para listados paginados
 * Compatible con TanStack Table Pagination State
 */
export const PaginationInputSchema = z.object({
  // Paginación (TanStack Table usa pageIndex 0-based)
  pageIndex: z.number().min(0).default(0),
  pageSize: z.number().min(1).max(100).default(20),

  // Sorting (TanStack Table ColumnSort[])
  sorting: SortingStateSchema.optional(),

  // Filtering (TanStack Table ColumnFilter[])
  columnFilters: ColumnFiltersStateSchema.optional(),

  // Global filter (búsqueda global)
  globalFilter: z.string().optional(),
});

// =============================================
// PAGINATION OUTPUT (TanStack Table compatible)
// =============================================

/**
 * Schema de metadata para respuestas paginadas
 * Compatible con TanStack Table
 */
export const PaginationMetaSchema = z.object({
  pageCount: z.number(),   // Total de páginas (usado por TanStack Table)
  rowCount: z.number(),    // Total de filas (usado por TanStack Table)
  pageIndex: z.number(),   // Página actual (0-based)
  pageSize: z.number(),    // Tamaño de página usado
});

/**
 * Factory function para crear schemas de respuesta paginada
 * Envuelve cualquier schema de datos con metadata de paginación
 *
 * @example
 * const PaginatedPromotionsSchema = createPaginatedResponseSchema(PromotionEntitySchema);
 */
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: z.array(dataSchema),
    meta: PaginationMetaSchema,
  });
}

// =============================================
// INFERRED TYPES
// =============================================

export type FilterValue = z.infer<typeof FilterValueSchema>;
export type ColumnSort = z.infer<typeof ColumnSortSchema>;
export type SortingState = z.infer<typeof SortingStateSchema>;
export type ColumnFilter = z.infer<typeof ColumnFilterSchema>;
export type ColumnFiltersState = z.infer<typeof ColumnFiltersStateSchema>;
export type PaginationInput = z.infer<typeof PaginationInputSchema>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

/**
 * Helper type para respuestas paginadas
 */
export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

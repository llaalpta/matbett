/**
 * Promotion Schema
 */

import { z } from 'zod';

import {
  BookmakerAccountTypeSchema,
  PromotionStatusSchema,
  PromotionCardinalitySchema,
  ActivationMethodSchema,
  BetStatusSchema,
  BetParticipationKindSchema,
  LegRoleSchema,
  RewardTypeSchema,
} from './enums';
import { AbsoluteTimeframeSchema } from './timeframe.schema';
import { PhaseSchema, PhaseEntitySchema } from './phase.schema';
import { QualifyConditionSchema, QualifyConditionEntitySchema } from './qualify-condition.schema';
import { FilterValueSchema } from './pagination.schema'; // Importar filtro seguro

// =============================================
// REUSABLE TIMESTAMP SCHEMAS
// =============================================

/**
 * Timestamps de auditoría (comunes a TODAS las entidades)
 */
const AuditTimestampsSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Timestamps de estado para Promotion
 * Estos representan eventos que pueden usarse como anchors en timeframes relativos
 */
const PromotionStateTimestampsSchema = z.object({
  activatedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  expiredAt: z.date().nullable(),
});

// =============================================
// PROMOTION SCHEMA (INPUT) - Para formularios y CREATE/UPDATE
// =============================================

/**
 * Schema de INPUT - Sin tracking en nested entities
 */
export const PromotionSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().uuid().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().nullish(),
  bookmakerAccountId: z.string().min(1, 'Selecciona una cuenta para la promoción'),
  status: PromotionStatusSchema.optional(),
  
  // Fecha genérica asociada al estado actual
  statusDate: z.date(),

  phases: z.array(PhaseSchema).min(1),
  availableQualifyConditions: z.array(QualifyConditionSchema),
  timeframe: AbsoluteTimeframeSchema,
  cardinality: PromotionCardinalitySchema,
  activationMethod: ActivationMethodSchema.optional(),
});

// =============================================
// PROMOTION ENTITY SCHEMA (OUTPUT) - Con tracking en nested entities
// =============================================

/**
 * Schema de OUTPUT - Con PhaseEntitySchema que incluye tracking en rewards/qualifyConditions
 * Usado para outputs del backend (lo que devuelven los endpoints)
 */
export const PromotionEntitySchema = PromotionSchema
  .extend({
    bookmakerAccountId: z.string().optional(),
    bookmaker: z.string().min(1),
    bookmakerAccountIdentifier: z.string().min(1).optional(),
    bookmakerAccountType: BookmakerAccountTypeSchema.optional(),
    id: z.string(),
    status: PromotionStatusSchema,
    userId: z.string(),
    totalBalance: z.number(),
    totalLegs: z.number().int().min(0).optional(),
    totalDeposits: z.number().int().min(0).optional(),
    totalStake: z.number().min(0).optional(),
    aggregateYield: z.number().optional(),
    timeframeStart: z.date().nullable().optional(),
    timeframeEnd: z.date().nullable().optional(),
    // Sobrescribir con PhaseEntitySchema (que incluye tracking en nested entities)
    phases: z.array(PhaseEntitySchema).min(1),
    availableQualifyConditions: z.array(QualifyConditionEntitySchema),
    ...PromotionStateTimestampsSchema.shape,
    ...AuditTimestampsSchema.shape,
  });

// =============================================
// INPUT SCHEMAS (para tRPC)
// =============================================

/**
 * Schema de input para listar promociones con paginación
 */
export const PromotionListInputSchema = z.object({
  // Paginación (de PaginationInputSchema)
  pageIndex: z.number().min(0).default(0),
  pageSize: z.number().min(1).max(100).default(20),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).optional(),
  columnFilters: z.array(z.object({ id: z.string(), value: FilterValueSchema })).optional(),
  globalFilter: z.string().optional(),
  // Filtros específicos para promociones
  status: z.string().optional(),
  bookmakerAccountId: z.string().optional(),
});

/**
 * Schema de input para actualizar promoción
 */
export const UpdatePromotionInputSchema = z.object({
  id: z.string(),
  data: PromotionSchema,
});

/**
 * Read model para listados complejos de promoción con apuestas participantes.
 * NO se usa como input de creación/actualización.
 */
export const PromotionBetParticipationSchema = z.object({
  participationId: z.string(),
  batchId: z.string(),
  betId: z.string(),
  kind: BetParticipationKindSchema,
  rewardType: RewardTypeSchema,
  promotionId: z.string(),
  phaseId: z.string().optional(),
  rewardId: z.string().optional(),
  rewardIds: z.array(z.string()).optional(),
  calculationRewardId: z.string().optional(),
  qualifyConditionId: z.string().optional(),
  usageTrackingId: z.string().optional(),
  contributesToTracking: z.boolean(),
  bookmakerAccountId: z.string(),
  status: BetStatusSchema,
  stake: z.number(),
  odds: z.number(),
  profit: z.number(),
  risk: z.number(),
  yield: z.number(),
  placedAt: z.date(),
  legRole: LegRoleSchema.optional(),
  legOrder: z.number().int().min(0),
});

export const PromotionBetsSummarySchema = z.object({
  totalBets: z.number(),
  totalParticipations: z.number(),
  byKind: z.record(BetParticipationKindSchema, z.number()),
});

export const PromotionEntityWithBetsSchema = PromotionEntitySchema.extend({
  betParticipations: z.array(PromotionBetParticipationSchema).optional(),
  betsSummary: PromotionBetsSummarySchema.optional(),
});

export const PromotionBetsQuerySchema = z.object({
  promotionId: z.string(),
  kind: BetParticipationKindSchema.optional(),
  rewardId: z.string().optional(),
  qualifyConditionId: z.string().optional(),
  batchId: z.string().optional(),
  groupBy: z
    .enum(['NONE', 'REWARD', 'QUALIFY_CONDITION', 'BATCH'])
    .default('NONE'),
});

// =============================================
// INFERRED TYPES
// =============================================

export type Promotion = z.infer<typeof PromotionSchema>;
export type PromotionEntity = z.infer<typeof PromotionEntitySchema>;
export type PromotionBetParticipation = z.infer<typeof PromotionBetParticipationSchema>;
export type PromotionBetsSummary = z.infer<typeof PromotionBetsSummarySchema>;
export type PromotionEntityWithBets = z.infer<typeof PromotionEntityWithBetsSchema>;
export type PromotionBetsQuery = z.infer<typeof PromotionBetsQuerySchema>;
export type PromotionListInput = z.infer<typeof PromotionListInputSchema>;
export type UpdatePromotionInput = z.infer<typeof UpdatePromotionInputSchema>;

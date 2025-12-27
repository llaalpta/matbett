/**
 * Timeframe Schemas
 */
import { z } from 'zod';
import {
  EntityTypeSchema,
  RewardAnchorEventSchema,
  PhaseAnchorEventSchema,
  PromotionAnchorEventSchema,
  QualifyConditionAnchorEventSchema,
} from './enums';
import { requiredNumber } from './utils';

// =============================================
// TIMEFRAME ANCHOR (solo referencias)
// =============================================

export const AnchorEventSchema = z.union([
  RewardAnchorEventSchema,
  PhaseAnchorEventSchema,
  PromotionAnchorEventSchema,
  QualifyConditionAnchorEventSchema,
]);

export const TimeframeAnchorSchema = z.object({
  entityId: z.string(),
  entityType: EntityTypeSchema,
  event: AnchorEventSchema,
});

// =============================================
// TIMEFRAME SCHEMAS
// =============================================

export const AbsoluteTimeframeSchema = z.object({
  mode: z.literal('ABSOLUTE'),
  start: z.coerce.date(), // Permite Date o String ISO
  end: z.coerce.date().optional(),
});

export const RelativeTimeframeSchema = z.object({
  mode: z.literal('RELATIVE'),
  anchor: TimeframeAnchorSchema,
  offsetDays: requiredNumber(1),
  // start: calculated from anchor event timestamp (nullable if event hasn't occurred)
  start: z.coerce.date().nullable().optional(),
  // end: calculated from start + offsetDays (nullable if event hasn't occurred)
  end: z.coerce.date().nullable().optional(),
});

export const PromotionTimeframeSchema = z.object({
  mode: z.literal('PROMOTION'),
});

// =============================================
// TIMEFRAME (DISCRIMINATED UNION)
// =============================================

export const TimeframeSchema = z.discriminatedUnion('mode', [
  AbsoluteTimeframeSchema,
  RelativeTimeframeSchema,
  PromotionTimeframeSchema,
]);

// =============================================
// AVAILABLE TIMEFRAMES (OPTIONS DTO) - STRICT DISCRIMINATED UNION
// =============================================

// 1. Specific Timestamp Schemas
const BaseTimestampSchema = z.object({
  eventLabel: z.string(),
  date: z.string(),
});

export const PromotionTimeframeEventTimestampSchema = BaseTimestampSchema.extend({
  event: PromotionAnchorEventSchema,
});

export const PhaseTimeframeEventTimestampSchema = BaseTimestampSchema.extend({
  event: PhaseAnchorEventSchema,
});

export const RewardTimeframeEventTimestampSchema = BaseTimestampSchema.extend({
  event: RewardAnchorEventSchema,
});

export const QualifyConditionTimeframeEventTimestampSchema = BaseTimestampSchema.extend({
  event: QualifyConditionAnchorEventSchema,
});

// Union for generic usage
export const TimeframeEventTimestampSchema = z.union([
  PromotionTimeframeEventTimestampSchema,
  PhaseTimeframeEventTimestampSchema,
  RewardTimeframeEventTimestampSchema,
  QualifyConditionTimeframeEventTimestampSchema,
]);

// 2. Specific Entity Schemas
const BaseEntitySchema = z.object({
  entityId: z.string(),
  entityLabel: z.string(),
});

export const AvailablePromotionTimeframeEntitySchema = BaseEntitySchema.extend({
  timeStamps: z.array(PromotionTimeframeEventTimestampSchema),
});

export const AvailablePhaseTimeframeEntitySchema = BaseEntitySchema.extend({
  timeStamps: z.array(PhaseTimeframeEventTimestampSchema),
});

export const AvailableRewardTimeframeEntitySchema = BaseEntitySchema.extend({
  timeStamps: z.array(RewardTimeframeEventTimestampSchema),
});

export const AvailableQualifyConditionTimeframeEntitySchema = BaseEntitySchema.extend({
  timeStamps: z.array(QualifyConditionTimeframeEventTimestampSchema),
});

// Union for generic usage
export const AvailableTimeframeEntitySchema = z.union([
  AvailablePromotionTimeframeEntitySchema,
  AvailablePhaseTimeframeEntitySchema,
  AvailableRewardTimeframeEntitySchema,
  AvailableQualifyConditionTimeframeEntitySchema,
]);

// 3. Specific ByType Schemas (The Discriminated Parts)
export const AvailablePromotionTimeframesSchema = z.object({
  entityType: z.literal('PROMOTION'),
  entityTypeLabel: z.string(),
  entities: z.array(AvailablePromotionTimeframeEntitySchema),
});

export const AvailablePhaseTimeframesSchema = z.object({
  entityType: z.literal('PHASE'),
  entityTypeLabel: z.string(),
  entities: z.array(AvailablePhaseTimeframeEntitySchema),
});

export const AvailableRewardTimeframesSchema = z.object({
  entityType: z.literal('REWARD'),
  entityTypeLabel: z.string(),
  entities: z.array(AvailableRewardTimeframeEntitySchema),
});

export const AvailableQualifyConditionTimeframesSchema = z.object({
  entityType: z.literal('QUALIFY_CONDITION'),
  entityTypeLabel: z.string(),
  entities: z.array(AvailableQualifyConditionTimeframeEntitySchema),
});

// 4. The Discriminated Union
export const AvailableTimeframesByTypeSchema = z.discriminatedUnion('entityType', [
  AvailablePromotionTimeframesSchema,
  AvailablePhaseTimeframesSchema,
  AvailableRewardTimeframesSchema,
  AvailableQualifyConditionTimeframesSchema,
]);

export const AvailableTimeframesSchema = z.array(AvailableTimeframesByTypeSchema);

// =============================================
// INFERRED TYPES
// =============================================

export type AnchorEvent = z.infer<typeof AnchorEventSchema>;
export type TimeframeAnchor = z.infer<typeof TimeframeAnchorSchema>;
export type AbsoluteTimeframe = z.infer<typeof AbsoluteTimeframeSchema>;
export type RelativeTimeframe = z.infer<typeof RelativeTimeframeSchema>;
export type PromotionTimeframe = z.infer<typeof PromotionTimeframeSchema>;
export type Timeframe = z.infer<typeof TimeframeSchema>;

// DTO Types - Unions for generic usage
export type TimeframeEventTimestamp = z.infer<typeof TimeframeEventTimestampSchema>;
export type AvailableTimeframeEntity = z.infer<typeof AvailableTimeframeEntitySchema>;
// The discriminated union type
export type AvailableTimeframesByType = z.infer<typeof AvailableTimeframesByTypeSchema>;
export type AvailableTimeframes = z.infer<typeof AvailableTimeframesSchema>;

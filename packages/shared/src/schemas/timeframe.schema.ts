/**
 * Timeframe Schemas
 */
import { z } from 'zod';
import {
  EntityTypeSchema,
  RewardAnchorEventSchema,
  PhaseAnchorEventSchema,
  PromotionAnchorEventSchema,
} from './enums';
import { requiredNumber } from './utils';

// =============================================
// TIMEFRAME ANCHOR (solo referencias)
// =============================================

export const AnchorEventSchema = z.union([
  RewardAnchorEventSchema,
  PhaseAnchorEventSchema,
  PromotionAnchorEventSchema,
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
  // "end" in a relative timeframe is often calculated dynamically, but can be a hard date
  end: z.coerce.date().optional(),
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
// AVAILABLE TIMEFRAMES (OPTIONS DTO)
// =============================================

export const TimeframeEventTimestampSchema = z.object({
  event: AnchorEventSchema,
  eventLabel: z.string(),
  date: z.string(), // ISO Date String para transporte, o Date si usamos superjson
});

export const AvailableTimeframeEntitySchema = z.object({
  entityId: z.string(),
  entityLabel: z.string(),
  timeStamps: z.array(TimeframeEventTimestampSchema),
});

export const AvailableTimeframesByTypeSchema = z.object({
  entityType: EntityTypeSchema,
  entityTypeLabel: z.string(),
  entities: z.array(AvailableTimeframeEntitySchema),
});

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

// DTO Types
export type TimeframeEventTimestamp = z.infer<typeof TimeframeEventTimestampSchema>;
export type AvailableTimeframeEntity = z.infer<typeof AvailableTimeframeEntitySchema>;
export type AvailableTimeframesByType = z.infer<typeof AvailableTimeframesByTypeSchema>;
export type AvailableTimeframes = z.infer<typeof AvailableTimeframesSchema>;

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

export const AnchorEventSchema = z.union([
  RewardAnchorEventSchema,
  PhaseAnchorEventSchema,
  PromotionAnchorEventSchema,
  QualifyConditionAnchorEventSchema,
]);

export const AnchorRefTypeSchema = z.enum(['client', 'persisted']);

export const TimeframeAnchorRefSchema = z.object({
  entityType: EntityTypeSchema,
  entityRefType: AnchorRefTypeSchema,
  entityRef: z.string(),
  event: AnchorEventSchema,
});

export const AbsoluteTimeframeSchema = z.object({
  mode: z.literal('ABSOLUTE'),
  start: z.coerce.date(),
  end: z.coerce.date().optional(),
});

export const RelativeTimeframeSchema = z.object({
  mode: z.literal('RELATIVE'),
  anchor: TimeframeAnchorRefSchema,
  offsetDays: requiredNumber(1),
});

export const PromotionTimeframeSchema = z.object({
  mode: z.literal('PROMOTION'),
});

export const TimeframeSchema = z.discriminatedUnion('mode', [
  AbsoluteTimeframeSchema,
  RelativeTimeframeSchema,
  PromotionTimeframeSchema,
]);

const BaseCatalogEventSchema = z.object({
  event: AnchorEventSchema,
  eventLabel: z.string(),
});

export const PromotionCatalogEventSchema = BaseCatalogEventSchema.extend({
  event: PromotionAnchorEventSchema,
});

export const PhaseCatalogEventSchema = BaseCatalogEventSchema.extend({
  event: PhaseAnchorEventSchema,
});

export const RewardCatalogEventSchema = BaseCatalogEventSchema.extend({
  event: RewardAnchorEventSchema,
});

export const QualifyConditionCatalogEventSchema = BaseCatalogEventSchema.extend({
  event: QualifyConditionAnchorEventSchema,
});

export const AnchorCatalogEventSchema = z.union([
  PromotionCatalogEventSchema,
  PhaseCatalogEventSchema,
  RewardCatalogEventSchema,
  QualifyConditionCatalogEventSchema,
]);

const BaseCatalogEntitySchema = z.object({
  entityRefType: AnchorRefTypeSchema,
  entityRef: z.string(),
  entityLabel: z.string(),
});

export const PromotionAnchorCatalogEntitySchema = BaseCatalogEntitySchema.extend({
  events: z.array(PromotionCatalogEventSchema),
});

export const PhaseAnchorCatalogEntitySchema = BaseCatalogEntitySchema.extend({
  events: z.array(PhaseCatalogEventSchema),
});

export const RewardAnchorCatalogEntitySchema = BaseCatalogEntitySchema.extend({
  events: z.array(RewardCatalogEventSchema),
});

export const QualifyConditionAnchorCatalogEntitySchema = BaseCatalogEntitySchema.extend({
  events: z.array(QualifyConditionCatalogEventSchema),
});

export const AnchorCatalogEntitySchema = z.union([
  PromotionAnchorCatalogEntitySchema,
  PhaseAnchorCatalogEntitySchema,
  RewardAnchorCatalogEntitySchema,
  QualifyConditionAnchorCatalogEntitySchema,
]);

export const PromotionAnchorCatalogByTypeSchema = z.object({
  entityType: z.literal('PROMOTION'),
  entityTypeLabel: z.string(),
  entities: z.array(PromotionAnchorCatalogEntitySchema),
});

export const PhaseAnchorCatalogByTypeSchema = z.object({
  entityType: z.literal('PHASE'),
  entityTypeLabel: z.string(),
  entities: z.array(PhaseAnchorCatalogEntitySchema),
});

export const RewardAnchorCatalogByTypeSchema = z.object({
  entityType: z.literal('REWARD'),
  entityTypeLabel: z.string(),
  entities: z.array(RewardAnchorCatalogEntitySchema),
});

export const QualifyConditionAnchorCatalogByTypeSchema = z.object({
  entityType: z.literal('QUALIFY_CONDITION'),
  entityTypeLabel: z.string(),
  entities: z.array(QualifyConditionAnchorCatalogEntitySchema),
});

export const AnchorCatalogByTypeSchema = z.discriminatedUnion('entityType', [
  PromotionAnchorCatalogByTypeSchema,
  PhaseAnchorCatalogByTypeSchema,
  RewardAnchorCatalogByTypeSchema,
  QualifyConditionAnchorCatalogByTypeSchema,
]);

export const AnchorCatalogSchema = z.array(AnchorCatalogByTypeSchema);

export const AnchorOccurrenceSchema = TimeframeAnchorRefSchema.extend({
  occurredAt: z.date().nullable(),
});

export const AnchorOccurrencesSchema = z.array(AnchorOccurrenceSchema);

export type AnchorEvent = z.infer<typeof AnchorEventSchema>;
export type AnchorRefType = z.infer<typeof AnchorRefTypeSchema>;
export type TimeframeAnchorRef = z.infer<typeof TimeframeAnchorRefSchema>;
export type AbsoluteTimeframe = z.infer<typeof AbsoluteTimeframeSchema>;
export type RelativeTimeframe = z.infer<typeof RelativeTimeframeSchema>;
export type PromotionTimeframe = z.infer<typeof PromotionTimeframeSchema>;
export type Timeframe = z.infer<typeof TimeframeSchema>;
export type AnchorCatalogEvent = z.infer<typeof AnchorCatalogEventSchema>;
export type AnchorCatalogEntity = z.infer<typeof AnchorCatalogEntitySchema>;
export type AnchorCatalogByType = z.infer<typeof AnchorCatalogByTypeSchema>;
export type AnchorCatalog = z.infer<typeof AnchorCatalogSchema>;
export type AnchorOccurrence = z.infer<typeof AnchorOccurrenceSchema>;
export type AnchorOccurrences = z.infer<typeof AnchorOccurrencesSchema>;

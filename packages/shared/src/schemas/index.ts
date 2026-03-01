/**
 * Schemas Index
 * Exporta todos los schemas y tipos inferidos
 */

// =============================================
// ENUMS
// =============================================

export * from './bet-conditions.schema';
export * from './bet.schema';
export * from './bookmaker-account.schema';
export * from './deposit.schema';
export * from './enums';
export * from './pagination.schema';
export * from './phase.schema';
export * from './promotion.schema';
export * from './qualify-condition.schema';
export * from './qualify-tracking.schema';
export * from './reward.schema';
export * from './type-specific-fields.schema';
export * from './usage-conditions.schema';
export * from './usage-tracking.schema';
export * from './utils';

// Timeframe exports (explicit to avoid conflicts with enums like AnchorEvent)
export {
  AnchorRefTypeSchema,
  TimeframeAnchorRefSchema,
  AbsoluteTimeframeSchema,
  RelativeTimeframeSchema,
  TimeframeSchema,
  AnchorCatalogSchema,
  AnchorOccurrencesSchema,
  AnchorCatalogEventSchema,
  AnchorCatalogEntitySchema,
  AnchorCatalogByTypeSchema,
  AnchorOccurrenceSchema,
} from './timeframe.schema';

export type {
  AnchorRefType,
  TimeframeAnchorRef,
  AbsoluteTimeframe,
  RelativeTimeframe,
  Timeframe,
  AnchorCatalog,
  AnchorOccurrences,
  AnchorCatalogEvent,
  AnchorCatalogEntity,
  AnchorCatalogByType,
  AnchorOccurrence,
} from './timeframe.schema';

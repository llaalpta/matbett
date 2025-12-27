/**
 * Timeframe Resolver Transformer
 *
 * Provides functions to find and recalculate resolved dates (start/end) for
 * relative timeframes when anchor entity timestamps change.
 */

import type {
  EntityType,
  AnchorEvent,
  Timeframe,
  RelativeTimeframe,
} from '@matbett/shared';
import { TimeframeSchema } from '@matbett/shared';
import type { Prisma } from '@prisma/client';
import type { PromotionWithRelations } from '@/repositories/promotion.repository';

// =================================================================
// TYPES
// =================================================================

interface TimeframeReference {
  /** Path to the entity containing this timeframe */
  path: string;
  /** The timeframe object */
  timeframe: RelativeTimeframe;
  /** ID of the entity that owns this timeframe */
  entityId: string;
  /** Type of entity (phase, qualifyCondition, reward) */
  entityType: 'phase' | 'qualifyCondition' | 'reward';
}

interface TimestampEntry {
  anchorEntityType: EntityType;
  anchorEntityId: string;
  anchorEvent: AnchorEvent;
  timestamp: Date | null;
}

// =================================================================
// HELPER FUNCTIONS
// =================================================================

/**
 * Calculates resolved dates (start/end) for a relative timeframe given the anchor date.
 */
export function calculateResolvedDates(
  anchorDate: Date,
  offsetDays: number
): { start: Date; end: Date } {
  const start = new Date(anchorDate);
  const end = new Date(anchorDate);
  end.setDate(end.getDate() + offsetDays);
  return { start, end };
}

/**
 * Updates resolved dates in a timeframe object (mutates in place).
 * Returns true if the timeframe was modified.
 */
export function updateResolvedDates(
  timeframe: RelativeTimeframe,
  anchorDate: Date | null
): boolean {
  if (timeframe.mode !== 'RELATIVE') return false;

  if (!anchorDate) {
    // Clear resolved dates if anchor hasn't occurred
    const wasModified = timeframe.start !== null || timeframe.end !== null;
    timeframe.start = null;
    timeframe.end = null;
    return wasModified;
  }

  const { start, end } = calculateResolvedDates(anchorDate, timeframe.offsetDays);

  const startChanged = !timeframe.start || timeframe.start.getTime() !== start.getTime();
  const endChanged = !timeframe.end || timeframe.end.getTime() !== end.getTime();

  if (startChanged || endChanged) {
    timeframe.start = start;
    timeframe.end = end;
    return true;
  }

  return false;
}

/**
 * Checks if a timeframe is relative and matches the given anchor.
 */
function matchesAnchor(
  timeframe: Timeframe,
  entityType: string,
  entityId: string,
  event: string
): timeframe is RelativeTimeframe {
  return (
    timeframe.mode === 'RELATIVE' &&
    timeframe.anchor.entityType === entityType &&
    timeframe.anchor.entityId === entityId &&
    timeframe.anchor.event === event
  );
}

/**
 * Safely parses a timeframe from JSON storage.
 */
function parseTimeframe(json: Prisma.JsonValue): Timeframe | null {
  try {
    return TimeframeSchema.parse(json);
  } catch {
    return null;
  }
}

// =================================================================
// MAIN FUNCTIONS
// =================================================================

/**
 * Finds all relative timeframes in a promotion tree that reference a specific anchor.
 */
export function findTimeframesReferencingAnchor(
  promotion: PromotionWithRelations,
  anchorEntityType: string,
  anchorEntityId: string,
  anchorEvent: string
): TimeframeReference[] {
  const results: TimeframeReference[] = [];

  // Check phases
  for (const phase of promotion.phases) {
    const phaseTimeframe = parseTimeframe(phase.timeframe);
    if (phaseTimeframe && matchesAnchor(phaseTimeframe, anchorEntityType, anchorEntityId, anchorEvent)) {
      results.push({
        path: `phase.${phase.id}.timeframe`,
        timeframe: phaseTimeframe,
        entityId: phase.id,
        entityType: 'phase',
      });
    }

    // Check qualify conditions
    for (const qc of phase.availableQualifyConditions) {
      const qcTimeframe = parseTimeframe(qc.timeframe);
      if (qcTimeframe && matchesAnchor(qcTimeframe, anchorEntityType, anchorEntityId, anchorEvent)) {
        results.push({
          path: `qualifyCondition.${qc.id}.timeframe`,
          timeframe: qcTimeframe,
          entityId: qc.id,
          entityType: 'qualifyCondition',
        });
      }
    }

    // Check rewards (usageConditions contain timeframes)
    for (const reward of phase.rewards) {
      if (reward.usageConditions && typeof reward.usageConditions === 'object') {
        const uc = reward.usageConditions as Record<string, unknown>;
        if (uc.timeframe) {
          const usageTimeframe = parseTimeframe(uc.timeframe as Prisma.JsonValue);
          if (usageTimeframe && matchesAnchor(usageTimeframe, anchorEntityType, anchorEntityId, anchorEvent)) {
            results.push({
              path: `reward.${reward.id}.usageConditions.timeframe`,
              timeframe: usageTimeframe,
              entityId: reward.id,
              entityType: 'reward',
            });
          }
        }
      }
    }
  }

  return results;
}

/**
 * Builds a map of all anchor timestamps in a promotion tree.
 * Key format: "ENTITY_TYPE:ENTITY_ID:EVENT"
 */
export function buildTimestampMap(promotion: PromotionWithRelations): Map<string, Date | null> {
  const map = new Map<string, Date | null>();

  // Promotion timestamps
  map.set(`PROMOTION:${promotion.id}:ACTIVE`, promotion.activatedAt);
  map.set(`PROMOTION:${promotion.id}:COMPLETED`, promotion.completedAt);
  map.set(`PROMOTION:${promotion.id}:EXPIRED`, promotion.expiredAt);

  // Phase timestamps
  for (const phase of promotion.phases) {
    map.set(`PHASE:${phase.id}:ACTIVE`, phase.activatedAt);
    map.set(`PHASE:${phase.id}:COMPLETED`, phase.completedAt);
    map.set(`PHASE:${phase.id}:EXPIRED`, phase.expiredAt);
  }

  // Reward timestamps
  for (const phase of promotion.phases) {
    for (const reward of phase.rewards) {
      map.set(`REWARD:${reward.id}:PENDING_TO_CLAIM`, reward.qualifyConditionsFulfilledAt);
      map.set(`REWARD:${reward.id}:CLAIMED`, reward.claimedAt);
      map.set(`REWARD:${reward.id}:RECEIVED`, reward.receivedAt);
      map.set(`REWARD:${reward.id}:IN_USE`, reward.useStartedAt);
      map.set(`REWARD:${reward.id}:USED`, reward.useCompletedAt);
      map.set(`REWARD:${reward.id}:EXPIRED`, reward.expiredAt);
    }
  }

  // Qualify condition timestamps
  for (const phase of promotion.phases) {
    for (const qc of phase.availableQualifyConditions) {
      map.set(`QUALIFY_CONDITION:${qc.id}:STARTED`, qc.startedAt);
      map.set(`QUALIFY_CONDITION:${qc.id}:FULFILLED`, qc.qualifiedAt);
      map.set(`QUALIFY_CONDITION:${qc.id}:FAILED`, qc.failedAt);
      map.set(`QUALIFY_CONDITION:${qc.id}:EXPIRED`, qc.expiredAt);
    }
  }

  return map;
}

/**
 * Gets all anchor entries as a flat list (for iteration).
 */
export function getAllAnchorEntries(promotion: PromotionWithRelations): TimestampEntry[] {
  const entries: TimestampEntry[] = [];

  // Promotion
  entries.push(
    { anchorEntityType: 'PROMOTION', anchorEntityId: promotion.id, anchorEvent: 'ACTIVE', timestamp: promotion.activatedAt },
    { anchorEntityType: 'PROMOTION', anchorEntityId: promotion.id, anchorEvent: 'COMPLETED', timestamp: promotion.completedAt },
    { anchorEntityType: 'PROMOTION', anchorEntityId: promotion.id, anchorEvent: 'EXPIRED', timestamp: promotion.expiredAt },
  );

  // Phases
  for (const phase of promotion.phases) {
    entries.push(
      { anchorEntityType: 'PHASE', anchorEntityId: phase.id, anchorEvent: 'ACTIVE', timestamp: phase.activatedAt },
      { anchorEntityType: 'PHASE', anchorEntityId: phase.id, anchorEvent: 'COMPLETED', timestamp: phase.completedAt },
      { anchorEntityType: 'PHASE', anchorEntityId: phase.id, anchorEvent: 'EXPIRED', timestamp: phase.expiredAt },
    );
  }

  // Rewards
  for (const phase of promotion.phases) {
    for (const reward of phase.rewards) {
      entries.push(
        { anchorEntityType: 'REWARD', anchorEntityId: reward.id, anchorEvent: 'PENDING_TO_CLAIM', timestamp: reward.qualifyConditionsFulfilledAt },
        { anchorEntityType: 'REWARD', anchorEntityId: reward.id, anchorEvent: 'CLAIMED', timestamp: reward.claimedAt },
        { anchorEntityType: 'REWARD', anchorEntityId: reward.id, anchorEvent: 'RECEIVED', timestamp: reward.receivedAt },
        { anchorEntityType: 'REWARD', anchorEntityId: reward.id, anchorEvent: 'IN_USE', timestamp: reward.useStartedAt },
        { anchorEntityType: 'REWARD', anchorEntityId: reward.id, anchorEvent: 'USED', timestamp: reward.useCompletedAt },
        { anchorEntityType: 'REWARD', anchorEntityId: reward.id, anchorEvent: 'EXPIRED', timestamp: reward.expiredAt },
      );
    }
  }

  // Qualify conditions
  for (const phase of promotion.phases) {
    for (const qc of phase.availableQualifyConditions) {
      entries.push(
        { anchorEntityType: 'QUALIFY_CONDITION', anchorEntityId: qc.id, anchorEvent: 'STARTED', timestamp: qc.startedAt },
        { anchorEntityType: 'QUALIFY_CONDITION', anchorEntityId: qc.id, anchorEvent: 'FULFILLED', timestamp: qc.qualifiedAt },
        { anchorEntityType: 'QUALIFY_CONDITION', anchorEntityId: qc.id, anchorEvent: 'FAILED', timestamp: qc.failedAt },
        { anchorEntityType: 'QUALIFY_CONDITION', anchorEntityId: qc.id, anchorEvent: 'EXPIRED', timestamp: qc.expiredAt },
      );
    }
  }

  return entries;
}

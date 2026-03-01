import type {
  AnchorOccurrences,
  PromotionEntity,
  QualifyConditionEntity,
  RewardEntity,
  Timeframe,
} from "../schemas";
import { evaluateTimeframeState, type TimeframeEvaluation } from "../domain/lifecycle";

type RewardDeadlineState = "date" | "open_ended" | "closed" | "no_qc" | "unresolved";

export function buildPromotionAnchorOccurrences(
  promotion: PromotionEntity
): AnchorOccurrences {
  const occurrences: AnchorOccurrences = [
    {
      entityType: "PROMOTION",
      entityRefType: "persisted",
      entityRef: promotion.id,
      event: "ACTIVE",
      occurredAt: promotion.activatedAt,
    },
    {
      entityType: "PROMOTION",
      entityRefType: "persisted",
      entityRef: promotion.id,
      event: "COMPLETED",
      occurredAt: promotion.completedAt,
    },
    {
      entityType: "PROMOTION",
      entityRefType: "persisted",
      entityRef: promotion.id,
      event: "EXPIRED",
      occurredAt: promotion.expiredAt,
    },
  ];

  const seenQualifyConditionIds = new Set<string>();

  for (const phase of promotion.phases) {
    occurrences.push(
      {
        entityType: "PHASE",
        entityRefType: "persisted",
        entityRef: phase.id,
        event: "ACTIVE",
        occurredAt: phase.activatedAt,
      },
      {
        entityType: "PHASE",
        entityRefType: "persisted",
        entityRef: phase.id,
        event: "COMPLETED",
        occurredAt: phase.completedAt,
      },
      {
        entityType: "PHASE",
        entityRefType: "persisted",
        entityRef: phase.id,
        event: "EXPIRED",
        occurredAt: phase.expiredAt,
      }
    );

    for (const reward of phase.rewards) {
      occurrences.push(
        {
          entityType: "REWARD",
          entityRefType: "persisted",
          entityRef: reward.id,
          event: "PENDING_TO_CLAIM",
          occurredAt: reward.qualifyConditionsFulfilledAt,
        },
        {
          entityType: "REWARD",
          entityRefType: "persisted",
          entityRef: reward.id,
          event: "CLAIMED",
          occurredAt: reward.claimedAt,
        },
        {
          entityType: "REWARD",
          entityRefType: "persisted",
          entityRef: reward.id,
          event: "RECEIVED",
          occurredAt: reward.receivedAt,
        },
        {
          entityType: "REWARD",
          entityRefType: "persisted",
          entityRef: reward.id,
          event: "IN_USE",
          occurredAt: reward.useStartedAt,
        },
        {
          entityType: "REWARD",
          entityRefType: "persisted",
          entityRef: reward.id,
          event: "USED",
          occurredAt: reward.useCompletedAt,
        },
        {
          entityType: "REWARD",
          entityRefType: "persisted",
          entityRef: reward.id,
          event: "EXPIRED",
          occurredAt: reward.expiredAt,
        }
      );

      for (const condition of reward.qualifyConditions) {
        if (seenQualifyConditionIds.has(condition.id)) {
          continue;
        }

        seenQualifyConditionIds.add(condition.id);
        occurrences.push(
          {
            entityType: "QUALIFY_CONDITION",
            entityRefType: "persisted",
            entityRef: condition.id,
            event: "STARTED",
            occurredAt: condition.startedAt,
          },
          {
            entityType: "QUALIFY_CONDITION",
            entityRefType: "persisted",
            entityRef: condition.id,
            event: "FULFILLED",
            occurredAt: condition.qualifiedAt,
          },
          {
            entityType: "QUALIFY_CONDITION",
            entityRefType: "persisted",
            entityRef: condition.id,
            event: "FAILED",
            occurredAt: condition.failedAt,
          },
          {
            entityType: "QUALIFY_CONDITION",
            entityRefType: "persisted",
            entityRef: condition.id,
            event: "EXPIRED",
            occurredAt: condition.expiredAt,
          }
        );
      }
    }
  }

  for (const condition of promotion.availableQualifyConditions) {
    if (seenQualifyConditionIds.has(condition.id)) {
      continue;
    }

    seenQualifyConditionIds.add(condition.id);
    occurrences.push(
      {
        entityType: "QUALIFY_CONDITION",
        entityRefType: "persisted",
        entityRef: condition.id,
        event: "STARTED",
        occurredAt: condition.startedAt,
      },
      {
        entityType: "QUALIFY_CONDITION",
        entityRefType: "persisted",
        entityRef: condition.id,
        event: "FULFILLED",
        occurredAt: condition.qualifiedAt,
      },
      {
        entityType: "QUALIFY_CONDITION",
        entityRefType: "persisted",
        entityRef: condition.id,
        event: "FAILED",
        occurredAt: condition.failedAt,
      },
      {
        entityType: "QUALIFY_CONDITION",
        entityRefType: "persisted",
        entityRef: condition.id,
        event: "EXPIRED",
        occurredAt: condition.expiredAt,
      }
    );
  }

  return occurrences;
}

export function resolveTimeframeWindow(
  timeframe: Timeframe | null | undefined,
  promotion?: PromotionEntity | null
): TimeframeEvaluation {
  return evaluateTimeframeState({
    timeframe: timeframe ?? undefined,
    promotionTimeframe: promotion?.timeframe,
    anchorOccurrences: promotion ? buildPromotionAnchorOccurrences(promotion) : undefined,
  });
}

export function getQualifyConditionTimeframeWindow(
  condition: QualifyConditionEntity,
  promotion?: PromotionEntity | null
) {
  return resolveTimeframeWindow(condition.timeframe, promotion);
}

export function getRewardUsageTimeframeWindow(
  reward: RewardEntity,
  promotion?: PromotionEntity | null
) {
  return resolveTimeframeWindow(reward.usageConditions.timeframe, promotion);
}

export function getRewardNextQualifyDeadline(
  reward: RewardEntity,
  promotion?: PromotionEntity | null
): { state: RewardDeadlineState; date: Date | null } {
  if (reward.qualifyConditions.length === 0) {
    return { state: "no_qc", date: null };
  }

  const openConditions = reward.qualifyConditions.filter(
    (condition) => condition.status === "PENDING" || condition.status === "QUALIFYING"
  );

  if (openConditions.length === 0) {
    return { state: "closed", date: null };
  }

  const resolvedDates: Date[] = [];
  let hasOpenEnded = false;
  let hasUnresolved = false;

  for (const condition of openConditions) {
    const window = getQualifyConditionTimeframeWindow(condition, promotion);

    if (!window.resolved) {
      hasUnresolved = true;
      continue;
    }

    if (window.end) {
      resolvedDates.push(window.end);
      continue;
    }

    hasOpenEnded = true;
  }

  if (resolvedDates.length > 0) {
    resolvedDates.sort((left, right) => left.getTime() - right.getTime());
    return { state: "date", date: resolvedDates[0] ?? null };
  }

  if (hasOpenEnded) {
    return { state: "open_ended", date: null };
  }

  if (hasUnresolved) {
    return { state: "unresolved", date: null };
  }

  return { state: "closed", date: null };
}

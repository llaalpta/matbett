import type {
  AnchorOccurrences,
  Timeframe,
} from '../../schemas/timeframe.schema';

export type TimeframeEvaluationState =
  | 'before_start'
  | 'within'
  | 'after_end'
  | 'unresolved';

export type TimeframeEvaluationReason =
  | 'missing_timeframe'
  | 'missing_anchor_occurrence'
  | 'missing_promotion_timeframe'
  | 'recursive_promotion_timeframe';

export type TimeframeEvaluation = {
  state: TimeframeEvaluationState;
  resolved: boolean;
  start: Date | null;
  end: Date | null;
  reason?: TimeframeEvaluationReason;
};

export type EvaluateTimeframeInput = {
  timeframe?: Timeframe | null;
  promotionTimeframe?: Timeframe | null;
  anchorOccurrences?: AnchorOccurrences;
  now?: Date;
};

const unresolved = (
  reason: TimeframeEvaluationReason,
): TimeframeEvaluation => ({
  state: 'unresolved',
  resolved: false,
  start: null,
  end: null,
  reason,
});

function addDays(baseDate: Date, offsetDays: number) {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + offsetDays);
  return nextDate;
}

function resolveRelativeWindow(
  timeframe: Extract<Timeframe, { mode: 'RELATIVE' }>,
  anchorOccurrences?: AnchorOccurrences,
): Pick<TimeframeEvaluation, 'start' | 'end'> | null {
  const occurrence = anchorOccurrences?.find(
    (candidate) =>
      candidate.entityType === timeframe.anchor.entityType &&
      candidate.entityRefType === timeframe.anchor.entityRefType &&
      candidate.entityRef === timeframe.anchor.entityRef &&
      candidate.event === timeframe.anchor.event,
  );

  if (!occurrence?.occurredAt) {
    return null;
  }

  return {
    start: occurrence.occurredAt,
    end: addDays(occurrence.occurredAt, timeframe.offsetDays ?? 0),
  };
}

function evaluateWindow(window: {
  start: Date | null;
  end: Date | null;
}, now: Date): TimeframeEvaluation {
  if (window.start && now < window.start) {
    return {
      state: 'before_start',
      resolved: true,
      start: window.start,
      end: window.end,
    };
  }

  if (window.end && now > window.end) {
    return {
      state: 'after_end',
      resolved: true,
      start: window.start,
      end: window.end,
    };
  }

  return {
    state: 'within',
    resolved: true,
    start: window.start,
    end: window.end,
  };
}

function evaluateTimeframeInternal(
  input: EvaluateTimeframeInput,
  isNestedPromotionResolution = false,
): TimeframeEvaluation {
  const { timeframe, promotionTimeframe, anchorOccurrences, now = new Date() } = input;

  if (!timeframe) {
    return unresolved('missing_timeframe');
  }

  switch (timeframe.mode) {
    case 'ABSOLUTE':
      return evaluateWindow(
        {
          start: timeframe.start,
          end: timeframe.end ?? null,
        },
        now,
      );
    case 'RELATIVE': {
      const window = resolveRelativeWindow(timeframe, anchorOccurrences);
      if (!window) {
        return unresolved('missing_anchor_occurrence');
      }
      return evaluateWindow(window, now);
    }
    case 'PROMOTION':
      if (!promotionTimeframe) {
        return unresolved('missing_promotion_timeframe');
      }
      if (isNestedPromotionResolution && promotionTimeframe.mode === 'PROMOTION') {
        return unresolved('recursive_promotion_timeframe');
      }
      return evaluateTimeframeInternal(
        {
          timeframe: promotionTimeframe,
          anchorOccurrences,
          promotionTimeframe: undefined,
          now,
        },
        true,
      );
    default:
      return unresolved('missing_timeframe');
  }
}

export function evaluateTimeframeState(
  input: EvaluateTimeframeInput,
): TimeframeEvaluation {
  return evaluateTimeframeInternal(input);
}

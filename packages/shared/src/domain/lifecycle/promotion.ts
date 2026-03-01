import {
  promotionStatusOptions,
  type PhaseStatus,
  type PromotionStatus,
  type QualifyConditionStatus,
  type RewardStatus,
} from '../../options';

import type {
  LifecycleReason,
  LifecycleStatusOption,
  LifecycleWarning,
} from './types';
import type { TimeframeEvaluation } from './timeframe';

export type PromotionLifecycleRewardContext = {
  rewardStatus?: RewardStatus | string;
  qualifyConditionStatuses?: Array<QualifyConditionStatus | string | null | undefined>;
};

export type PromotionLifecyclePhaseContext = {
  phaseStatus?: PhaseStatus | string;
  rewards?: PromotionLifecycleRewardContext[];
};

export type PromotionLifecyclePolicyInput = {
  isPersisted: boolean;
  promotionStatus?: PromotionStatus | string;
  phases?: PromotionLifecyclePhaseContext[];
  timeframeState?: TimeframeEvaluation;
  isTerminalForWarnings?: boolean;
};

export type PromotionLifecyclePolicy = {
  canEditStructure: boolean;
  structureReasons: LifecycleReason[];
  canEditStatus: boolean;
  statusOptions: LifecycleStatusOption<PromotionStatus>[];
  warnings: LifecycleWarning[];
};

const phaseOpenStatuses = new Set<PhaseStatus>(['NOT_STARTED', 'ACTIVE']);

function dedupeReasons(reasons: LifecycleReason[]) {
  const seen = new Set<string>();
  return reasons.filter((reason) => {
    const key = `${reason.code}:${reason.message}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function hasOpenPhases(phases: PromotionLifecyclePolicyInput['phases']) {
  return (phases ?? []).some((phase) =>
    phaseOpenStatuses.has((phase.phaseStatus ?? '') as PhaseStatus),
  );
}

function isPromotionTreeInitial(phases: PromotionLifecyclePolicyInput['phases']) {
  return (phases ?? []).every(
    (phase) =>
      phase.phaseStatus === 'NOT_STARTED' &&
      (phase.rewards ?? []).every(
        (reward) =>
          reward.rewardStatus === 'QUALIFYING' &&
          (reward.qualifyConditionStatuses ?? []).every((status) => status === 'PENDING'),
      ),
  );
}

function buildPromotionStatusOptionReasons(
  status: PromotionStatus,
  input: PromotionLifecyclePolicyInput,
): LifecycleReason[] {
  const reasons: LifecycleReason[] = [];

  switch (status) {
    case 'NOT_STARTED':
      if (!isPromotionTreeInitial(input.phases)) {
        reasons.push({
          code: 'phase_tree_not_initial',
          message:
            'La promotion solo puede volver a No iniciada si todas las phases están No iniciadas, con rewards en Calificando y qualify conditions en Pendiente.',
        });
      }
      break;
    case 'ACTIVE':
      if (!hasOpenPhases(input.phases)) {
        reasons.push({
          code: 'no_open_phases',
          message:
            'La promotion solo puede estar Activa si al menos una phase sigue No iniciada o Activa.',
        });
      }
      break;
    case 'COMPLETED':
    case 'EXPIRED':
      if (hasOpenPhases(input.phases)) {
        reasons.push({
          code: 'open_phases_present',
          message:
            'La promotion no puede cerrarse mientras tenga phases en estados abiertos.',
        });
      }
      break;
    default:
      break;
  }

  return dedupeReasons(reasons);
}

function buildPromotionWarnings(
  input: PromotionLifecyclePolicyInput,
): LifecycleWarning[] {
  const warnings: LifecycleWarning[] = [];
  const isTerminal =
    input.isTerminalForWarnings ??
    (input.promotionStatus === 'COMPLETED' || input.promotionStatus === 'EXPIRED');

  if (input.timeframeState?.state === 'after_end' && !isTerminal) {
    warnings.push({
      code: 'outside_promotion_timeframe',
      message:
        'La promotion está fuera de su periodo configurado, pero su estado sigue abierto. Revisa si debes actualizar manualmente el estado.',
    });
  }

  if (input.timeframeState?.state === 'before_start' && input.promotionStatus === 'ACTIVE') {
    warnings.push({
      code: 'promotion_active_before_start',
      message:
        'La promotion figura Activa antes del inicio de su periodo configurado. Revisa si debes actualizar manualmente el estado.',
    });
  }

  return dedupeReasons(warnings);
}

export function getPromotionLifecyclePolicy(
  input: PromotionLifecyclePolicyInput,
): PromotionLifecyclePolicy {
  const structureReasons: LifecycleReason[] = [];

  if (input.isPersisted) {
    if (
      input.promotionStatus !== 'NOT_STARTED' &&
      input.promotionStatus !== 'ACTIVE'
    ) {
      structureReasons.push({
        code: 'promotion_not_open',
        message:
          'La configuración solo se puede editar mientras la promotion está No iniciada o Activa.',
      });
    }
  }

  return {
    canEditStructure: structureReasons.length === 0,
    structureReasons: dedupeReasons(structureReasons),
    canEditStatus: true,
    statusOptions: promotionStatusOptions.map((option) => {
      const reasons = buildPromotionStatusOptionReasons(option.value, input);
      return {
        value: option.value,
        label: option.label,
        enabled: reasons.length === 0,
        reasons,
      };
    }),
    warnings: buildPromotionWarnings(input),
  };
}

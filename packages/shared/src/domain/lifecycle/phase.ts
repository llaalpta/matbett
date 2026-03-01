import {
  phaseStatusOptions,
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

export type PhaseLifecycleRewardContext = {
  rewardStatus?: RewardStatus | string;
  qualifyConditionStatuses?: Array<QualifyConditionStatus | string | null | undefined>;
};

export type PhaseLifecyclePolicyInput = {
  isPersisted: boolean;
  promotionStatus?: PromotionStatus | string;
  phaseStatus?: PhaseStatus | string;
  rewards?: PhaseLifecycleRewardContext[];
  timeframeState?: TimeframeEvaluation;
  isTerminalForWarnings?: boolean;
};

export type PhaseLifecyclePolicy = {
  canEditStructure: boolean;
  structureReasons: LifecycleReason[];
  canEditStatus: boolean;
  statusOptions: LifecycleStatusOption<PhaseStatus>[];
  warnings: LifecycleWarning[];
};

const promotionOpenStatuses = new Set<PromotionStatus>(['NOT_STARTED', 'ACTIVE']);
const rewardOpenStatuses = new Set<RewardStatus>([
  'QUALIFYING',
  'PENDING_TO_CLAIM',
  'CLAIMED',
  'RECEIVED',
  'IN_USE',
]);

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

function isPromotionStructurallyOpen(status: PromotionStatus | string | undefined) {
  return status === undefined || promotionOpenStatuses.has(status as PromotionStatus);
}

function hasOpenRewards(rewards: PhaseLifecyclePolicyInput['rewards']) {
  return (rewards ?? []).some((reward) =>
    rewardOpenStatuses.has((reward.rewardStatus ?? '') as RewardStatus),
  );
}

function areRewardsInitial(rewards: PhaseLifecyclePolicyInput['rewards']) {
  return (rewards ?? []).every(
    (reward) =>
      reward.rewardStatus === 'QUALIFYING' &&
      (reward.qualifyConditionStatuses ?? []).every((status) => status === 'PENDING'),
  );
}

function buildPhaseStatusOptionReasons(
  status: PhaseStatus,
  input: PhaseLifecyclePolicyInput,
): LifecycleReason[] {
  const reasons: LifecycleReason[] = [];

  switch (status) {
    case 'NOT_STARTED':
      if (!isPromotionStructurallyOpen(input.promotionStatus)) {
        reasons.push({
          code: 'promotion_not_open',
          message:
            'La promotion padre debe estar abierta para volver la phase a No iniciada.',
        });
      }
      if (!areRewardsInitial(input.rewards)) {
        reasons.push({
          code: 'reward_tree_not_initial',
          message:
            'Todas las rewards deben estar en Calificando y sus qualify conditions en Pendiente para volver la phase a No iniciada.',
        });
      }
      break;
    case 'ACTIVE':
      if (input.promotionStatus !== 'ACTIVE') {
        reasons.push({
          code: 'promotion_not_active',
          message: 'La promotion padre debe estar Activa para activar esta phase.',
        });
      }
      if (!hasOpenRewards(input.rewards)) {
        reasons.push({
          code: 'no_open_rewards',
          message:
            'La phase solo puede estar Activa si al menos una reward hija sigue abierta.',
        });
      }
      break;
    case 'COMPLETED':
    case 'EXPIRED':
      if (hasOpenRewards(input.rewards)) {
        reasons.push({
          code: 'open_rewards_present',
          message:
            'La phase no puede cerrarse mientras tenga rewards en estados abiertos.',
        });
      }
      break;
    default:
      break;
  }

  return dedupeReasons(reasons);
}

function buildPhaseWarnings(input: PhaseLifecyclePolicyInput): LifecycleWarning[] {
  const warnings: LifecycleWarning[] = [];
  const isTerminal =
    input.isTerminalForWarnings ??
    (input.phaseStatus === 'COMPLETED' || input.phaseStatus === 'EXPIRED');

  if (input.timeframeState?.state === 'after_end' && !isTerminal) {
    warnings.push({
      code: 'outside_phase_timeframe',
      message:
        'La phase está fuera de su periodo configurado, pero su estado sigue abierto. Revisa si debes actualizar manualmente el estado.',
    });
  }

  if (input.timeframeState?.state === 'before_start' && input.phaseStatus === 'ACTIVE') {
    warnings.push({
      code: 'phase_active_before_start',
      message:
        'La phase figura Activa antes del inicio de su periodo configurado. Revisa si debes actualizar manualmente el estado.',
    });
  }

  return dedupeReasons(warnings);
}

export function getPhaseLifecyclePolicy(
  input: PhaseLifecyclePolicyInput,
): PhaseLifecyclePolicy {
  const structureReasons: LifecycleReason[] = [];

  if (input.isPersisted) {
    if (!isPromotionStructurallyOpen(input.promotionStatus)) {
      structureReasons.push({
        code: 'promotion_not_open',
        message:
          'La promotion ya no está en una fase editable; la configuración de la phase queda bloqueada.',
      });
    }

    if (input.phaseStatus !== 'NOT_STARTED' && input.phaseStatus !== 'ACTIVE') {
      structureReasons.push({
        code: 'phase_not_open',
        message:
          'La configuración solo se puede editar mientras la phase está No iniciada o Activa.',
      });
    }
  }

  return {
    canEditStructure: structureReasons.length === 0,
    structureReasons: dedupeReasons(structureReasons),
    canEditStatus: true,
    statusOptions: phaseStatusOptions.map((option) => {
      const reasons = buildPhaseStatusOptionReasons(option.value, input);
      return {
        value: option.value,
        label: option.label,
        enabled: reasons.length === 0,
        reasons,
      };
    }),
    warnings: buildPhaseWarnings(input),
  };
}

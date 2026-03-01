import {
  rewardStatusOptions,
  type ClaimMethod,
  type PhaseStatus,
  type PromotionStatus,
  type QualifyConditionStatus,
  type RewardStatus,
  type RewardType,
} from '../../options';

import type {
  LifecycleActionPolicy,
  LifecycleReason,
  LifecycleStatusOption,
  LifecycleWarning,
} from './types';
import type { TimeframeEvaluation } from './timeframe';

export type RewardLifecyclePolicyInput = {
  isPersisted: boolean;
  rewardType?: RewardType | string;
  rewardStatus?: RewardStatus | string;
  claimMethod?: ClaimMethod | string;
  promotionStatus?: PromotionStatus | string;
  phaseStatus?: PhaseStatus | string;
  qualifyConditionStatuses?: Array<QualifyConditionStatus | string | null | undefined>;
  usageTimeframeState?: TimeframeEvaluation;
  isTerminalForWarnings?: boolean;
};

export type RewardLifecyclePolicy = {
  canEditStructure: boolean;
  structureReasons: LifecycleReason[];
  canEditStatus: boolean;
  statusOptions: LifecycleStatusOption<RewardStatus>[];
  warnings: LifecycleWarning[];
  betEntry: LifecycleActionPolicy;
  supportsBetUsage: boolean;
};

const rewardBetUsageTypes = new Set<RewardType>([
  'FREEBET',
  'CASHBACK_FREEBET',
  'BET_BONUS_ROLLOVER',
  'BET_BONUS_NO_ROLLOVER',
  'ENHANCED_ODDS',
]);

const manualClaimMethods = new Set<ClaimMethod>([
  'MANUAL_CLICK',
  'MANUAL_CODE',
  'CUSTOMER_SERVICE',
]);

const qcOpenStatuses = new Set<QualifyConditionStatus>(['PENDING', 'QUALIFYING']);

function dedupeReasons(reasons: LifecycleReason[]): LifecycleReason[] {
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

function isStructureOpenPromotionStatus(status: RewardLifecyclePolicyInput['promotionStatus']) {
  return status === undefined || status === 'NOT_STARTED' || status === 'ACTIVE';
}

function isStructureOpenPhaseStatus(status: RewardLifecyclePolicyInput['phaseStatus']) {
  return status === undefined || status === 'NOT_STARTED' || status === 'ACTIVE';
}

function isRewardBetUsageSupported(rewardType: RewardLifecyclePolicyInput['rewardType']) {
  if (!rewardType) {
    return false;
  }

  return rewardBetUsageTypes.has(rewardType as RewardType);
}

function isRewardUsableInBetStatus(status: RewardLifecyclePolicyInput['rewardStatus']) {
  return status === 'RECEIVED' || status === 'IN_USE';
}

function areAllQualifyConditionsFulfilled(
  qualifyConditionStatuses: RewardLifecyclePolicyInput['qualifyConditionStatuses'],
) {
  return (
    Array.isArray(qualifyConditionStatuses) &&
    qualifyConditionStatuses.length > 0 &&
    qualifyConditionStatuses.every((status) => status === 'FULFILLED')
  );
}

function areAllQualifyConditionsOpenForRewardReopen(
  qualifyConditionStatuses: RewardLifecyclePolicyInput['qualifyConditionStatuses'],
) {
  return (
    Array.isArray(qualifyConditionStatuses) &&
    qualifyConditionStatuses.every(
      (status) => status === undefined || status === null || qcOpenStatuses.has(status as QualifyConditionStatus),
    )
  );
}

function buildRewardStatusOptionReasons(
  status: RewardStatus,
  input: RewardLifecyclePolicyInput,
): LifecycleReason[] {
  const reasons: LifecycleReason[] = [];
  const allQualifyConditionsFulfilled = areAllQualifyConditionsFulfilled(
    input.qualifyConditionStatuses,
  );
  const allQualifyConditionsOpen = areAllQualifyConditionsOpenForRewardReopen(
    input.qualifyConditionStatuses,
  );

  switch (status) {
    case 'QUALIFYING':
      if (!isStructureOpenPromotionStatus(input.promotionStatus)) {
        reasons.push({
          code: 'promotion_not_open',
          message:
            'La promotion padre debe estar en un estado abierto para volver la reward a Calificando.',
        });
      }
      if (!isStructureOpenPhaseStatus(input.phaseStatus)) {
        reasons.push({
          code: 'phase_not_open',
          message:
            'La phase padre debe estar en un estado abierto para volver la reward a Calificando.',
        });
      }
      if (!allQualifyConditionsOpen) {
        reasons.push({
          code: 'qualify_conditions_not_open',
          message:
            'Todas las qualify conditions deben estar Pendiente o Calificando para volver la reward a Calificando.',
        });
      }
      break;
    case 'PENDING_TO_CLAIM':
    case 'CLAIMED':
      if (!allQualifyConditionsFulfilled) {
        reasons.push({
          code: 'qualify_conditions_not_fulfilled',
          message:
            'Todas las qualify conditions deben estar Cumplidas para avanzar este estado de la reward.',
        });
      }
      if (!manualClaimMethods.has((input.claimMethod ?? '') as ClaimMethod)) {
        reasons.push({
          code: 'manual_claim_required',
          message:
            'Este estado solo está disponible para rewards con método de reclamación manual.',
        });
      }
      break;
    case 'RECEIVED':
    case 'IN_USE':
    case 'USED':
      if (!allQualifyConditionsFulfilled) {
        reasons.push({
          code: 'qualify_conditions_not_fulfilled',
          message:
            'Todas las qualify conditions deben estar Cumplidas para avanzar este estado de la reward.',
        });
      }
      break;
    case 'EXPIRED':
      break;
    default:
      break;
  }

  return dedupeReasons(reasons);
}

function buildRewardWarnings(input: RewardLifecyclePolicyInput): LifecycleWarning[] {
  const warnings: LifecycleWarning[] = [];
  const qualifyConditionStatuses = input.qualifyConditionStatuses ?? [];
  const isTerminal = input.isTerminalForWarnings ??
    (input.rewardStatus === 'USED' || input.rewardStatus === 'EXPIRED');

  if (qualifyConditionStatuses.some((status) => status === 'FAILED')) {
    warnings.push({
      code: 'child_qc_failed',
      message:
        'Hay qualify conditions en estado Fallida; revisa si la reward debe seguir en su estado actual.',
    });
  }

  if (qualifyConditionStatuses.some((status) => status === 'EXPIRED')) {
    warnings.push({
      code: 'child_qc_expired',
      message:
        'Hay qualify conditions en estado Expirada; revisa si la reward debe seguir en su estado actual.',
    });
  }

  if (input.usageTimeframeState?.state === 'after_end' && !isTerminal) {
    warnings.push({
      code: 'outside_usage_timeframe',
      message:
        'La reward está fuera de su periodo de uso, pero su estado sigue abierto. Revisa si debes actualizar manualmente el estado.',
    });
  }

  if (input.usageTimeframeState?.state === 'before_start' && input.rewardStatus === 'IN_USE') {
    warnings.push({
      code: 'usage_before_start',
      message:
        'La reward figura En uso antes del inicio de su periodo de uso. Revisa si debes actualizar manualmente el estado.',
    });
  }

  return dedupeReasons(warnings);
}

export function getRewardLifecyclePolicy(
  input: RewardLifecyclePolicyInput,
): RewardLifecyclePolicy {
  const structureReasons: LifecycleReason[] = [];

  if (input.isPersisted) {
    if (!isStructureOpenPromotionStatus(input.promotionStatus)) {
      structureReasons.push({
        code: 'promotion_not_open',
        message:
          'La promotion ya no está en una fase editable; la configuración de la reward queda bloqueada.',
      });
    }

    if (!isStructureOpenPhaseStatus(input.phaseStatus)) {
      structureReasons.push({
        code: 'phase_not_open',
        message:
          'La phase ya no está en un estado editable; la configuración de la reward queda bloqueada.',
      });
    }

    if (input.rewardStatus !== 'QUALIFYING') {
      structureReasons.push({
        code: 'reward_not_qualifying',
        message:
          'La configuración solo se puede editar mientras la reward está en estado Calificando.',
      });
    }
  }

  const statusOptions = rewardStatusOptions.map(
    (option): LifecycleStatusOption<RewardStatus> => {
      const reasons = buildRewardStatusOptionReasons(option.value, input);
      return {
        value: option.value,
        label: option.label,
        enabled: reasons.length === 0,
        reasons,
      };
    },
  );

  const supportsBetUsage = isRewardBetUsageSupported(input.rewardType);
  const betEntryReasons: LifecycleReason[] = [];

  if (supportsBetUsage) {
    if (!input.isPersisted) {
      betEntryReasons.push({
        code: 'reward_not_persisted',
        message:
          'Guarda la reward primero para poder usarla en el registro contextual.',
      });
    }

    if (!isRewardUsableInBetStatus(input.rewardStatus)) {
      betEntryReasons.push({
        code: 'reward_not_usable_in_bet',
        message:
          'La reward solo se puede usar en apuestas cuando está Recibida o En uso.',
      });
    }
  }

  return {
    canEditStructure: structureReasons.length === 0,
    structureReasons: dedupeReasons(structureReasons),
    canEditStatus: true,
    statusOptions,
    warnings: buildRewardWarnings(input),
    supportsBetUsage,
    betEntry: {
      supported: supportsBetUsage,
      enabled: supportsBetUsage && betEntryReasons.length === 0,
      reasons: dedupeReasons(betEntryReasons),
    },
  };
}

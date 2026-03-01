import {
  qualifyConditionStatusOptions,
  type PhaseStatus,
  type PromotionStatus,
  type QualifyConditionStatus,
  type QualifyConditionType,
  type RewardStatus,
} from '../../options';

import type {
  LifecycleActionPolicy,
  LifecycleReason,
  LifecycleStatusOption,
  LifecycleWarning,
} from './types';
import type { TimeframeEvaluation } from './timeframe';

export type QualifyConditionParentContext = {
  rewardStatus?: RewardStatus | string;
  promotionStatus?: PromotionStatus | string;
  phaseStatus?: PhaseStatus | string;
};

export type QualifyConditionLifecyclePolicyInput = {
  isPersisted: boolean;
  conditionType?: QualifyConditionType | string;
  conditionStatus?: QualifyConditionStatus | string;
  parents?: QualifyConditionParentContext[];
  timeframeState?: TimeframeEvaluation;
  isTerminalForWarnings?: boolean;
  noRetriesRemaining?: boolean;
};

export type QualifyConditionLifecyclePolicy = {
  canEditStructure: boolean;
  structureReasons: LifecycleReason[];
  canEditStatus: boolean;
  statusReasons: LifecycleReason[];
  statusOptions: LifecycleStatusOption<QualifyConditionStatus>[];
  warnings: LifecycleWarning[];
  supportsBetRegistration: boolean;
  supportsDepositRegistration: boolean;
  trackingAction: LifecycleActionPolicy;
  betEntry: LifecycleActionPolicy;
  depositEntry: LifecycleActionPolicy;
};

const qcTrackableStatuses = new Set<QualifyConditionStatus>(['PENDING', 'QUALIFYING']);

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

function isStructureOpenPromotionStatus(status: PromotionStatus | string | undefined) {
  return status === undefined || status === 'NOT_STARTED' || status === 'ACTIVE';
}

function isStructureOpenPhaseStatus(status: PhaseStatus | string | undefined) {
  return status === undefined || status === 'NOT_STARTED' || status === 'ACTIVE';
}

function isRuntimeOpenPromotionStatus(status: PromotionStatus | string | undefined) {
  return status === undefined || status === 'ACTIVE';
}

function isRuntimeOpenPhaseStatus(status: PhaseStatus | string | undefined) {
  return status === undefined || status === 'ACTIVE';
}

function resolveParents(input: QualifyConditionLifecyclePolicyInput) {
  return input.parents ?? [];
}

function getParentConsistencyReasons(
  parents: QualifyConditionParentContext[],
): LifecycleReason[] {
  const reasons: LifecycleReason[] = [];

  for (const parent of parents) {
    if (!isStructureOpenPromotionStatus(parent.promotionStatus)) {
      reasons.push({
        code: 'promotion_not_open',
        message:
          'La promotion padre ya no está en un estado abierto; la qualify condition queda bloqueada.',
      });
    }

    if (!isStructureOpenPhaseStatus(parent.phaseStatus)) {
      reasons.push({
        code: 'phase_not_open',
        message:
          'La phase padre ya no está en un estado abierto; la qualify condition queda bloqueada.',
      });
    }

    if (parent.rewardStatus !== undefined && parent.rewardStatus !== 'QUALIFYING') {
      reasons.push({
        code: 'reward_not_qualifying',
        message:
          'La reward asociada ya no está calificando; el estado de la qualify condition queda bloqueado.',
      });
    }
  }

  return dedupeReasons(reasons);
}

function getTrackingActionReasons(
  input: QualifyConditionLifecyclePolicyInput,
  parents: QualifyConditionParentContext[],
): LifecycleReason[] {
  const reasons: LifecycleReason[] = [];

  if (!input.isPersisted) {
    reasons.push({
      code: 'condition_not_persisted',
      message:
        'Guarda la qualify condition primero para poder registrar acciones de tracking desde su contexto.',
    });
  }

  if (!qcTrackableStatuses.has((input.conditionStatus ?? '') as QualifyConditionStatus)) {
    reasons.push({
      code: 'condition_not_trackable',
      message:
        'Solo se pueden registrar acciones de tracking cuando la qualify condition está Pendiente o Calificando.',
    });
  }

  if (parents.length === 0) {
    reasons.push({
      code: 'missing_parent_context',
      message:
        'No hay una reward activa asociada a esta qualify condition para registrar tracking contextual.',
    });
  }

  for (const parent of parents) {
    if (parent.rewardStatus !== undefined && parent.rewardStatus !== 'QUALIFYING') {
      reasons.push({
        code: 'reward_not_qualifying',
        message:
          'La reward asociada ya no está en fase de calificación.',
      });
    }

    if (!isRuntimeOpenPromotionStatus(parent.promotionStatus)) {
      reasons.push({
        code: 'promotion_not_active',
        message:
          'La promotion debe estar activa para registrar tracking sobre esta qualify condition.',
      });
    }

    if (!isRuntimeOpenPhaseStatus(parent.phaseStatus)) {
      reasons.push({
        code: 'phase_not_active',
        message:
          'La phase debe estar activa para registrar tracking sobre esta qualify condition.',
      });
    }
  }

  return dedupeReasons(reasons);
}

function buildQualifyConditionWarnings(
  input: QualifyConditionLifecyclePolicyInput,
): LifecycleWarning[] {
  const warnings: LifecycleWarning[] = [];
  const isTerminal = input.isTerminalForWarnings ??
    (
      input.conditionStatus === 'FULFILLED' ||
      input.conditionStatus === 'FAILED' ||
      input.conditionStatus === 'EXPIRED'
    );

  if (input.noRetriesRemaining && !isTerminal) {
    warnings.push({
      code: 'no_retries_remaining',
      message:
        'La qualify condition ya no tiene reintentos disponibles, pero su estado sigue abierto.',
    });
  }

  if (input.timeframeState?.state === 'after_end' && !isTerminal) {
    warnings.push({
      code: 'outside_qualification_timeframe',
      message:
        'La qualify condition está fuera de su periodo de calificación, pero su estado sigue abierto.',
    });
  }

  if (input.timeframeState?.state === 'before_start' && input.conditionStatus === 'QUALIFYING') {
    warnings.push({
      code: 'qualification_before_start',
      message:
        'La qualify condition figura Calificando antes del inicio de su periodo de calificación.',
    });
  }

  return dedupeReasons(warnings);
}

export function getQualifyConditionLifecyclePolicy(
  input: QualifyConditionLifecyclePolicyInput,
): QualifyConditionLifecyclePolicy {
  const parents = resolveParents(input);
  const statusReasons = input.isPersisted ? getParentConsistencyReasons(parents) : [];
  const structureReasons: LifecycleReason[] = [...statusReasons];

  if (
    input.isPersisted &&
    input.conditionStatus !== undefined &&
    !qcTrackableStatuses.has(input.conditionStatus as QualifyConditionStatus)
  ) {
    structureReasons.push({
      code: 'condition_not_open',
      message:
        'La definición solo se puede editar mientras la qualify condition está Pendiente o Calificando.',
    });
  }

  const mergedStructureReasons = dedupeReasons(structureReasons);
  const mergedStatusReasons = dedupeReasons(statusReasons);

  const statusOptions = qualifyConditionStatusOptions.map(
    (option): LifecycleStatusOption<QualifyConditionStatus> => ({
      value: option.value,
      label: option.label,
      enabled: mergedStatusReasons.length === 0,
      reasons: mergedStatusReasons,
    }),
  );

  const trackingReasons = getTrackingActionReasons(input, parents);
  const supportsBetRegistration =
    input.conditionType === 'BET' || input.conditionType === 'LOSSES_CASHBACK';
  const supportsDepositRegistration = input.conditionType === 'DEPOSIT';

  return {
    canEditStructure: mergedStructureReasons.length === 0,
    structureReasons: mergedStructureReasons,
    canEditStatus: mergedStatusReasons.length === 0,
    statusReasons: mergedStatusReasons,
    statusOptions,
    warnings: buildQualifyConditionWarnings(input),
    supportsBetRegistration,
    supportsDepositRegistration,
    trackingAction: {
      supported: supportsBetRegistration || supportsDepositRegistration,
      enabled: trackingReasons.length === 0,
      reasons: trackingReasons,
    },
    betEntry: {
      supported: supportsBetRegistration,
      enabled: supportsBetRegistration && trackingReasons.length === 0,
      reasons: trackingReasons,
    },
    depositEntry: {
      supported: supportsDepositRegistration,
      enabled: supportsDepositRegistration && trackingReasons.length === 0,
      reasons: trackingReasons,
    },
  };
}

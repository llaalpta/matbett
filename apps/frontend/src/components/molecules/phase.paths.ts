import { FieldArrayPath, Path } from "react-hook-form";

import type { TimeframePaths } from "@/components/molecules/TimeframeForm";
import type { PromotionFormData } from "@/types/hooks";

export type PhasePath = `phases.${number}`;
type PromotionPhaseRewardsPath = `${PhasePath}.rewards`;
export type PromotionPhaseRewardPath = `${PhasePath}.rewards.${number}`;

export interface PhasePaths {
  phasePath: PhasePath;
  rewardsPath: PromotionPhaseRewardsPath;
  rewardsWatchPath: PromotionPhaseRewardsPath;
  statusPath: Path<PromotionFormData>;
  statusDatePath: Path<PromotionFormData>;
  namePath: Path<PromotionFormData>;
  descriptionPath: Path<PromotionFormData>;
  activationMethodPath: Path<PromotionFormData>;
  timeframePaths: TimeframePaths<PromotionFormData>;
  getRewardFieldPath: (rewardIndex: number) => PromotionPhaseRewardPath;
}

export function buildPhasePaths(
  phaseIndex: number
): PhasePaths {
  const phasePath: PhasePath = `phases.${phaseIndex}`;
  const rewardsPath = `phases.${phaseIndex}.rewards` satisfies FieldArrayPath<PromotionFormData>;
  const rewardsWatchPath = `phases.${phaseIndex}.rewards` satisfies Path<PromotionFormData>;
  const statusPath = `phases.${phaseIndex}.status` satisfies Path<PromotionFormData>;
  const statusDatePath = `phases.${phaseIndex}.statusDate` satisfies Path<PromotionFormData>;
  const namePath = `phases.${phaseIndex}.name` satisfies Path<PromotionFormData>;
  const descriptionPath = `phases.${phaseIndex}.description` satisfies Path<PromotionFormData>;
  const activationMethodPath =
    `phases.${phaseIndex}.activationMethod` satisfies Path<PromotionFormData>;
  const modePath = `${phasePath}.timeframe.mode` satisfies Path<PromotionFormData>;
  const startPath = `${phasePath}.timeframe.start` satisfies Path<PromotionFormData>;
  const endPath = `${phasePath}.timeframe.end` satisfies Path<PromotionFormData>;
  const anchorEntityTypePath =
    `${phasePath}.timeframe.anchor.entityType` satisfies Path<PromotionFormData>;
  const anchorEntityRefTypePath =
    `${phasePath}.timeframe.anchor.entityRefType` satisfies Path<PromotionFormData>;
  const anchorEntityRefPath =
    `${phasePath}.timeframe.anchor.entityRef` satisfies Path<PromotionFormData>;
  const anchorEventPath =
    `${phasePath}.timeframe.anchor.event` satisfies Path<PromotionFormData>;
  const offsetDaysPath =
    `${phasePath}.timeframe.offsetDays` satisfies Path<PromotionFormData>;

  return {
    phasePath,
    rewardsPath,
    rewardsWatchPath,
    statusPath,
    statusDatePath,
    namePath,
    descriptionPath,
    activationMethodPath,
    timeframePaths: {
      mode: modePath,
      start: startPath,
      end: endPath,
      anchorEntityType: anchorEntityTypePath,
      anchorEntityRefType: anchorEntityRefTypePath,
      anchorEntityRef: anchorEntityRefPath,
      anchorEvent: anchorEventPath,
      offsetDays: offsetDaysPath,
    },
    getRewardFieldPath: (rewardIndex: number) =>
      `phases.${phaseIndex}.rewards.${rewardIndex}`,
  };
}

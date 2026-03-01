import { FieldArrayPath, FieldValues, Path } from "react-hook-form";

import type { PromotionFormData, RewardFormData } from "@/types/hooks";

import {
  buildPromotionQualifyConditionPathsGetter,
  buildRewardQualifyConditionPathsGetter,
  type PromotionRewardPath,
} from "./qualifyCondition.paths";
import type { RewardFormPaths } from "./RewardFormBase";
import {
  buildPromotionRewardUsagePaths,
  buildRewardStandaloneUsagePaths,
} from "./usageConditions.paths";

export type { PromotionRewardPath };

const createPathHelpers = <T extends FieldValues>() => ({
  path: <P extends Path<T>>(value: P) => value,
  arrayPath: <P extends FieldArrayPath<T>>(value: P) => value,
});

export const buildPromotionRewardPaths = (
  rewardBasePath: PromotionRewardPath,
  p: (value: Path<PromotionFormData>) => Path<PromotionFormData>
) => {
  const promotionPath = createPathHelpers<PromotionFormData>();
  const qualifyConditionsPath = promotionPath.arrayPath(
    `${rewardBasePath}.qualifyConditions`
  );

  const paths = {
    reward: promotionPath.path(`${rewardBasePath}`),
    id: promotionPath.path(`${rewardBasePath}.id`),
    type: promotionPath.path(`${rewardBasePath}.type`),
    valueType: promotionPath.path(`${rewardBasePath}.valueType`),
    value: promotionPath.path(`${rewardBasePath}.value`),
    activationMethod: promotionPath.path(`${rewardBasePath}.activationMethod`),
    claimMethod: promotionPath.path(`${rewardBasePath}.claimMethod`),
    activationRestrictions: promotionPath.path(
      `${rewardBasePath}.activationRestrictions`
    ),
    status: promotionPath.path(`${rewardBasePath}.status`),
    statusDate: promotionPath.path(`${rewardBasePath}.statusDate`),
    claimRestrictions: promotionPath.path(`${rewardBasePath}.claimRestrictions`),
    withdrawalRestrictions: promotionPath.path(
      `${rewardBasePath}.withdrawalRestrictions`
    ),
    stakeNotReturned: promotionPath.path(
      `${rewardBasePath}.typeSpecificFields.stakeNotReturned`
    ),
    qualifyConditions: qualifyConditionsPath,
    usageConditions: promotionPath.path(`${rewardBasePath}.usageConditions`),
    usageConditionsType: promotionPath.path(
      `${rewardBasePath}.usageConditions.type`
    ),
  } as const satisfies RewardFormPaths<
    PromotionFormData,
    typeof qualifyConditionsPath
  >;

  return {
    paths,
    qualifyConditionsPath,
    usagePaths: buildPromotionRewardUsagePaths(rewardBasePath, p),
    getQualifyConditionPaths: buildPromotionQualifyConditionPathsGetter(
      rewardBasePath,
      p
    ),
  };
};

export const buildRewardStandalonePaths = (
  p: (value: Path<RewardFormData>) => Path<RewardFormData>
) => {
  const rewardPath = createPathHelpers<RewardFormData>();
  const qualifyConditionsPath = rewardPath.arrayPath("qualifyConditions");

  const paths = {
    id: rewardPath.path("id"),
    type: rewardPath.path("type"),
    valueType: rewardPath.path("valueType"),
    value: rewardPath.path("value"),
    activationMethod: rewardPath.path("activationMethod"),
    claimMethod: rewardPath.path("claimMethod"),
    activationRestrictions: rewardPath.path("activationRestrictions"),
    status: rewardPath.path("status"),
    statusDate: rewardPath.path("statusDate"),
    claimRestrictions: rewardPath.path("claimRestrictions"),
    withdrawalRestrictions: rewardPath.path("withdrawalRestrictions"),
    stakeNotReturned: rewardPath.path("typeSpecificFields.stakeNotReturned"),
    qualifyConditions: qualifyConditionsPath,
    usageConditions: rewardPath.path("usageConditions"),
    usageConditionsType: rewardPath.path("usageConditions.type"),
  } as const satisfies RewardFormPaths<
    RewardFormData,
    typeof qualifyConditionsPath
  >;

  return {
    paths,
    qualifyConditionsPath,
    usagePaths: buildRewardStandaloneUsagePaths(p),
    getQualifyConditionPaths: buildRewardQualifyConditionPathsGetter(p),
  };
};

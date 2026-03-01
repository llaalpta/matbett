import {
  rewardAnchorEventOptions,
  qualifyConditionAnchorEventOptions,
  type AnchorCatalog,
  type AnchorCatalogByType,
  type AnchorRefType,
} from "@matbett/shared";

type EntityType = AnchorCatalogByType["entityType"];

type PromotionEntities = Extract<
  AnchorCatalogByType,
  { entityType: "PROMOTION" }
>["entities"];
type PhaseEntities = Extract<AnchorCatalogByType, { entityType: "PHASE" }>["entities"];
type RewardEntities = Extract<AnchorCatalogByType, { entityType: "REWARD" }>["entities"];
type QualifyEntities = Extract<
  AnchorCatalogByType,
  { entityType: "QUALIFY_CONDITION" }
>["entities"];

export const buildAnchorRefKey = (
  entityType: EntityType,
  entityRefType: AnchorRefType,
  entityRef: string
): string => `${entityType}:${entityRefType}:${entityRef}`;

const mergeEntities = <T extends { entityRefType: AnchorRefType; entityRef: string }>(
  serverEntities: T[],
  draftEntities: T[],
  removedRefs: Set<string>,
  entityType: EntityType
): T[] => {
  const merged = new Map<string, T>();

  for (const entity of serverEntities) {
    const key = buildAnchorRefKey(entityType, entity.entityRefType, entity.entityRef);
    if (!removedRefs.has(key)) {
      merged.set(key, entity);
    }
  }

  for (const entity of draftEntities) {
    const key = buildAnchorRefKey(entityType, entity.entityRefType, entity.entityRef);
    if (!removedRefs.has(key) && !merged.has(key)) {
      merged.set(key, entity);
    }
  }

  return Array.from(merged.values());
};

export interface MergeAnchorCatalogInput {
  serverCatalog?: AnchorCatalog;
  draftCatalog?: AnchorCatalog;
  removedRefs?: Set<string>;
}

interface DraftEntityRef {
  id?: string;
  clientId?: string;
}

interface DraftQualifyCondition extends DraftEntityRef {
  type?: string;
  description?: string | null;
}

interface DraftReward extends DraftEntityRef {
  type?: string;
  qualifyConditions?: DraftQualifyCondition[];
}

const getDraftRef = (
  entity: DraftEntityRef
): { entityRefType: AnchorRefType; entityRef: string } | null => {
  if (entity.id) {
    return { entityRefType: "persisted", entityRef: entity.id };
  }
  if (entity.clientId) {
    return { entityRefType: "client", entityRef: entity.clientId };
  }
  return null;
};

export const mergeAnchorCatalogs = ({
  serverCatalog,
  draftCatalog,
  removedRefs,
}: MergeAnchorCatalogInput): AnchorCatalog => {
  const removed = removedRefs ?? new Set<string>();

  const serverPromotion =
    serverCatalog?.find(
      (group): group is Extract<AnchorCatalogByType, { entityType: "PROMOTION" }> =>
        group.entityType === "PROMOTION"
    )?.entities ?? [];
  const serverPhase =
    serverCatalog?.find(
      (group): group is Extract<AnchorCatalogByType, { entityType: "PHASE" }> =>
        group.entityType === "PHASE"
    )?.entities ?? [];
  const serverReward =
    serverCatalog?.find(
      (group): group is Extract<AnchorCatalogByType, { entityType: "REWARD" }> =>
        group.entityType === "REWARD"
    )?.entities ?? [];
  const serverQualify =
    serverCatalog?.find(
      (group): group is Extract<AnchorCatalogByType, { entityType: "QUALIFY_CONDITION" }> =>
        group.entityType === "QUALIFY_CONDITION"
    )?.entities ?? [];

  const draftPromotion =
    draftCatalog?.find(
      (group): group is Extract<AnchorCatalogByType, { entityType: "PROMOTION" }> =>
        group.entityType === "PROMOTION"
    )?.entities ?? [];
  const draftPhase =
    draftCatalog?.find(
      (group): group is Extract<AnchorCatalogByType, { entityType: "PHASE" }> =>
        group.entityType === "PHASE"
    )?.entities ?? [];
  const draftReward =
    draftCatalog?.find(
      (group): group is Extract<AnchorCatalogByType, { entityType: "REWARD" }> =>
        group.entityType === "REWARD"
    )?.entities ?? [];
  const draftQualify =
    draftCatalog?.find(
      (group): group is Extract<AnchorCatalogByType, { entityType: "QUALIFY_CONDITION" }> =>
        group.entityType === "QUALIFY_CONDITION"
    )?.entities ?? [];

  const mergedPromotion = mergeEntities<PromotionEntities[number]>(
    [...serverPromotion],
    [...draftPromotion],
    removed,
    "PROMOTION"
  );
  const mergedPhase = mergeEntities<PhaseEntities[number]>(
    [...serverPhase],
    [...draftPhase],
    removed,
    "PHASE"
  );
  const mergedReward = mergeEntities<RewardEntities[number]>(
    [...serverReward],
    [...draftReward],
    removed,
    "REWARD"
  );
  const mergedQualify = mergeEntities<QualifyEntities[number]>(
    [...serverQualify],
    [...draftQualify],
    removed,
    "QUALIFY_CONDITION"
  );

  const result: AnchorCatalog = [];
  if (mergedPromotion.length > 0) {
    result.push({
      entityType: "PROMOTION",
      entityTypeLabel: "Promotion",
      entities: mergedPromotion,
    });
  }
  if (mergedPhase.length > 0) {
    result.push({
      entityType: "PHASE",
      entityTypeLabel: "Phases",
      entities: mergedPhase,
    });
  }
  if (mergedReward.length > 0) {
    result.push({
      entityType: "REWARD",
      entityTypeLabel: "Rewards",
      entities: mergedReward,
    });
  }
  if (mergedQualify.length > 0) {
    result.push({
      entityType: "QUALIFY_CONDITION",
      entityTypeLabel: "Qualify Conditions",
      entities: mergedQualify,
    });
  }

  return result;
};

export const buildRewardDraftAnchorCatalog = (
  reward: DraftReward | undefined,
  rewardLabel: string
): AnchorCatalog => {
  if (!reward) {
    return [];
  }

  const rewardRef = getDraftRef(reward);
  const rewardEntities: RewardEntities = [];
  const qualifyEntities: QualifyEntities = [];

  if (rewardRef) {
    rewardEntities.push({
      entityRefType: rewardRef.entityRefType,
      entityRef: rewardRef.entityRef,
      entityLabel: rewardLabel,
      events: rewardAnchorEventOptions.map((option) => ({
        event: option.value,
        eventLabel: option.label,
      })),
    });
  }

  for (const qc of reward.qualifyConditions ?? []) {
    const qcRef = getDraftRef(qc);
    if (!qcRef) {
      continue;
    }
    qualifyEntities.push({
      entityRefType: qcRef.entityRefType,
      entityRef: qcRef.entityRef,
      entityLabel: qc.description || `${qc.type} Condition`,
      events: qualifyConditionAnchorEventOptions.map((option) => ({
        event: option.value,
        eventLabel: option.label,
      })),
    });
  }

  const draftCatalog: AnchorCatalog = [];
  if (rewardEntities.length > 0) {
    draftCatalog.push({
      entityType: "REWARD",
      entityTypeLabel: "Rewards",
      entities: rewardEntities,
    });
  }
  if (qualifyEntities.length > 0) {
    draftCatalog.push({
      entityType: "QUALIFY_CONDITION",
      entityTypeLabel: "Qualify Conditions",
      entities: qualifyEntities,
    });
  }
  return draftCatalog;
};

export const buildQualifyConditionDraftAnchorCatalog = (
  qualifyCondition: DraftQualifyCondition | undefined
): AnchorCatalog => {
  if (!qualifyCondition) {
    return [];
  }

  const qualifyRef = getDraftRef(qualifyCondition);
  if (!qualifyRef) {
    return [];
  }

  return [
    {
      entityType: "QUALIFY_CONDITION",
      entityTypeLabel: "Qualify Conditions",
      entities: [
        {
          entityRefType: qualifyRef.entityRefType,
          entityRef: qualifyRef.entityRef,
          entityLabel:
            qualifyCondition.description ||
            `${qualifyCondition.type ?? "UNKNOWN"} Condition`,
          events: qualifyConditionAnchorEventOptions.map((option) => ({
            event: option.value,
            eventLabel: option.label,
          })),
        },
      ],
    },
  ];
};

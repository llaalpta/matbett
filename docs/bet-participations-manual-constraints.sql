-- Manual SQL complementario a la migracion de Fase 2.
-- Prisma no soporta CHECK constraints, partial unique indexes ni GIN indexes.

ALTER TABLE "bet_registration_batches"
  ADD CONSTRAINT "bet_registration_batches_strategy_none_check"
  CHECK (
    ("strategyKind" = 'NONE' AND "strategyType" IS NULL AND "lineMode" IS NULL AND "mode" IS NULL
      AND "dutchingOptionsCount" IS NULL AND "hedgeAdjustmentType" IS NULL
      AND "scenarioId" IS NULL AND "calculationParticipationId" IS NULL)
    OR
    ("strategyKind" = 'HEDGE' AND "strategyType" IS NOT NULL AND "lineMode" IS NOT NULL AND "mode" IS NOT NULL)
  );

ALTER TABLE "bet_registration_batches"
  ADD CONSTRAINT "bet_registration_batches_adjustment_single_check"
  CHECK (
    "hedgeAdjustmentType" IS NULL
    OR "lineMode" = 'SINGLE'
  );

ALTER TABLE "bets"
  ADD CONSTRAINT "bets_legRole_check"
  CHECK (
    "legRole" IS NULL
    OR "legRole" IN ('MAIN', 'HEDGE1', 'HEDGE2', 'HEDGE3')
  );

ALTER TABLE "bet_participations"
  ADD CONSTRAINT "bet_participations_kind_check"
  CHECK ("kind" IN ('QUALIFY_TRACKING', 'REWARD_USAGE'));

ALTER TABLE "bet_participations"
  ADD CONSTRAINT "bet_participations_reward_usage_shape_check"
  CHECK (
    ("kind" <> 'REWARD_USAGE')
    OR (
      "rewardId" IS NOT NULL
      AND "usageTrackingId" IS NOT NULL
      AND "qualifyConditionId" IS NULL
      AND COALESCE(array_length("rewardIds", 1), 0) = 0
      AND "calculationRewardId" IS NULL
    )
  );

ALTER TABLE "bet_participations"
  ADD CONSTRAINT "bet_participations_qualify_tracking_shape_check"
  CHECK (
    ("kind" <> 'QUALIFY_TRACKING')
    OR (
      "qualifyConditionId" IS NOT NULL
      AND "rewardId" IS NULL
      AND "usageTrackingId" IS NULL
      AND COALESCE(array_length("rewardIds", 1), 0) > 0
      AND "calculationRewardId" IS NOT NULL
    )
  );

CREATE UNIQUE INDEX "bets_batchId_legRole_not_null_key"
  ON "bets"("batchId", "legRole")
  WHERE "legRole" IS NOT NULL;

CREATE UNIQUE INDEX "bet_participations_qt_unique_per_bet_key"
  ON "bet_participations"("betId", "kind", "qualifyConditionId")
  WHERE "kind" = 'QUALIFY_TRACKING' AND "qualifyConditionId" IS NOT NULL;

CREATE UNIQUE INDEX "bet_participations_ru_unique_per_bet_key"
  ON "bet_participations"("betId", "kind", "usageTrackingId")
  WHERE "kind" = 'REWARD_USAGE' AND "usageTrackingId" IS NOT NULL;

CREATE UNIQUE INDEX "bet_participations_qt_contributes_unique_key"
  ON "bet_participations"("batchId", "qualifyConditionId")
  WHERE "kind" = 'QUALIFY_TRACKING' AND "contributesToTracking" = true AND "qualifyConditionId" IS NOT NULL;

CREATE UNIQUE INDEX "bet_participations_ru_contributes_unique_key"
  ON "bet_participations"("batchId", "usageTrackingId")
  WHERE "kind" = 'REWARD_USAGE' AND "contributesToTracking" = true AND "usageTrackingId" IS NOT NULL;

CREATE INDEX "bet_participations_rewardIds_gin_idx"
  ON "bet_participations"
  USING GIN ("rewardIds");

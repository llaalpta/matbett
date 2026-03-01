DROP TABLE IF EXISTS "bet_participations";
DROP TABLE IF EXISTS "bets";

CREATE TABLE "bet_registration_batches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "strategyKind" TEXT NOT NULL,
    "strategyType" TEXT,
    "lineMode" TEXT,
    "mode" TEXT,
    "dutchingOptionsCount" INTEGER,
    "hedgeAdjustmentType" TEXT,
    "scenarioId" TEXT,
    "calculationParticipationId" TEXT,
    "events" JSONB NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL,
    "risk" DOUBLE PRECISION NOT NULL,
    "yield" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bet_registration_batches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bets" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "bookmakerAccountId" TEXT NOT NULL,
    "legRole" TEXT,
    "legOrder" INTEGER NOT NULL,
    "selections" JSONB NOT NULL,
    "odds" DOUBLE PRECISION NOT NULL,
    "stake" DOUBLE PRECISION NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "enhancedOdds" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "profit" DOUBLE PRECISION NOT NULL,
    "risk" DOUBLE PRECISION NOT NULL,
    "yield" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "placedAt" TIMESTAMP(3) NOT NULL,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bet_participations" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "betId" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "phaseId" TEXT,
    "rewardId" TEXT,
    "rewardIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "calculationRewardId" TEXT,
    "rewardType" TEXT NOT NULL,
    "qualifyConditionId" TEXT,
    "usageTrackingId" TEXT,
    "contributesToTracking" BOOLEAN NOT NULL DEFAULT false,
    "stakeAmount" DOUBLE PRECISION,
    "rolloverContribution" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bet_participations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bet_registration_batches_userId_strategyKind_idx" ON "bet_registration_batches"("userId", "strategyKind");
CREATE INDEX "bet_registration_batches_scenarioId_idx" ON "bet_registration_batches"("scenarioId");
CREATE INDEX "bet_registration_batches_calculationParticipationId_idx" ON "bet_registration_batches"("calculationParticipationId");

CREATE UNIQUE INDEX "bets_batchId_legRole_key" ON "bets"("batchId", "legRole");
CREATE UNIQUE INDEX "bets_batchId_legOrder_key" ON "bets"("batchId", "legOrder");
CREATE INDEX "bets_userId_bookmakerAccountId_idx" ON "bets"("userId", "bookmakerAccountId");
CREATE INDEX "bets_batchId_idx" ON "bets"("batchId");
CREATE INDEX "bets_bookmakerAccountId_idx" ON "bets"("bookmakerAccountId");

CREATE INDEX "bet_participations_batchId_idx" ON "bet_participations"("batchId");
CREATE INDEX "bet_participations_betId_idx" ON "bet_participations"("betId");
CREATE INDEX "bet_participations_kind_promotionId_idx" ON "bet_participations"("kind", "promotionId");
CREATE INDEX "bet_participations_rewardId_kind_idx" ON "bet_participations"("rewardId", "kind");
CREATE INDEX "bet_participations_calculationRewardId_idx" ON "bet_participations"("calculationRewardId");
CREATE INDEX "bet_participations_phaseId_idx" ON "bet_participations"("phaseId");
CREATE INDEX "bet_participations_qualifyConditionId_idx" ON "bet_participations"("qualifyConditionId");
CREATE INDEX "bet_participations_usageTrackingId_idx" ON "bet_participations"("usageTrackingId");

ALTER TABLE "bet_registration_batches"
    ADD CONSTRAINT "bet_registration_batches_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bets"
    ADD CONSTRAINT "bets_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "bet_registration_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bets"
    ADD CONSTRAINT "bets_bookmakerAccountId_fkey"
    FOREIGN KEY ("bookmakerAccountId") REFERENCES "bookmaker_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bets"
    ADD CONSTRAINT "bets_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bet_participations"
    ADD CONSTRAINT "bet_participations_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "bet_registration_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bet_participations"
    ADD CONSTRAINT "bet_participations_betId_fkey"
    FOREIGN KEY ("betId") REFERENCES "bets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bet_participations"
    ADD CONSTRAINT "bet_participations_promotionId_fkey"
    FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bet_participations"
    ADD CONSTRAINT "bet_participations_phaseId_fkey"
    FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bet_participations"
    ADD CONSTRAINT "bet_participations_rewardId_fkey"
    FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bet_participations"
    ADD CONSTRAINT "bet_participations_calculationRewardId_fkey"
    FOREIGN KEY ("calculationRewardId") REFERENCES "rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bet_participations"
    ADD CONSTRAINT "bet_participations_qualifyConditionId_fkey"
    FOREIGN KEY ("qualifyConditionId") REFERENCES "reward_qualify_conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bet_participations"
    ADD CONSTRAINT "bet_participations_usageTrackingId_fkey"
    FOREIGN KEY ("usageTrackingId") REFERENCES "reward_usage_trackings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bet_registration_batches"
    ADD CONSTRAINT "bet_registration_batches_calculationParticipationId_fkey"
    FOREIGN KEY ("calculationParticipationId") REFERENCES "bet_participations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

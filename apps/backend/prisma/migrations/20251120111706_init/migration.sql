-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "bookmaker" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "timeframe" JSONB NOT NULL,
    "cardinality" TEXT NOT NULL DEFAULT 'SINGLE',
    "activationMethod" TEXT NOT NULL DEFAULT 'AUTOMATIC',
    "activatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "timeframe" JSONB NOT NULL,
    "activationMethod" TEXT NOT NULL DEFAULT 'AUTOMATIC',
    "activatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "promotionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "valueType" TEXT NOT NULL DEFAULT 'FIXED',
    "activationMethod" TEXT NOT NULL DEFAULT 'AUTOMATIC',
    "claimMethod" TEXT NOT NULL DEFAULT 'AUTOMATIC',
    "status" TEXT NOT NULL DEFAULT 'QUALIFYING',
    "qualifyConditionsFulfilledAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "useStartedAt" TIMESTAMP(3),
    "useCompletedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "phaseId" TEXT NOT NULL,
    "usageConditions" JSONB,
    "usageTracking" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_qualify_conditions" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "contributesToRewardValue" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB NOT NULL,
    "phaseId" TEXT NOT NULL,
    "trackingData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_qualify_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" TEXT NOT NULL,
    "bookmaker" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "code" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "qualifyConditionId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bets" (
    "id" TEXT NOT NULL,
    "bookmaker" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "role" TEXT,
    "eventName" TEXT NOT NULL,
    "marketName" TEXT NOT NULL,
    "selectionName" TEXT NOT NULL,
    "odds" DOUBLE PRECISION NOT NULL,
    "stake" DOUBLE PRECISION NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "profit" DOUBLE PRECISION,
    "liability" DOUBLE PRECISION,
    "qualifyConditionId" TEXT,
    "hedgeGroupId" TEXT,
    "parentBetId" TEXT,
    "userId" TEXT NOT NULL,
    "placedAt" TIMESTAMP(3) NOT NULL,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RewardToQualifyConditions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RewardToQualifyConditions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "promotions_userId_status_idx" ON "promotions"("userId", "status");

-- CreateIndex
CREATE INDEX "promotions_bookmaker_idx" ON "promotions"("bookmaker");

-- CreateIndex
CREATE INDEX "phases_promotionId_status_idx" ON "phases"("promotionId", "status");

-- CreateIndex
CREATE INDEX "rewards_phaseId_status_idx" ON "rewards"("phaseId", "status");

-- CreateIndex
CREATE INDEX "rewards_type_idx" ON "rewards"("type");

-- CreateIndex
CREATE INDEX "reward_qualify_conditions_phaseId_status_idx" ON "reward_qualify_conditions"("phaseId", "status");

-- CreateIndex
CREATE INDEX "reward_qualify_conditions_type_idx" ON "reward_qualify_conditions"("type");

-- CreateIndex
CREATE INDEX "deposits_userId_bookmaker_idx" ON "deposits"("userId", "bookmaker");

-- CreateIndex
CREATE INDEX "deposits_qualifyConditionId_idx" ON "deposits"("qualifyConditionId");

-- CreateIndex
CREATE INDEX "deposits_date_idx" ON "deposits"("date");

-- CreateIndex
CREATE INDEX "bets_userId_bookmaker_idx" ON "bets"("userId", "bookmaker");

-- CreateIndex
CREATE INDEX "bets_hedgeGroupId_idx" ON "bets"("hedgeGroupId");

-- CreateIndex
CREATE INDEX "bets_qualifyConditionId_idx" ON "bets"("qualifyConditionId");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- CreateIndex
CREATE INDEX "_RewardToQualifyConditions_B_index" ON "_RewardToQualifyConditions"("B");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phases" ADD CONSTRAINT "phases_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_qualify_conditions" ADD CONSTRAINT "reward_qualify_conditions_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_qualifyConditionId_fkey" FOREIGN KEY ("qualifyConditionId") REFERENCES "reward_qualify_conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_qualifyConditionId_fkey" FOREIGN KEY ("qualifyConditionId") REFERENCES "reward_qualify_conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_parentBetId_fkey" FOREIGN KEY ("parentBetId") REFERENCES "bets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RewardToQualifyConditions" ADD CONSTRAINT "_RewardToQualifyConditions_A_fkey" FOREIGN KEY ("A") REFERENCES "rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RewardToQualifyConditions" ADD CONSTRAINT "_RewardToQualifyConditions_B_fkey" FOREIGN KEY ("B") REFERENCES "reward_qualify_conditions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

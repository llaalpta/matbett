/*
  Warnings:

  - You are about to drop the column `qualifyConditionId` on the `bets` table. All the data in the column will be lost.
  - You are about to drop the column `usageTrackingId` on the `bets` table. All the data in the column will be lost.
  - You are about to drop the column `qualifyConditionId` on the `deposits` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "bets" DROP CONSTRAINT "bets_qualifyConditionId_fkey";

-- DropForeignKey
ALTER TABLE "bets" DROP CONSTRAINT "bets_usageTrackingId_fkey";

-- DropForeignKey
ALTER TABLE "deposits" DROP CONSTRAINT "deposits_qualifyConditionId_fkey";

-- DropIndex
DROP INDEX "bets_qualifyConditionId_idx";

-- DropIndex
DROP INDEX "bets_usageTrackingId_idx";

-- DropIndex
DROP INDEX "deposits_qualifyConditionId_idx";

-- AlterTable
ALTER TABLE "bets" DROP COLUMN "qualifyConditionId",
DROP COLUMN "usageTrackingId";

-- AlterTable
ALTER TABLE "deposits" DROP COLUMN "qualifyConditionId";

-- CreateTable
CREATE TABLE "bet_participations" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "betId" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "phaseId" TEXT,
    "rewardId" TEXT NOT NULL,
    "qualifyConditionId" TEXT,
    "usageTrackingId" TEXT,
    "countsAsAttempt" BOOLEAN,
    "isSuccessful" BOOLEAN,
    "stakeAmount" DOUBLE PRECISION,
    "rolloverContribution" DOUBLE PRECISION,
    "progressAfter" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bet_participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_participations" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "depositId" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "phaseId" TEXT,
    "rewardId" TEXT,
    "qualifyConditionId" TEXT NOT NULL,
    "countsAsQualification" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposit_participations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bet_participations_betId_idx" ON "bet_participations"("betId");

-- CreateIndex
CREATE INDEX "bet_participations_role_promotionId_idx" ON "bet_participations"("role", "promotionId");

-- CreateIndex
CREATE INDEX "bet_participations_rewardId_role_idx" ON "bet_participations"("rewardId", "role");

-- CreateIndex
CREATE INDEX "bet_participations_phaseId_idx" ON "bet_participations"("phaseId");

-- CreateIndex
CREATE INDEX "bet_participations_qualifyConditionId_idx" ON "bet_participations"("qualifyConditionId");

-- CreateIndex
CREATE INDEX "bet_participations_usageTrackingId_idx" ON "bet_participations"("usageTrackingId");

-- CreateIndex
CREATE INDEX "deposit_participations_depositId_idx" ON "deposit_participations"("depositId");

-- CreateIndex
CREATE INDEX "deposit_participations_role_promotionId_idx" ON "deposit_participations"("role", "promotionId");

-- CreateIndex
CREATE INDEX "deposit_participations_phaseId_idx" ON "deposit_participations"("phaseId");

-- CreateIndex
CREATE INDEX "deposit_participations_rewardId_idx" ON "deposit_participations"("rewardId");

-- CreateIndex
CREATE INDEX "deposit_participations_qualifyConditionId_idx" ON "deposit_participations"("qualifyConditionId");

-- AddForeignKey
ALTER TABLE "bet_participations" ADD CONSTRAINT "bet_participations_betId_fkey" FOREIGN KEY ("betId") REFERENCES "bets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bet_participations" ADD CONSTRAINT "bet_participations_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bet_participations" ADD CONSTRAINT "bet_participations_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bet_participations" ADD CONSTRAINT "bet_participations_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bet_participations" ADD CONSTRAINT "bet_participations_qualifyConditionId_fkey" FOREIGN KEY ("qualifyConditionId") REFERENCES "reward_qualify_conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bet_participations" ADD CONSTRAINT "bet_participations_usageTrackingId_fkey" FOREIGN KEY ("usageTrackingId") REFERENCES "reward_usage_trackings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_participations" ADD CONSTRAINT "deposit_participations_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "deposits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_participations" ADD CONSTRAINT "deposit_participations_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_participations" ADD CONSTRAINT "deposit_participations_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_participations" ADD CONSTRAINT "deposit_participations_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_participations" ADD CONSTRAINT "deposit_participations_qualifyConditionId_fkey" FOREIGN KEY ("qualifyConditionId") REFERENCES "reward_qualify_conditions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

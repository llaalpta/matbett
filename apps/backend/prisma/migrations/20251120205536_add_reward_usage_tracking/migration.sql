/*
  Warnings:

  - You are about to drop the column `usageTracking` on the `rewards` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bets" ADD COLUMN     "usageTrackingId" TEXT;

-- AlterTable
ALTER TABLE "rewards" DROP COLUMN "usageTracking";

-- CreateTable
CREATE TABLE "reward_usage_trackings" (
    "id" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "usageData" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_usage_trackings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reward_usage_trackings_rewardId_key" ON "reward_usage_trackings"("rewardId");

-- CreateIndex
CREATE INDEX "reward_usage_trackings_rewardId_idx" ON "reward_usage_trackings"("rewardId");

-- CreateIndex
CREATE INDEX "reward_usage_trackings_type_status_idx" ON "reward_usage_trackings"("type", "status");

-- CreateIndex
CREATE INDEX "reward_usage_trackings_status_idx" ON "reward_usage_trackings"("status");

-- CreateIndex
CREATE INDEX "bets_usageTrackingId_idx" ON "bets"("usageTrackingId");

-- AddForeignKey
ALTER TABLE "reward_usage_trackings" ADD CONSTRAINT "reward_usage_trackings_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_usageTrackingId_fkey" FOREIGN KEY ("usageTrackingId") REFERENCES "reward_usage_trackings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

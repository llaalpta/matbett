/*
  Warnings:

  - You are about to drop the column `phaseId` on the `reward_qualify_conditions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "reward_qualify_conditions" DROP CONSTRAINT "reward_qualify_conditions_phaseId_fkey";

-- DropIndex
DROP INDEX "reward_qualify_conditions_phaseId_status_idx";

-- DropIndex
DROP INDEX "rewards_phaseId_status_idx";

-- AlterTable
ALTER TABLE "reward_qualify_conditions" DROP COLUMN "phaseId";

-- CreateIndex
CREATE INDEX "rewards_phaseId_idx" ON "rewards"("phaseId");

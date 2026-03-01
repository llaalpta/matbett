/*
  Warnings:

  - Added the required column `timeframe` to the `reward_qualify_conditions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeframe` to the `rewards` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "deposits" ADD COLUMN     "promotionContext" JSONB;

-- AlterTable
ALTER TABLE "reward_qualify_conditions" ADD COLUMN     "dependsOnQualifyConditionId" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "expiredAt" TIMESTAMP(3),
ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "qualifiedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "timeframe" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "rewards" ADD COLUMN     "timeframe" JSONB NOT NULL;

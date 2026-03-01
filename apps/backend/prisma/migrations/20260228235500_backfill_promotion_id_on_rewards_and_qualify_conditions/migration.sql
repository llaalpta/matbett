/*
  Warnings:

  - This migration aligns DB structure with current Prisma schema by adding
    `promotionId` to `rewards` and `reward_qualify_conditions`.
  - Existing rows are backfilled from their current `phaseId -> phases.promotionId`.
*/

-- AlterTable
ALTER TABLE "rewards"
ADD COLUMN "promotionId" TEXT;

-- AlterTable
ALTER TABLE "reward_qualify_conditions"
ADD COLUMN "promotionId" TEXT;

-- Backfill from existing phase relation
UPDATE "rewards" AS r
SET "promotionId" = p."promotionId"
FROM "phases" AS p
WHERE r."phaseId" = p."id"
  AND r."promotionId" IS NULL;

-- Backfill from existing phase relation
UPDATE "reward_qualify_conditions" AS qc
SET "promotionId" = p."promotionId"
FROM "phases" AS p
WHERE qc."phaseId" = p."id"
  AND qc."promotionId" IS NULL;

-- Safety checks before NOT NULL
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "rewards" WHERE "promotionId" IS NULL) THEN
    RAISE EXCEPTION 'Cannot set rewards.promotionId NOT NULL: unresolved rows exist';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "reward_qualify_conditions" WHERE "promotionId" IS NULL) THEN
    RAISE EXCEPTION 'Cannot set reward_qualify_conditions.promotionId NOT NULL: unresolved rows exist';
  END IF;
END $$;

-- AlterTable
ALTER TABLE "rewards"
ALTER COLUMN "promotionId" SET NOT NULL;

-- AlterTable
ALTER TABLE "reward_qualify_conditions"
ALTER COLUMN "promotionId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "rewards_promotionId_status_idx" ON "rewards"("promotionId", "status");

-- CreateIndex
CREATE INDEX "reward_qualify_conditions_promotionId_status_idx"
ON "reward_qualify_conditions"("promotionId", "status");

-- AddForeignKey
ALTER TABLE "rewards"
ADD CONSTRAINT "rewards_promotionId_fkey"
FOREIGN KEY ("promotionId") REFERENCES "promotions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_qualify_conditions"
ADD CONSTRAINT "reward_qualify_conditions_promotionId_fkey"
FOREIGN KEY ("promotionId") REFERENCES "promotions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

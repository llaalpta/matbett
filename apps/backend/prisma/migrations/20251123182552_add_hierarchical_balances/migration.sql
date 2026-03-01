-- AlterTable
ALTER TABLE "phases" ADD COLUMN     "totalBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "promotions" ADD COLUMN     "totalBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "reward_qualify_conditions" ADD COLUMN     "balance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "reward_usage_trackings" ADD COLUMN     "balance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "rewards" ADD COLUMN     "totalBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

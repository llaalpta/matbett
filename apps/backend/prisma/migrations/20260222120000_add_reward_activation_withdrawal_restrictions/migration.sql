-- Add reward-level restrictions shared across all reward types.
ALTER TABLE "rewards"
ADD COLUMN "activationRestrictions" TEXT,
ADD COLUMN "withdrawalRestrictions" TEXT;

ALTER TABLE "bookmaker_accounts"
  ADD COLUMN IF NOT EXISTS "accountType" TEXT;

ALTER TABLE "bookmaker_accounts"
  ALTER COLUMN "accountType" SET DEFAULT 'SPORTSBOOK';

ALTER TABLE "promotions"
  ADD COLUMN IF NOT EXISTS "bookmakerAccountId" TEXT;

ALTER TABLE "deposits"
  ADD COLUMN IF NOT EXISTS "bookmakerAccountId" TEXT;

UPDATE "bookmaker_accounts"
SET "bookmaker" = CASE "bookmaker"
  WHEN 'bookmaker1' THEN '888sports'
  WHEN 'bookmaker2' THEN 'Admiralbet'
  WHEN 'bookmaker3' THEN 'Bet365'
  WHEN 'bookmaker4' THEN 'Betfair Exchange'
  WHEN 'bookmaker5' THEN 'Betfair Sportbook'
  WHEN 'bookmaker6' THEN 'Betway'
  WHEN 'bookmaker7' THEN 'Bwin'
  WHEN 'bookmaker8' THEN 'Casumo'
  WHEN 'bookmaker9' THEN 'Codere'
  WHEN 'bookmaker10' THEN 'Efbet'
  WHEN 'bookmaker11' THEN 'Goldenpark'
  WHEN 'bookmaker12' THEN 'Jokerbet'
  WHEN 'bookmaker13' THEN 'Juegging'
  WHEN 'bookmaker14' THEN 'Kirolbet'
  WHEN 'bookmaker15' THEN 'Leovegas'
  WHEN 'bookmaker16' THEN 'Luckia'
  WHEN 'bookmaker17' THEN 'Marathonbet'
  WHEN 'bookmaker18' THEN 'Marcaapuestas'
  WHEN 'bookmaker19' THEN 'Paf'
  WHEN 'bookmaker20' THEN 'Paston'
  WHEN 'bookmaker21' THEN 'Pokerstars'
  WHEN 'bookmaker22' THEN 'Retabet'
  WHEN 'bookmaker23' THEN 'Sportium'
  WHEN 'bookmaker24' THEN 'Versus'
  WHEN 'bookmaker25' THEN 'William Hill'
  WHEN 'bookmaker26' THEN 'Winamax'
  WHEN 'bookmaker27' THEN 'Yaass'
  WHEN 'bookmaker28' THEN 'Zebet'
  ELSE "bookmaker"
END;

UPDATE "promotions"
SET "bookmaker" = CASE "bookmaker"
  WHEN 'bookmaker1' THEN '888sports'
  WHEN 'bookmaker2' THEN 'Admiralbet'
  WHEN 'bookmaker3' THEN 'Bet365'
  WHEN 'bookmaker4' THEN 'Betfair Exchange'
  WHEN 'bookmaker5' THEN 'Betfair Sportbook'
  WHEN 'bookmaker6' THEN 'Betway'
  WHEN 'bookmaker7' THEN 'Bwin'
  WHEN 'bookmaker8' THEN 'Casumo'
  WHEN 'bookmaker9' THEN 'Codere'
  WHEN 'bookmaker10' THEN 'Efbet'
  WHEN 'bookmaker11' THEN 'Goldenpark'
  WHEN 'bookmaker12' THEN 'Jokerbet'
  WHEN 'bookmaker13' THEN 'Juegging'
  WHEN 'bookmaker14' THEN 'Kirolbet'
  WHEN 'bookmaker15' THEN 'Leovegas'
  WHEN 'bookmaker16' THEN 'Luckia'
  WHEN 'bookmaker17' THEN 'Marathonbet'
  WHEN 'bookmaker18' THEN 'Marcaapuestas'
  WHEN 'bookmaker19' THEN 'Paf'
  WHEN 'bookmaker20' THEN 'Paston'
  WHEN 'bookmaker21' THEN 'Pokerstars'
  WHEN 'bookmaker22' THEN 'Retabet'
  WHEN 'bookmaker23' THEN 'Sportium'
  WHEN 'bookmaker24' THEN 'Versus'
  WHEN 'bookmaker25' THEN 'William Hill'
  WHEN 'bookmaker26' THEN 'Winamax'
  WHEN 'bookmaker27' THEN 'Yaass'
  WHEN 'bookmaker28' THEN 'Zebet'
  ELSE "bookmaker"
END;

UPDATE "deposits"
SET "bookmaker" = CASE "bookmaker"
  WHEN 'bookmaker1' THEN '888sports'
  WHEN 'bookmaker2' THEN 'Admiralbet'
  WHEN 'bookmaker3' THEN 'Bet365'
  WHEN 'bookmaker4' THEN 'Betfair Exchange'
  WHEN 'bookmaker5' THEN 'Betfair Sportbook'
  WHEN 'bookmaker6' THEN 'Betway'
  WHEN 'bookmaker7' THEN 'Bwin'
  WHEN 'bookmaker8' THEN 'Casumo'
  WHEN 'bookmaker9' THEN 'Codere'
  WHEN 'bookmaker10' THEN 'Efbet'
  WHEN 'bookmaker11' THEN 'Goldenpark'
  WHEN 'bookmaker12' THEN 'Jokerbet'
  WHEN 'bookmaker13' THEN 'Juegging'
  WHEN 'bookmaker14' THEN 'Kirolbet'
  WHEN 'bookmaker15' THEN 'Leovegas'
  WHEN 'bookmaker16' THEN 'Luckia'
  WHEN 'bookmaker17' THEN 'Marathonbet'
  WHEN 'bookmaker18' THEN 'Marcaapuestas'
  WHEN 'bookmaker19' THEN 'Paf'
  WHEN 'bookmaker20' THEN 'Paston'
  WHEN 'bookmaker21' THEN 'Pokerstars'
  WHEN 'bookmaker22' THEN 'Retabet'
  WHEN 'bookmaker23' THEN 'Sportium'
  WHEN 'bookmaker24' THEN 'Versus'
  WHEN 'bookmaker25' THEN 'William Hill'
  WHEN 'bookmaker26' THEN 'Winamax'
  WHEN 'bookmaker27' THEN 'Yaass'
  WHEN 'bookmaker28' THEN 'Zebet'
  ELSE "bookmaker"
END;

UPDATE "bookmaker_accounts"
SET "accountType" = CASE
  WHEN "bookmaker" ILIKE '%exchange%' THEN 'EXCHANGE'
  ELSE 'SPORTSBOOK'
END
WHERE "accountType" IS NULL
   OR "accountType" NOT IN ('SPORTSBOOK', 'EXCHANGE');

INSERT INTO "bookmaker_accounts" (
  "id",
  "userId",
  "bookmaker",
  "accountType",
  "accountIdentifier",
  "realBalance",
  "bonusBalance",
  "freebetBalance",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy_account_' || SUBSTRING(md5(src."userId" || ':' || src."bookmaker") FROM 1 FOR 20),
  src."userId",
  src."bookmaker",
  CASE
    WHEN src."bookmaker" ILIKE '%exchange%' THEN 'EXCHANGE'
    ELSE 'SPORTSBOOK'
  END,
  'legacy',
  0,
  0,
  0,
  NOW(),
  NOW()
FROM (
  SELECT DISTINCT "userId", "bookmaker" FROM "promotions"
  UNION
  SELECT DISTINCT "userId", "bookmaker" FROM "deposits"
) AS src
LEFT JOIN "bookmaker_accounts" AS existing
  ON existing."userId" = src."userId"
 AND existing."bookmaker" = src."bookmaker"
WHERE existing."id" IS NULL;

UPDATE "promotions" AS promotion
SET "bookmakerAccountId" = account."id"
FROM "bookmaker_accounts" AS account
WHERE promotion."bookmakerAccountId" IS NULL
  AND account."userId" = promotion."userId"
  AND account."bookmaker" = promotion."bookmaker";

UPDATE "deposits" AS deposit
SET "bookmakerAccountId" = account."id"
FROM "bookmaker_accounts" AS account
WHERE deposit."bookmakerAccountId" IS NULL
  AND account."userId" = deposit."userId"
  AND account."bookmaker" = deposit."bookmaker";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "promotions"
    WHERE "bookmakerAccountId" IS NULL
  ) THEN
    RAISE EXCEPTION 'Unable to backfill promotions.bookmakerAccountId';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "deposits"
    WHERE "bookmakerAccountId" IS NULL
  ) THEN
    RAISE EXCEPTION 'Unable to backfill deposits.bookmakerAccountId';
  END IF;
END $$;

ALTER TABLE "bookmaker_accounts"
  ALTER COLUMN "accountType" SET NOT NULL;

ALTER TABLE "promotions"
  ALTER COLUMN "bookmakerAccountId" SET NOT NULL;

ALTER TABLE "deposits"
  ALTER COLUMN "bookmakerAccountId" SET NOT NULL;

DROP INDEX IF EXISTS "bookmaker_accounts_userId_bookmaker_key";

CREATE UNIQUE INDEX IF NOT EXISTS "bookmaker_accounts_userId_bookmaker_accountIdentifier_key"
  ON "bookmaker_accounts"("userId", "bookmaker", "accountIdentifier");

CREATE INDEX IF NOT EXISTS "bookmaker_accounts_userId_accountType_idx"
  ON "bookmaker_accounts"("userId", "accountType");

CREATE INDEX IF NOT EXISTS "promotions_bookmakerAccountId_idx"
  ON "promotions"("bookmakerAccountId");

CREATE INDEX IF NOT EXISTS "deposits_userId_bookmakerAccountId_idx"
  ON "deposits"("userId", "bookmakerAccountId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'promotions_bookmakerAccountId_fkey'
  ) THEN
    ALTER TABLE "promotions"
      ADD CONSTRAINT "promotions_bookmakerAccountId_fkey"
      FOREIGN KEY ("bookmakerAccountId")
      REFERENCES "bookmaker_accounts"("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'deposits_bookmakerAccountId_fkey'
  ) THEN
    ALTER TABLE "deposits"
      ADD CONSTRAINT "deposits_bookmakerAccountId_fkey"
      FOREIGN KEY ("bookmakerAccountId")
      REFERENCES "bookmaker_accounts"("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END $$;

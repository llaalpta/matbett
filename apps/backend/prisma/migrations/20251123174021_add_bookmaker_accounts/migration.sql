-- CreateTable
CREATE TABLE "bookmaker_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookmaker" TEXT NOT NULL,
    "accountIdentifier" TEXT NOT NULL,
    "realBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonusBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freebetBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookmaker_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookmaker_accounts_userId_idx" ON "bookmaker_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bookmaker_accounts_userId_bookmaker_key" ON "bookmaker_accounts"("userId", "bookmaker");

-- AddForeignKey
ALTER TABLE "bookmaker_accounts" ADD CONSTRAINT "bookmaker_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

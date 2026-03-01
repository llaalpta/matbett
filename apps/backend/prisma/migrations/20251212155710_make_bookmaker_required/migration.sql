/*
  Warnings:

  - Made the column `bookmaker` on table `promotions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "promotions" ALTER COLUMN "bookmaker" SET NOT NULL;

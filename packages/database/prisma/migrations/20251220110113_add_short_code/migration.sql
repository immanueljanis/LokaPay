/*
  Warnings:

  - A unique constraint covering the columns `[shortCode]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "shortCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "transactions_shortCode_key" ON "transactions"("shortCode");

-- CreateIndex
CREATE INDEX "transactions_shortCode_idx" ON "transactions"("shortCode");

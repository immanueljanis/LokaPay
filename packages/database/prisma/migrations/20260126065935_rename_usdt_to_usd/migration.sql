/*
  Warnings:

  - You are about to drop the column `amountReceivedUSDT` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `amountUSDT` on the `transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "rates" ALTER COLUMN "pair" SET DEFAULT 'USDC/IDR';

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "amountReceivedUSDT",
DROP COLUMN "amountUSDT",
ADD COLUMN     "amountReceivedUSD" DECIMAL(18,6) NOT NULL DEFAULT 0,
ADD COLUMN     "amountUSD" DECIMAL(18,6) NOT NULL DEFAULT 0;

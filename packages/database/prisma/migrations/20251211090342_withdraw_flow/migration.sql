-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'DETECTED', 'PARTIALLY_PAID', 'CONFIRMED', 'PAID', 'OVERPAID', 'EXPIRED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('REQUESTED', 'COMPLETED', 'REJECTED', 'FAILED');

-- CreateTable
CREATE TABLE "merchants" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "walletAddress" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankHolder" TEXT,
    "balanceIDR" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "amountRequested" DECIMAL(18,2) NOT NULL,
    "feeAdmin" DECIMAL(18,2) NOT NULL,
    "amountFinal" DECIMAL(18,2) NOT NULL,
    "toBankName" TEXT NOT NULL,
    "toBankAccount" TEXT NOT NULL,
    "toBankHolder" TEXT NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'REQUESTED',
    "proofImage" TEXT,
    "referenceNo" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "amountInvoice" DECIMAL(18,2) NOT NULL,
    "amountUSDT" DECIMAL(18,6) NOT NULL,
    "exchangeRate" DECIMAL(18,2) NOT NULL,
    "amountReceivedUSDT" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "amountReceivedIdr" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "tipIdr" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "feeApp" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "paymentAddress" TEXT NOT NULL,
    "salt" TEXT,
    "isDeployed" BOOLEAN NOT NULL DEFAULT false,
    "gelatoTaskId" TEXT,
    "network" TEXT NOT NULL,
    "txHash" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "sweptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rates" (
    "id" SERIAL NOT NULL,
    "pair" TEXT NOT NULL DEFAULT 'USDT/IDR',
    "rate" DECIMAL(18,2) NOT NULL,
    "source" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "merchants_email_key" ON "merchants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_paymentAddress_key" ON "transactions"("paymentAddress");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_salt_key" ON "transactions"("salt");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_paymentAddress_idx" ON "transactions"("paymentAddress");

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

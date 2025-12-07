-- Migration: Add new transaction fields for better reporting
-- Run this migration after updating schema.prisma

-- Add new fields
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS "amountInvoice" DECIMAL(18, 2),
ADD COLUMN IF NOT EXISTS "amountReceivedUSDT" DECIMAL(18, 6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "amountReceivedIdr" DECIMAL(18, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "tipIdr" DECIMAL(18, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "feeApp" DECIMAL(18, 2) DEFAULT 0;

-- Migrate existing data
UPDATE transactions 
SET 
  "amountInvoice" = "amountIDR",
  "amountReceivedUSDT" = COALESCE("amountReceived", 0),
  "amountReceivedIdr" = CASE 
    WHEN "amountReceived" > 0 AND "exchangeRate" > 0 
    THEN FLOOR("amountReceived" * "exchangeRate")
    ELSE 0
  END,
  "feeApp" = CASE 
    WHEN "amountIDR" > 0 
    THEN "amountIDR" * 0.015
    ELSE 0
  END
WHERE "amountInvoice" IS NULL;

-- Make amountInvoice NOT NULL after migration
ALTER TABLE transactions 
ALTER COLUMN "amountInvoice" SET NOT NULL;


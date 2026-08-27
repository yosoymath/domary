CREATE TYPE "PaymentProvider" AS ENUM ('PAGBANK');

ALTER TABLE "orders"
ADD COLUMN "paymentProvider" "PaymentProvider",
ADD COLUMN "checkoutRequestId" UUID,
ADD COLUMN "providerCheckoutId" TEXT,
ADD COLUMN "providerCheckoutUrl" TEXT,
ADD COLUMN "providerChargeId" TEXT,
ADD COLUMN "paymentMethod" TEXT,
ADD COLUMN "paymentStatusDetail" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "orders_checkoutRequestId_key" ON "orders"("checkoutRequestId");
CREATE UNIQUE INDEX "orders_providerCheckoutId_key" ON "orders"("providerCheckoutId");
CREATE UNIQUE INDEX "orders_providerChargeId_key" ON "orders"("providerChargeId");
CREATE INDEX "orders_paymentStatus_createdAt_idx" ON "orders"("paymentStatus", "createdAt");

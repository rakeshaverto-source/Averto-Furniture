-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "maxUses" INTEGER,
ADD COLUMN     "maxUsesPerCustomer" INTEGER;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE INDEX "orders_couponCode_idx" ON "orders"("couponCode");

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('new', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "adminNote" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "balancePaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "balancePaidAt" TIMESTAMP(3),
ADD COLUMN     "fulfillment" "FulfillmentStatus" NOT NULL DEFAULT 'new';

-- CreateIndex
CREATE INDEX "orders_fulfillment_idx" ON "orders"("fulfillment");

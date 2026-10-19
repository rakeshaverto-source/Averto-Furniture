-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "courierName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "expectedDelivery" DATE,
ADD COLUMN     "trackingNumber" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "trackingUrl" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "order_events" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fulfillment" "FulfillmentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_events_orderId_idx" ON "order_events"("orderId");

-- AddForeignKey
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

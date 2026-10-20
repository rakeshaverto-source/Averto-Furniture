-- AlterEnum
ALTER TYPE "FulfillmentStatus" ADD VALUE 'out_for_delivery';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliverySlot" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "driverName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "driverPhone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "vehicleNumber" TEXT NOT NULL DEFAULT '';

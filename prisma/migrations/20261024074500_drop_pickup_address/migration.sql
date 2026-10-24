-- The pickup point is now the driver app's first reading, so no address is typed for it
ALTER TABLE "orders" DROP COLUMN "pickupAddress";

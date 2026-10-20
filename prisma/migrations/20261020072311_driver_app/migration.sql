-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "driverId" TEXT,
ADD COLUMN     "driverLat" DOUBLE PRECISION,
ADD COLUMN     "driverLng" DOUBLE PRECISION,
ADD COLUMN     "driverLocationAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedLogins" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_sessions" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "drivers_phone_key" ON "drivers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "driver_sessions_tokenHash_key" ON "driver_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "driver_sessions_driverId_idx" ON "driver_sessions"("driverId");

-- CreateIndex
CREATE INDEX "orders_driverId_idx" ON "orders"("driverId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_sessions" ADD CONSTRAINT "driver_sessions_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

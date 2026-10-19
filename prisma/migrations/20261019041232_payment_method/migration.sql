-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('full', 'advance', 'cod');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'advance';

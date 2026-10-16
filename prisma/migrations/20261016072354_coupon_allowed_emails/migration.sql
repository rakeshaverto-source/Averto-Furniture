-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "allowedEmails" TEXT[] DEFAULT ARRAY[]::TEXT[];

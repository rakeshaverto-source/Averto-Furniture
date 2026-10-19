-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "landmark" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "locality" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "tehsil" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "landmark" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "locality" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "tehsil" TEXT NOT NULL DEFAULT '';

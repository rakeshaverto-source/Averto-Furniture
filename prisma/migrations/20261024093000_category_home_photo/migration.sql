-- AlterTable
ALTER TABLE "categories" ADD COLUMN "image" TEXT NOT NULL DEFAULT '',
ADD COLUMN "onHomePage" BOOLEAN NOT NULL DEFAULT true;

-- Keep the photos "Shop By Category" showed before it became an admin setting
UPDATE "categories" SET "image" = CASE "id"
  WHEN 'sofas' THEN '/hero/modular-sofa.jpg'
  WHEN 'seating' THEN '/hero/chair.jpg'
  WHEN 'dining' THEN '/hero/dining-table.jpg'
  WHEN 'beds' THEN '/hero/bed.jpg'
  WHEN 'storage' THEN '/hero/fluted-credenza.jpg'
  WHEN 'lighting' THEN '/hero/pendant-chandelier.jpg'
  WHEN 'tables' THEN '/hero/card-coffee.jpg'
  WHEN 'consoles' THEN '/hero/card-console.jpg'
  WHEN 'leather' THEN '/hero/saddle-chair.jpg'
  ELSE "image"
END;

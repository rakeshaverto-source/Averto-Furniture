-- AlterTable
ALTER TABLE "products" ADD COLUMN     "showcaseOrder" INTEGER NOT NULL DEFAULT 0;

-- The order the slider's slides had before it read the catalogue
UPDATE "products" SET "showcaseOrder" = CASE "id"
  WHEN 'saddle-leather-lounge-chair' THEN 1
  WHEN 'sculptural-boucle-chair' THEN 2
  WHEN 'monolith-slate-table' THEN 3
  WHEN 'aura-low-profile-bed' THEN 4
  ELSE 0 END
WHERE "inShowcase";

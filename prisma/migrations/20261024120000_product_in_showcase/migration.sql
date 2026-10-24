-- AlterTable
ALTER TABLE "products" ADD COLUMN     "inShowcase" BOOLEAN NOT NULL DEFAULT false;

-- The pieces the "Signature Monolith Editions" slider showed before it read the catalogue
UPDATE "products" SET "inShowcase" = true WHERE "id" IN (
  'saddle-leather-lounge-chair', 'sculptural-boucle-chair', 'monolith-slate-table', 'aura-low-profile-bed'
);

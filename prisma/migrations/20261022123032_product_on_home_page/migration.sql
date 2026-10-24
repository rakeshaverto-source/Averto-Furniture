-- AlterTable
ALTER TABLE "products" ADD COLUMN     "onHomePage" BOOLEAN NOT NULL DEFAULT false;

-- Keep the pieces the home page showed before this became an admin setting
UPDATE "products" SET "onHomePage" = true WHERE "id" IN (
  'monolith-slate-table', 'saddle-leather-lounge-chair', 'serpentine-modular-sofa',
  'aura-low-profile-bed', 'nero-marquina-credenza', 'solstice-chandelier'
);

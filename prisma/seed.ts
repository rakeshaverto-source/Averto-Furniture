// Copies the sample catalogue in prisma/sample-data/ into the database. Safe to run again: it clears the
// catalogue, coupon and sample-review tables first. Orders and real (non-sample) reviews are untouched.
// WARNING: re-seeding replaces the sample products, including any edits made to them in /admin.
// Only run it on a fresh database. Run with: npx prisma db seed
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { collectionCategories, collectionProducts } from "./sample-data/collections";
import { coupons } from "./sample-data/coupons";
import { productReviews } from "./sample-data/reviews";

config({ path: ".env.local", quiet: true });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
});

// Sample reviews carry dates like "March 2026"; store them as the 1st of that month.
function monthToDate(label: string) {
  const date = new Date(`1 ${label} UTC`);
  if (Number.isNaN(date.getTime())) throw new Error(`Unreadable review date: ${label}`);
  return date;
}

async function main() {
  const productIds = collectionProducts.map((p) => p.id);
  const realReviews = await prisma.review.count({
    where: { productId: { in: productIds }, isSample: false },
  });
  if (realReviews > 0) {
    throw new Error(`${realReviews} real reviews exist for these products; not re-seeding over them.`);
  }

  await prisma.$transaction([
    prisma.review.deleteMany({ where: { isSample: true } }),
    // Colours and images go with their product (onDelete: Cascade)
    prisma.product.deleteMany({ where: { id: { in: productIds } } }),
    prisma.category.deleteMany({ where: { id: { in: collectionCategories.map((c) => c.id) } } }),
    prisma.coupon.deleteMany({ where: { code: { in: coupons.map((c) => c.code) } } }),
  ]);

  await prisma.category.createMany({
    data: collectionCategories.map((c, i) => ({ id: c.id, name: c.name, blurb: c.blurb, sortOrder: i })),
  });

  for (const [i, p] of collectionProducts.entries()) {
    await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        categoryId: p.category,
        badge: p.badge,
        description: p.description,
        specs: p.specs,
        priceInr: p.priceInr,
        originalPriceInr: p.originalPriceInr,
        zoomClass: p.zoomClass,
        sortOrder: i,
        images: {
          create: [
            { path: p.image, label: p.name, sortOrder: 0 },
            ...(p.gallery ?? []).map((g, j) => ({
              path: g.src,
              label: g.label,
              fit: g.fit ?? "cover",
              sortOrder: j + 1,
            })),
          ],
        },
      },
    });

    for (const [j, c] of (p.colors ?? []).entries()) {
      await prisma.productColor.create({
        data: {
          productId: p.id,
          slug: c.id,
          name: c.name,
          hex: c.hex,
          priceDelta: c.priceDelta,
          sortOrder: j,
          images: c.image
            ? { create: { productId: p.id, path: c.image, label: `${p.name} in ${c.name}` } }
            : undefined,
        },
      });
    }
  }

  await prisma.coupon.createMany({
    data: coupons.map((c) => ({
      code: c.code.toUpperCase(),
      description: c.description,
      type: c.type,
      value: c.value,
      minOrder: c.minOrder,
      maxDiscount: c.maxDiscount,
    })),
  });

  const reviews = Object.entries(productReviews).flatMap(([productId, list]) =>
    list.map((r) => ({
      productId,
      name: r.name,
      location: r.location,
      rating: r.rating,
      title: r.title,
      text: r.text,
      status: "approved" as const,
      isSample: true,
      createdAt: monthToDate(r.date),
    })),
  );
  await prisma.review.createMany({ data: reviews });

  const counts = {
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    colors: await prisma.productColor.count(),
    images: await prisma.productImage.count(),
    coupons: await prisma.coupon.count(),
    sampleReviews: await prisma.review.count({ where: { isSample: true } }),
  };
  console.log("Seeded:", counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

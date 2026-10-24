// Reads the catalogue from the database and shapes it the way the site's components expect
// (src/data/collections.ts). Lists are cached for a few minutes so most page views never touch the
// database; call revalidateTag("catalog") or revalidateTag("reviews") after an edit to show it at once.
import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { CollectionCategory, CollectionProduct } from "@/data/collections";
import type { Coupon } from "@/data/coupons";
import type { ProductReview } from "@/data/reviews";

const CACHE_SECONDS = 300;

// Sample photos are files in /public ("/hero/x.jpg"); uploaded ones are paths in the "products" bucket.
export function imageUrl(path: string) {
  if (path.startsWith("/") || path.startsWith("http")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${path}`;
}

export const getCategories = unstable_cache(
  async (): Promise<CollectionCategory[]> =>
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, blurb: true },
    }),
  ["categories"],
  { revalidate: CACHE_SECONDS, tags: ["catalog"] },
);

export interface HomeCategory {
  id: string;
  name: string;
  image: string;
  designs: number; // active products in it
}

// "Shop By Category" on the home page: the categories ticked for it that have a photo
export const getHomeCategories = unstable_cache(
  async (): Promise<HomeCategory[]> => {
    const rows = await prisma.category.findMany({
      where: { onHomePage: true, image: { not: "" } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, image: true, _count: { select: { products: { where: { isActive: true } } } } },
    });
    return rows.map((c) => ({ id: c.id, name: c.name, image: imageUrl(c.image), designs: c._count.products }));
  },
  ["home-categories"],
  { revalidate: CACHE_SECONDS, tags: ["catalog"] },
);

// Every active product, in shop order. Fine as one list for a catalogue of a few hundred pieces.
export const getProducts = unstable_cache(
  async (): Promise<CollectionProduct[]> => {
    const rows = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        colors: { orderBy: { sortOrder: "asc" } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    return rows.flatMap((p): CollectionProduct[] => {
      const photos = p.images.filter((img) => !img.colorId);
      const main = photos[0] ?? p.images[0];
      if (!main) return []; // a product without any photo can't be shown yet

      return [
        {
          id: p.id,
          name: p.name,
          category: p.categoryId,
          badge: p.badge,
          description: p.description,
          specs: p.specs,
          priceInr: p.priceInr,
          originalPriceInr: p.originalPriceInr ?? undefined,
          deliveryMinDays: p.deliveryMinDays ?? undefined,
          deliveryMaxDays: p.deliveryMaxDays ?? undefined,
          image: imageUrl(main.path),
          gallery: photos
            .filter((img) => img !== main)
            .map((img) => ({ src: imageUrl(img.path), label: img.label, fit: img.fit })),
          colors: p.colors.length
            ? p.colors.map((c) => {
                const photo = p.images.find((img) => img.colorId === c.id);
                return {
                  id: c.slug,
                  name: c.name,
                  hex: c.hex,
                  priceDelta: c.priceDelta,
                  image: photo ? imageUrl(photo.path) : undefined,
                };
              })
            : undefined,
          zoomClass: p.zoomClass ?? undefined,
          seoTitle: p.seoTitle ?? undefined,
          seoDescription: p.seoDescription ?? undefined,
          onHomePage: p.onHomePage,
          inShowcase: p.inShowcase,
          showcaseOrder: p.showcaseOrder,
        },
      ];
    });
  },
  ["products"],
  { revalidate: CACHE_SECONDS, tags: ["catalog"] },
);

export async function getProduct(id: string) {
  return (await getProducts()).find((p) => p.id === id);
}

// Same-category pieces first, then the rest in catalogue order
export async function getRelatedProducts(product: CollectionProduct, count = 3) {
  const others = (await getProducts()).filter((p) => p.id !== product.id);
  const same = others.filter((p) => p.category === product.category);
  const rest = others.filter((p) => p.category !== product.category);
  return [...same, ...rest].slice(0, count);
}

const monthYear = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });

// Approved reviews only, newest first
export const getReviews = unstable_cache(
  async (productId: string): Promise<ProductReview[]> => {
    const rows = await prisma.review.findMany({
      where: { productId, status: "approved" },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      location: r.location,
      rating: r.rating,
      title: r.title,
      text: r.text,
      date: monthYear.format(r.createdAt),
      verified: r.verified,
      isSample: r.isSample,
      offline: r.offline,
    }));
  },
  ["reviews"],
  { revalidate: CACHE_SECONDS, tags: ["reviews"] },
);

export interface PopupReview {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  productId: string;
  productName: string;
  offline: boolean;
}

// The reviews popup: real customers only (never the invented sample reviews), 4 stars and up,
// on products that are on the shop
export const getPopupReviews = unstable_cache(
  async (): Promise<PopupReview[]> => {
    const rows = await prisma.review.findMany({
      where: { status: "approved", isSample: false, rating: { gte: 4 }, product: { isActive: true } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { product: { select: { name: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      // first name and initial only, e.g. "Gurpreet S."
      name: r.name.trim().split(/\s+/).slice(0, 2).map((w, i) => (i === 0 ? w : `${w[0]}.`)).join(" "),
      location: r.location,
      rating: r.rating,
      text: r.text.length > 120 ? `${r.text.slice(0, 117).trimEnd()}…` : r.text,
      productId: r.productId,
      productName: r.product.name,
      offline: r.offline,
    }));
  },
  ["popup-reviews"],
  { revalidate: CACHE_SECONDS, tags: ["reviews", "catalog"] },
);

// Not cached: switching a coupon off or letting it expire must take effect straight away.
export async function findCoupon(rawCode: string): Promise<Coupon | undefined> {
  const code = String(rawCode ?? "").trim().toUpperCase();
  if (!code) return undefined;
  const row = await prisma.coupon.findUnique({ where: { code } });
  if (!row || !row.isActive || (row.expiresAt && row.expiresAt < new Date())) return undefined;
  return {
    code: row.code,
    description: row.description,
    type: row.type,
    value: row.value,
    minOrder: row.minOrder ?? undefined,
    maxDiscount: row.maxDiscount ?? undefined,
    allowedEmails: row.allowedEmails,
    maxUses: row.maxUses ?? undefined,
    maxUsesPerCustomer: row.maxUsesPerCustomer ?? undefined,
  };
}

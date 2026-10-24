// schema.org objects for <JsonLd>: the business, products, breadcrumbs and blog posts. Google uses
// these for rich results (price, rating, breadcrumbs). Validate with search.google.com/test/rich-results.
import "server-only";
import { BUSINESS } from "@/data/business";
import type { CollectionProduct } from "@/data/collections";
import { absoluteUrl, SITE_URL } from "@/lib/seo";

// Business details still marked PLACEHOLDER (src/data/business.ts) are left out rather than published
const real = (value: string) => (/placeholder|99999/i.test(value) ? undefined : value);

export function organizationLd(siteName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    "@id": `${SITE_URL}/#store`,
    name: siteName,
    url: SITE_URL,
    logo: absoluteUrl("/averto-logo.png"),
    image: absoluteUrl("/hero/curated-living-space.jpg"),
    email: real(BUSINESS.email),
    telephone: real(BUSINESS.phone),
    address: real(BUSINESS.address),
    priceRange: "₹₹₹",
  };
}

export function websiteLd(siteName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: siteName,
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#store` },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

// Only reviews from real customers count towards the rating; sample reviews are never published here
export function productLd(
  product: CollectionProduct,
  description: string,
  reviews: { rating: number; isSample?: boolean }[],
) {
  const real = reviews.filter((r) => !r.isSample);
  const average = real.length ? real.reduce((sum, r) => sum + r.rating, 0) / real.length : 0;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    sku: product.id,
    image: [product.image, ...(product.gallery ?? []).map((g) => g.src)].map(absoluteUrl),
    brand: { "@type": "Brand", name: "Averto" },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.id}`),
      priceCurrency: "INR",
      price: product.priceInr,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${SITE_URL}/#store` },
    },
    aggregateRating: real.length
      ? { "@type": "AggregateRating", ratingValue: average.toFixed(1), reviewCount: real.length }
      : undefined,
  };
}

export function blogPostingLd(post: {
  slug: string;
  title: string;
  description: string;
  image?: string;
  authorName: string;
  publishedAt: Date;
  updatedAt: Date;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: post.image ? [absoluteUrl(post.image)] : undefined,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: post.authorName },
    publisher: { "@id": `${SITE_URL}/#store` },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  };
}

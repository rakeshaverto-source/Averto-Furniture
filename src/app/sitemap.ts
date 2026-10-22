// /sitemap.xml: every public page search engines should find, rebuilt from the database at most
// every 5 minutes. Pages marked "hide from Google" in the SEO panel are left out.
import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/catalog";
import { getPublishedPosts } from "@/lib/blog";
import { STATIC_PAGES, absoluteUrl, noindexPaths } from "@/lib/seo";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts, hidden] = await Promise.all([getProducts(), getPublishedPosts(), noindexPaths()]);
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    ...STATIC_PAGES.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: page.path === "/blog" && posts[0] ? posts[0].updatedAt : now,
      changeFrequency: "weekly" as const,
      priority: page.path === "/" ? 1 : 0.8,
    })),
    ...products.map((p) => ({
      url: absoluteUrl(`/products/${p.id}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: [absoluteUrl(p.image)],
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      images: post.coverImage ? [absoluteUrl(post.coverImage)] : undefined,
    })),
  ];
  return entries.filter((e) => !hidden.has(new URL(e.url).pathname));
}

// Published blog posts for the shop, cached like the catalogue. The admin blog editor calls
// updateTag("blog") after a save so a new or changed post shows at once.
import "server-only";
import { unstable_cache } from "next/cache";
import type { JSONContent } from "@tiptap/core";
import { prisma } from "@/lib/prisma";
import { imageUrl } from "@/lib/catalog";

export interface BlogPostSummary {
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  coverAlt: string;
  tags: string[];
  authorName: string;
  publishedAt: Date;
  updatedAt: Date;
  readingMinutes: number;
}

export interface BlogPostFull extends BlogPostSummary {
  content: JSONContent;
  productIds: string[];
  seoTitle?: string;
  seoDescription?: string;
}

// All the text in a Tiptap document, for reading time and search descriptions
export function plainText(node: JSONContent | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  const inner = (node.content ?? []).map(plainText).join(node.type === "doc" ? "\n" : "");
  return node.type === "paragraph" || node.type === "heading" ? `${inner} ` : inner;
}

const readingMinutes = (content: JSONContent) =>
  Math.max(1, Math.round(plainText(content).split(/\s+/).filter(Boolean).length / 200));

type Row = Awaited<ReturnType<typeof prisma.blogPost.findFirstOrThrow>>;

function toFull(row: Row): BlogPostFull {
  const content = row.content as JSONContent;
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImage: row.coverImage ? imageUrl(row.coverImage) : undefined,
    coverAlt: row.coverAlt || row.title,
    tags: row.tags,
    authorName: row.authorName,
    publishedAt: row.publishedAt ?? row.createdAt,
    updatedAt: row.updatedAt,
    readingMinutes: readingMinutes(content),
    content,
    productIds: row.productIds,
    seoTitle: row.seoTitle ?? undefined,
    seoDescription: row.seoDescription ?? undefined,
  };
}

// Published posts whose date has arrived, newest first. A post can be scheduled by giving it a later date.
const getAllPublished = unstable_cache(
  async (): Promise<BlogPostFull[]> => {
    const rows = await prisma.blogPost.findMany({
      where: { status: "published", publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: "desc" },
    });
    return rows.map(toFull);
  },
  ["blog-posts"],
  { revalidate: 300, tags: ["blog"] },
);

// unstable_cache hands back JSON, so dates come back as strings
const revive = (p: BlogPostFull): BlogPostFull => ({
  ...p,
  publishedAt: new Date(p.publishedAt),
  updatedAt: new Date(p.updatedAt),
});

export async function getPublishedPosts(): Promise<BlogPostSummary[]> {
  return (await getAllPublished()).map(revive);
}

export async function getPost(slug: string) {
  const post = (await getAllPublished()).find((p) => p.slug === slug);
  return post ? revive(post) : undefined;
}

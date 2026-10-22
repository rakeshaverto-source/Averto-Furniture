"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { Node } from "@tiptap/pm/model";
import { getSchema, type JSONContent } from "@tiptap/core";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { blogExtensions } from "@/lib/blog-extensions";
import { imageUrl } from "@/lib/catalog";
import { slugify } from "@/lib/slug";
import { isBucketPath, productStorage } from "@/lib/supabase/storage";
import type { FormState } from "@/app/admin/store-actions";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const list = (value: string) => [...new Set(value.split(",").map((v) => v.trim()).filter(Boolean))];

const schema = getSchema(blogExtensions);
const OUR_IMAGES = imageUrl("blog/");

// The editor's document, checked against the editor's own schema. Images must be ones uploaded
// through the blog editor, so a post can't pull pictures (or tracking pixels) from other sites.
function parseContent(raw: string): JSONContent | null {
  try {
    const json = JSON.parse(raw) as JSONContent;
    Node.fromJSON(schema, json).check();
    const images: string[] = [];
    const walk = (node: JSONContent) => {
      if (node.type === "image") images.push(String(node.attrs?.src ?? ""));
      node.content?.forEach(walk);
    };
    walk(json);
    return images.every((src) => src.startsWith(OUR_IMAGES)) ? json : null;
  } catch {
    return null;
  }
}

export interface PostFormState extends FormState {
  id?: string;
}

export async function savePost(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  const admin = await requireAdmin("blog");
  const id = text(formData, "id");
  const title = text(formData, "title");
  const slug = slugify(text(formData, "slug") || title);
  const content = parseContent(String(formData.get("content") ?? ""));
  const publish = text(formData, "status") === "published";
  const dateInput = text(formData, "publishedAt");
  const coverImage = text(formData, "coverImage");

  if (!title) return { error: "Give the post a title." };
  if (!slug) return { error: "The web address needs at least one letter or number." };
  if (!content) return { error: "The post body couldn't be read. Please copy your text, reload, and try again." };
  if (coverImage && !/^blog\/[\w-]+\.webp$/.test(coverImage)) return { error: "Upload the cover image again." };
  const clash = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } });
  if (clash && clash.id !== id) return { error: `Another post already uses /blog/${slug}. Change the web address.` };

  const existing = id ? await prisma.blogPost.findUnique({ where: { id } }) : null;
  if (id && !existing) return { error: "This post no longer exists." };

  // A chosen date wins; otherwise the first time a post is published is its date
  const publishedAt = dateInput ? new Date(`${dateInput}T00:00:00+05:30`) : publish ? (existing?.publishedAt ?? new Date()) : null;
  const data = {
    slug,
    title,
    excerpt: text(formData, "excerpt").slice(0, 400),
    content,
    coverImage: coverImage || null,
    coverAlt: text(formData, "coverAlt"),
    tags: list(text(formData, "tags")).slice(0, 8),
    productIds: list(text(formData, "productIds")),
    status: publish ? ("published" as const) : ("draft" as const),
    publishedAt,
    authorName: text(formData, "authorName") || existing?.authorName || "Averto",
    seoTitle: text(formData, "seoTitle") || null,
    seoDescription: text(formData, "seoDescription") || null,
  };

  const post = existing
    ? await prisma.blogPost.update({ where: { id }, data })
    : await prisma.blogPost.create({ data: { ...data, authorEmail: admin.email } });

  updateTag("blog");
  revalidatePath("/admin/blog", "layout");
  if (!existing) redirect(`/admin/blog/${post.id}?saved=1`);
  return { id: post.id, ok: publish ? "Published." : "Draft saved." };
}

export async function deletePost(formData: FormData) {
  await requireAdmin("blog");
  const id = text(formData, "id");
  const post = await prisma.blogPost.findUnique({ where: { id }, select: { coverImage: true } });
  if (post) {
    await prisma.blogPost.delete({ where: { id } });
    if (post.coverImage && isBucketPath(post.coverImage)) await productStorage().remove([post.coverImage]);
    updateTag("blog");
  }
  redirect("/admin/blog");
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { imageUrl } from "@/lib/catalog";
import { SITE_URL } from "@/lib/seo";
import { deletePost } from "@/app/admin/blog-actions";
import PostForm from "@/components/admin/PostForm";
import ConfirmButton from "@/components/admin/ConfirmButton";

// The date input works in Indian time, matching how savePost reads it back
const istDate = (date: Date) => new Date(date.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin("blog");
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const [post, products] = await Promise.all([
    prisma.blogPost.findUnique({ where: { id } }),
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!post) notFound();

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <Link href="/admin/blog" className="text-sm text-stone-500 hover:text-stone-900">
          ← All posts
        </Link>
        <form action={deletePost}>
          <input type="hidden" name="id" value={post.id} />
          <ConfirmButton
            message={`Delete "${post.title}"? This can't be undone.`}
            className="text-sm text-red-700 hover:text-red-800 underline underline-offset-4 cursor-pointer"
          >
            Delete post
          </ConfirmButton>
        </form>
      </div>
      <div className="mt-4">
        <PostForm
          siteUrl={SITE_URL}
          products={products}
          justSaved={saved === "1"}
          post={{
            id: post.id,
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt,
            content: post.content as JSONContent,
            cover: post.coverImage ? { path: post.coverImage, url: imageUrl(post.coverImage) } : undefined,
            coverAlt: post.coverAlt,
            tags: post.tags.join(", "),
            productIds: post.productIds,
            status: post.status,
            publishedAt: post.publishedAt ? istDate(post.publishedAt) : "",
            authorName: post.authorName,
            seoTitle: post.seoTitle ?? "",
            seoDescription: post.seoDescription ?? "",
          }}
        />
      </div>
    </div>
  );
}

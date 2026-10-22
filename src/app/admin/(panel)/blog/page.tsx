import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { formatDate } from "@/lib/admin-format";
import { primaryButton } from "@/components/admin/ui";

export default async function AdminBlogPage() {
  await requireAdmin("blog");
  const posts = await prisma.blogPost.findMany({
    orderBy: [{ status: "asc" }, { publishedAt: { sort: "desc", nulls: "first" } }, { updatedAt: "desc" }],
    select: { id: true, slug: true, title: true, status: true, publishedAt: true, updatedAt: true, authorName: true, tags: true },
  });
  const now = new Date();

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-[#111110]">Blog</h1>
          <p className="mt-1 text-sm text-stone-500">Posts appear on the shop at /blog once published.</p>
        </div>
        <Link href="/admin/blog/new" className={primaryButton}>
          <Plus className="w-4 h-4" /> New post
        </Link>
      </div>

      <ul className="mt-6 space-y-3">
        {posts.map((p) => {
          const scheduled = p.status === "published" && p.publishedAt && p.publishedAt > now;
          return (
            <li key={p.id}>
              <Link
                href={`/admin/blog/${p.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-stone-200 bg-white px-5 py-4 hover:border-stone-900 transition-colors"
              >
                <span className="font-medium text-stone-900 min-w-0 flex-1 truncate">{p.title}</span>
                {p.tags.length > 0 && <span className="text-xs text-stone-500">{p.tags.join(", ")}</span>}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    scheduled
                      ? "bg-sky-50 text-sky-800"
                      : p.status === "published"
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-stone-100 text-stone-700"
                  }`}
                >
                  {scheduled ? "Scheduled" : p.status === "published" ? "Published" : "Draft"}
                </span>
                <span className="w-full sm:w-auto text-xs text-stone-500">
                  {p.authorName} · {p.publishedAt ? formatDate(p.publishedAt) : `edited ${formatDate(p.updatedAt)}`}
                </span>
              </Link>
            </li>
          );
        })}
        {posts.length === 0 && (
          <li className="rounded-2xl border border-dashed border-stone-300 px-4 py-12 text-center text-stone-500">
            No posts yet. Ideas that bring visitors from Google: how to care for slate, choosing a dining table size,
            teak vs oak, room-by-room guides.
          </li>
        )}
      </ul>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import type { BlogPostSummary } from "@/lib/blog";

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" });

export const formatPostDate = (date: Date) => dateFormat.format(date);

// One post on the blog list; the first post on the page is shown wide
export default function PostCard({ post, featured = false }: { post: BlogPostSummary; featured?: boolean }) {
  return (
    <article className={`group ${featured ? "md:col-span-2 lg:col-span-3" : ""}`}>
      <Link
        href={`/blog/${post.slug}`}
        className={`block h-full bg-white rounded-sm overflow-hidden border border-stone-200/70 hover:border-stone-300 hover:shadow-[0_18px_40px_-24px_rgba(17,17,16,0.35)] transition-all duration-500 ${
          featured ? "md:grid md:grid-cols-2" : ""
        }`}
      >
        <div className={`relative bg-stone-100 overflow-hidden ${featured ? "aspect-[16/10] md:aspect-auto md:min-h-[360px]" : "aspect-[16/10]"}`}>
          {post.coverImage && (
            <Image
              src={post.coverImage}
              alt={post.coverAlt}
              fill
              priority={featured}
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"}
            />
          )}
        </div>
        <div className={`p-6 sm:p-7 flex flex-col ${featured ? "md:p-10 md:justify-center" : ""}`}>
          {post.tags.length > 0 && (
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#C2A268] font-semibold">
              {post.tags.slice(0, 2).join(" · ")}
            </p>
          )}
          <h2
            className={`mt-3 font-serif text-stone-950 leading-tight group-hover:text-[#7a5a2b] transition-colors ${
              featured ? "text-3xl sm:text-4xl" : "text-2xl"
            }`}
          >
            {post.title}
          </h2>
          {post.excerpt && (
            <p className={`mt-3 text-stone-600 leading-relaxed ${featured ? "text-base" : "text-sm line-clamp-3"}`}>
              {post.excerpt}
            </p>
          )}
          <p className="mt-5 text-xs text-stone-500">
            {formatPostDate(post.publishedAt)} · {post.readingMinutes} min read
          </p>
        </div>
      </Link>
    </article>
  );
}

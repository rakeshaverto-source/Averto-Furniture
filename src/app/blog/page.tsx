import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollProgress from "@/components/motion/ScrollProgress";
import PostCard from "@/components/blog/PostCard";
import JsonLd from "@/components/seo/JsonLd";
import { getPublishedPosts } from "@/lib/blog";
import { STATIC_PAGES, pageMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/structured-data";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/blog", STATIC_PAGES.find((p) => p.path === "/blog")!);
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const [{ tag }, posts] = await Promise.all([searchParams, getPublishedPosts()]);
  const tags = [...new Set(posts.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b));
  const shown = tag ? posts.filter((p) => p.tags.includes(tag)) : posts;

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Journal", path: "/blog" }])} />
      <ScrollProgress />
      <Navbar />

      <section className="w-full pt-12 sm:pt-16 pb-10 sm:pb-14 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.22em] text-stone-500 mb-4">
            <Link href="/" className="hover:text-stone-900 transition-colors">
              Home
            </Link>
            <span className="mx-2 text-stone-300">/</span>
            <span className="text-[#C2A268]">Journal</span>
          </nav>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-normal text-[#111110] tracking-tight leading-[1.05]">
            The Averto Journal
          </h1>
          <p className="mt-5 max-w-xl text-stone-600 leading-relaxed">
            Ideas, care guides and stories from our workshop: slate, timber, and furniture made to fit.
          </p>

          {tags.length > 0 && (
            <nav aria-label="Filter by topic" className="mt-8 flex flex-wrap gap-2 text-sm">
              {[undefined, ...tags].map((t) => {
                const active = t === tag;
                return (
                  <Link
                    key={t ?? "all"}
                    href={t ? `/blog?tag=${encodeURIComponent(t)}` : "/blog"}
                    aria-current={active ? "page" : undefined}
                    className={`px-4 py-1.5 rounded-full border transition-colors ${
                      active
                        ? "bg-stone-900 border-stone-900 text-white"
                        : "border-stone-300 text-stone-700 hover:border-stone-900"
                    }`}
                  >
                    {t ?? "All"}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </section>

      <section className="w-full pb-24 px-6 sm:px-10 lg:px-16 flex-1">
        <div className="max-w-7xl mx-auto">
          {shown.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {shown.map((post, i) => (
                <PostCard key={post.slug} post={post} featured={i === 0 && !tag} />
              ))}
            </div>
          ) : (
            <p className="rounded-sm border border-dashed border-stone-300 px-6 py-16 text-center text-stone-500">
              New stories are on their way. In the meantime,{" "}
              <Link href="/collections" className="text-stone-900 underline underline-offset-4">
                browse the collections
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

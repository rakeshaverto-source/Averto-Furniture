import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollProgress from "@/components/motion/ScrollProgress";
import PostContent from "@/components/blog/PostContent";
import PostCard, { formatPostDate } from "@/components/blog/PostCard";
import JsonLd from "@/components/seo/JsonLd";
import { formatPrice } from "@/data/collections";
import { getPost, getPublishedPosts, plainText } from "@/lib/blog";
import { getProducts } from "@/lib/catalog";
import { clip, pageMetadata } from "@/lib/seo";
import { blogPostingLd, breadcrumbLd } from "@/lib/structured-data";

// Built ahead of time and refreshed at most every 5 minutes; new posts are built on their first visit
export const revalidate = 300;

export async function generateStaticParams() {
  return (await getPublishedPosts()).map((post) => ({ slug: post.slug }));
}

const describe = (post: NonNullable<Awaited<ReturnType<typeof getPost>>>) =>
  post.seoDescription || post.excerpt || clip(plainText(post.content));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found | Averto" };

  const meta = await pageMetadata(`/blog/${post.slug}`, {
    title: post.seoTitle || `${post.title} | Averto Journal`,
    description: describe(post),
    image: post.coverImage,
    type: "article",
  });
  return {
    ...meta,
    authors: [{ name: post.authorName }],
    openGraph: {
      ...meta.openGraph,
      type: "article",
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const [products, posts] = await Promise.all([getProducts(), getPublishedPosts()]);
  const related = post.productIds.flatMap((id) => products.filter((p) => p.id === id));
  // Other posts sharing a tag first, then the newest
  const more = posts
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => Number(b.tags.some((t) => post.tags.includes(t))) - Number(a.tags.some((t) => post.tags.includes(t))))
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <JsonLd
        data={[
          blogPostingLd({
            slug: post.slug,
            title: post.title,
            description: describe(post),
            image: post.coverImage,
            authorName: post.authorName,
            publishedAt: post.publishedAt,
            updatedAt: post.updatedAt,
          }),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Journal", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <ScrollProgress />
      <Navbar />

      <article className="w-full px-6 sm:px-10 lg:px-16 pt-12 sm:pt-16 pb-16">
        <header className="max-w-3xl mx-auto text-center">
          <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.22em] text-stone-500 mb-6">
            <Link href="/" className="hover:text-stone-900 transition-colors">
              Home
            </Link>
            <span className="mx-2 text-stone-300">/</span>
            <Link href="/blog" className="hover:text-stone-900 transition-colors">
              Journal
            </Link>
          </nav>
          {post.tags.length > 0 && (
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C2A268] font-semibold">
              {post.tags.map((t, i) => (
                <span key={t}>
                  {i > 0 && " · "}
                  <Link href={`/blog?tag=${encodeURIComponent(t)}`} className="hover:text-stone-900">
                    {t}
                  </Link>
                </span>
              ))}
            </p>
          )}
          <h1 className="mt-4 font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-[#111110] tracking-tight leading-[1.08]">
            {post.title}
          </h1>
          {post.excerpt && <p className="mt-5 text-lg text-stone-600 leading-relaxed">{post.excerpt}</p>}
          <p className="mt-6 text-sm text-stone-500">
            By {post.authorName} · <time dateTime={post.publishedAt.toISOString()}>{formatPostDate(post.publishedAt)}</time>{" "}
            · {post.readingMinutes} min read
          </p>
        </header>

        {post.coverImage && (
          <div className="relative max-w-5xl mx-auto mt-10 sm:mt-12 aspect-[16/9] rounded-sm overflow-hidden bg-stone-100">
            <Image src={post.coverImage} alt={post.coverAlt} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 1024px" />
          </div>
        )}

        <div className="max-w-2xl mx-auto mt-10 sm:mt-14">
          <PostContent content={post.content} />
        </div>
      </article>

      {related.length > 0 && (
        <section className="w-full px-6 sm:px-10 lg:px-16 pb-16">
          <div className="max-w-5xl mx-auto border-t border-stone-200 pt-12">
            <h2 className="font-serif text-3xl text-[#111110]">Pieces from this story</h2>
            <ul className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {related.map((p) => (
                <li key={p.id}>
                  <Link href={`/products/${p.id}`} className="group block">
                    <div className="relative aspect-[4/5] bg-stone-100 rounded-sm overflow-hidden">
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        sizes="(max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <p className="mt-3 font-serif text-lg text-stone-950 leading-tight">{p.name}</p>
                    <p className="mt-1 text-sm text-stone-600">{formatPrice(p.priceInr)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {more.length > 0 && (
        <section className="w-full px-6 sm:px-10 lg:px-16 pb-24">
          <div className="max-w-7xl mx-auto border-t border-stone-200 pt-12">
            <h2 className="font-serif text-3xl text-[#111110]">More from the journal</h2>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {more.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}

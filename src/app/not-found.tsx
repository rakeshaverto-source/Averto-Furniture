import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getHomeCategories } from "@/lib/catalog";
import { WHATSAPP_NUMBER } from "@/data/collections";

// Shown for any address the site doesn't have, and wherever a page calls notFound()
// (a removed product, an old blog link, a mistyped order number)
export default async function NotFound() {
  // A few categories to carry on browsing; the page still works if the database can't be reached
  const categories = (await getHomeCategories().catch(() => [])).slice(0, 4);
  const help = "Hello Averto, I was looking for something on your website but the page wasn't found.";

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <Navbar />

      <section className="flex-1 px-4 sm:px-10 lg:px-16 pt-28 sm:pt-36 pb-16 sm:pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-serif text-[96px] sm:text-[160px] leading-none text-[#E8DFD0] select-none" aria-hidden>
            404
          </p>
          <span className="mt-2 block text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#A66E38] font-bold">
            Page not found
          </span>
          <h1 className="mt-3 font-serif text-3xl sm:text-5xl text-[#111110] leading-tight">
            This piece isn&rsquo;t in our studio.
          </h1>
          <p className="mt-4 text-sm sm:text-base text-stone-600 max-w-md mx-auto leading-relaxed">
            The page may have moved, the product may no longer be made, or the address may have a small typo.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Link
              href="/collections"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap px-7 py-3.5 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] text-white text-sm font-medium transition-colors"
            >
              Browse the collection <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center whitespace-nowrap px-7 py-3.5 rounded-sm border border-stone-300 hover:border-stone-900 bg-white text-stone-900 text-sm font-medium transition-colors"
            >
              Back to home
            </Link>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(help)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 underline underline-offset-4"
          >
            <MessageCircle className="w-4 h-4" /> Can&rsquo;t find something? Ask us on WhatsApp
          </a>
        </div>

        {categories.length > 0 && (
          <div className="max-w-5xl mx-auto mt-16 sm:mt-20">
            <h2 className="text-center text-xs uppercase tracking-[0.22em] text-stone-500 font-bold">Or explore</h2>
            <ul className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/collections?category=${encodeURIComponent(c.id)}`} className="group block">
                    <span className="relative block aspect-square overflow-hidden rounded-2xl bg-stone-100">
                      <Image
                        src={c.image}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, 240px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </span>
                    <span className="mt-2.5 block text-sm font-medium text-stone-900 group-hover:underline underline-offset-4">
                      {c.name}
                    </span>
                    <span className="block text-xs text-stone-500">
                      {c.designs} {c.designs === 1 ? "Design" : "Designs"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}

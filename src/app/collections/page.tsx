import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CollectionsHero from "@/components/collections/CollectionsHero";
import CollectionsBrowser from "@/components/collections/CollectionsBrowser";
import CustomPieceCta from "@/components/collections/CustomPieceCta";
import ScrollProgress from "@/components/motion/ScrollProgress";
import { getCategories, getProducts } from "@/lib/catalog";
import { STATIC_PAGES, pageMetadata } from "@/lib/seo";

// Text from the admin SEO panel when set, otherwise the defaults in src/lib/seo.ts
export async function generateMetadata(): Promise<Metadata> {
  const page = STATIC_PAGES.find((p) => p.path === "/collections")!;
  return pageMetadata("/collections", page);
}

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ category }, categories, products] = await Promise.all([searchParams, getCategories(), getProducts()]);
  // Accepts ?category=dining or ?category=dining,sofas; unknown names are ignored
  const requested = (Array.isArray(category) ? category.join(",") : category) ?? "";
  const initialCategories = [...new Set(requested.split(","))].filter((id) => categories.some((c) => c.id === id));

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <ScrollProgress />
      <Navbar />
      <CollectionsHero />
      <CollectionsBrowser initialCategories={initialCategories} categories={categories} products={products} />
      <CustomPieceCta />
      <Footer />
    </main>
  );
}

import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CollectionsHero from "@/components/collections/CollectionsHero";
import CollectionsBrowser from "@/components/collections/CollectionsBrowser";
import CustomPieceCta from "@/components/collections/CustomPieceCta";
import ScrollProgress from "@/components/motion/ScrollProgress";
import { isCategoryId } from "@/data/collections";

export const metadata: Metadata = {
  title: "Collections | Averto Bespoke Slate & Luxury Furniture",
  description:
    "Browse Averto's made-to-order sofas, dining tables, beds, storage, lighting and leather seating, handcrafted from Rajasthan slate and seasoned teak.",
};

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { category } = await searchParams;
  // Accepts ?category=dining or ?category=dining,sofas; unknown names are ignored
  const requested = (Array.isArray(category) ? category.join(",") : category) ?? "";
  const initialCategories = [...new Set(requested.split(","))].filter(isCategoryId);

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <ScrollProgress />
      <Navbar />
      <CollectionsHero />
      <CollectionsBrowser initialCategories={initialCategories} />
      <CustomPieceCta />
      <Footer />
    </main>
  );
}

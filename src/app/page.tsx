import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import HeroBanner from "@/components/home/HeroBanner";
import FannedCardsSection from "@/components/home/FannedCardsSection";
import ShopByCategory from "@/components/home/ShopByCategory";
import ShopBySpaceSection from "@/components/home/ShopBySpaceSection";
import TopSellingProducts, { type SelectedPiece } from "@/components/home/TopSellingProducts";
import BespokeSectorsSection from "@/components/home/BespokeSectorsSection";
import InteractiveShowcaseSlider, { type ShowcasePiece } from "@/components/home/InteractiveShowcaseSlider";
import ClientReviewsSection from "@/components/home/ClientReviewsSection";
import ClientLogosStrip from "@/components/home/ClientLogosStrip";
import Footer from "@/components/layout/Footer";
import StatsStrip from "@/components/home/StatsStrip";
import ScrollProgress from "@/components/motion/ScrollProgress";
import JsonLd from "@/components/seo/JsonLd";
import { getCategories, getHomeCategories, getProducts } from "@/lib/catalog";
import { STATIC_PAGES, getSeoSettings, pageMetadata } from "@/lib/seo";
import { organizationLd, websiteLd } from "@/lib/structured-data";

// Rebuilt from the database at most every 5 minutes, so price changes reach the home page
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/", STATIC_PAGES.find((p) => p.path === "/")!);
}

export default async function Home() {
  const { siteName } = await getSeoSettings();
  const [products, categories, homeCategories] = await Promise.all([getProducts(), getCategories(), getHomeCategories()]);
  // The pieces ticked in admin; until any are, the first few in shop order
  const ticked = products.filter((p) => p.onHomePage);
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const selected: SelectedPiece[] = (ticked.length ? ticked : products.slice(0, 6)).map((p) => ({
    id: p.id,
    name: p.name,
    category: categoryName.get(p.category) ?? p.category,
    specs: p.specs,
    image: p.image,
    priceInr: p.priceInr,
    originalPriceInr: p.originalPriceInr,
  }));
  // The pieces chosen under Admin → Home slider, in their order there; none hides the section
  const showcase: ShowcasePiece[] = products
    .filter((p) => p.inShowcase)
    .sort((a, b) => (a.showcaseOrder ?? 0) - (b.showcaseOrder ?? 0))
    .map((p) => ({
      id: p.id,
      name: p.name,
      categoryId: p.category,
      categoryName: categoryName.get(p.category) ?? p.category,
      badge: p.badge,
      description: p.description,
      priceInr: p.priceInr,
      image: p.image,
      zoomClass: p.zoomClass,
      detailImage: p.gallery?.[0]?.src,
    }));

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <JsonLd data={[organizationLd(siteName), websiteLd(siteName)]} />

      {/* Reading progress line pinned to the top of the viewport */}
      <ScrollProgress />

      {/* 1. Header Navigation */}
      <Navbar />

      {/* 2. Hero Banner Living Space */}
      <HeroBanner />

      {/* 3. Interactive Fanned 3D Deck Section (New Arrivals - First Visual Punch) */}
      <FannedCardsSection />

      {/* 4. Curated Collections - Shop By Category Carousel */}
      <ShopByCategory categories={homeCategories} />

      {/* 5. Editorial 2x2 Showcase - Shop By Living Space */}
      <ShopBySpaceSection />

      {/* 6. Top Selling Products (Most requested luxury commissions) */}
      <TopSellingProducts products={selected} />

      {/* Animated trust counters (commissions, guarantee, ateliers, rating) */}
      <StatsStrip />

      {/* 6. Custom Fit-Outs (Homes, Hotels, Schools/Colleges, Corporate) */}
      <BespokeSectorsSection />

      {/* 7. Signature Monolith Interactive Showcase Slider (Clean Leather & Slate Showcase) */}
      <InteractiveShowcaseSlider pieces={showcase} />

      {/* Client names (wordmarks until logos are added to /public/clients) */}
      <ClientLogosStrip />

      {/* 8. Client Testimonials & Trust Showcase (Architects & Luxury Homeowners) */}
      <ClientReviewsSection />

      {/* 9. Minimal Architectural Luxury Footer */}
      <Footer />
    </main>
  );
}

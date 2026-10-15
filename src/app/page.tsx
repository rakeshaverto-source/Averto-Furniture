import Navbar from "@/components/layout/Navbar";
import HeroBanner from "@/components/home/HeroBanner";
import FannedCardsSection from "@/components/home/FannedCardsSection";
import ShopByCategory from "@/components/home/ShopByCategory";
import ShopBySpaceSection from "@/components/home/ShopBySpaceSection";
import TopSellingProducts from "@/components/home/TopSellingProducts";
import BespokeSectorsSection from "@/components/home/BespokeSectorsSection";
import InteractiveShowcaseSlider from "@/components/home/InteractiveShowcaseSlider";
import ClientReviewsSection from "@/components/home/ClientReviewsSection";
import Footer from "@/components/layout/Footer";
import StatsStrip from "@/components/home/StatsStrip";
import ScrollProgress from "@/components/motion/ScrollProgress";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col">
      {/* Reading progress line pinned to the top of the viewport */}
      <ScrollProgress />

      {/* 1. Header Navigation */}
      <Navbar />

      {/* 2. Hero Banner Living Space */}
      <HeroBanner />

      {/* 3. Interactive Fanned 3D Deck Section (New Arrivals - First Visual Punch) */}
      <FannedCardsSection />

      {/* 4. Curated Collections - Shop By Category Carousel */}
      <ShopByCategory />

      {/* 5. Editorial 2x2 Showcase - Shop By Living Space */}
      <ShopBySpaceSection />

      {/* 6. Top Selling Products (Most requested luxury commissions) */}
      <TopSellingProducts />

      {/* Animated trust counters (commissions, guarantee, ateliers, rating) */}
      <StatsStrip />

      {/* 6. Custom Fit-Outs (Homes, Hotels, Schools/Colleges, Corporate) */}
      <BespokeSectorsSection />

      {/* 7. Signature Monolith Interactive Showcase Slider (Clean Leather & Slate Showcase) */}
      <InteractiveShowcaseSlider />

      {/* 8. Client Testimonials & Trust Showcase (Architects & Luxury Homeowners) */}
      <ClientReviewsSection />

      {/* 9. Minimal Architectural Luxury Footer */}
      <Footer />
    </main>
  );
}

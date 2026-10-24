import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import MotionProvider from "@/components/motion/MotionProvider";
import CartProvider from "@/components/cart/CartProvider";
import { rootMetadata } from "@/lib/seo";
import { getPopupReviews } from "@/lib/catalog";
import ReviewPopup from "@/components/home/ReviewPopup";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Title, description, share preview and Search Console codes come from the admin SEO panel
export async function generateMetadata(): Promise<Metadata> {
  return rootMetadata();
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${cormorantGaramond.variable} scroll-smooth antialiased`}
    >
      {/* Browser extensions (e.g. ColorZilla's cz-shortcut-listen) add attributes to <body> before React
          loads. This only ignores attribute differences on <body> itself, not on anything inside it. */}
      <body
        suppressHydrationWarning
        className="min-h-screen bg-white text-[#1A1A18] font-sans selection:bg-[#1A1A18] selection:text-[#FAFAF8]"
      >
        <MotionProvider>
          <CartProvider>{children}</CartProvider>
          {/* Real customer reviews in the bottom-left corner; nothing shows until there are some */}
          <ReviewPopup reviews={await getPopupReviews().catch(() => [])} />
        </MotionProvider>
      </body>
    </html>
  );
}

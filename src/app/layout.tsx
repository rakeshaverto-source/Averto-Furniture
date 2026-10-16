import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import MotionProvider from "@/components/motion/MotionProvider";
import CartProvider from "@/components/cart/CartProvider";

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

export const metadata: Metadata = {
  title: "Averto | Bespoke Slate & Luxury Custom Furniture Studio",
  description:
    "Handcrafted bespoke luxury furniture engineered with natural slate, architectural stone, and sustainable hardwoods. Tailored precisely to your living spaces.",
  keywords: [
    "bespoke furniture",
    "custom slate table",
    "luxury stone furniture",
    "custom living room furniture",
    "scandinavian minimal furniture",
    "handcrafted slate dining table",
    "custom furniture studio",
  ],
  authors: [{ name: "Averto Atelier" }],
  openGraph: {
    title: "Averto | Bespoke Slate & Luxury Custom Furniture Studio",
    description:
      "Handcrafted bespoke luxury furniture engineered with natural slate stone, architectural timber, and tailored finishes.",
    url: "https://furnitureaverto.com",
    siteName: "Averto Studio",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
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
        </MotionProvider>
      </body>
    </html>
  );
}

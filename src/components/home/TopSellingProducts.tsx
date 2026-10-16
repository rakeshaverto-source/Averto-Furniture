"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PriceTag from "@/components/products/PriceTag";
import WishlistButton from "@/components/account/WishlistButton";
import { motion } from "framer-motion";
import TextReveal from "@/components/motion/TextReveal";

interface Product {
  id: string;
  // matches a product id in the database, so the card can open its page and show its live price
  slug: string;
  name: string;
  category: string;
  price: string;
  originalPrice?: string;
  tag: string;
  image: string;
  specs: string;
}

const topProducts: Product[] = [
  {
    id: "top-1",
    slug: "monolith-slate-table",
    name: "The Monolith Slate Table",
    category: "Dining",
    price: "₹2,45,000",
    originalPrice: "₹2,80,000",
    tag: "Best Seller",
    image: "/hero/dining-table.jpg",
    specs: "20mm Rajasthan Slate · Solid Oak Base",
  },
  {
    id: "top-2",
    slug: "saddle-leather-lounge-chair",
    name: "Saddle Leather Lounge Chair",
    category: "Living",
    price: "₹1,25,000",
    tag: "Atelier Favorite",
    image: "/hero/saddle-chair.jpg",
    specs: "Kanpur Top-Grain Hide · Seasoned Teak",
  },
  {
    id: "top-3",
    slug: "serpentine-modular-sofa",
    name: "Serpentine Modular Sofa",
    category: "Living",
    price: "₹3,40,000",
    originalPrice: "₹3,90,000",
    tag: "Top Rated",
    image: "/hero/modular-sofa.jpg",
    specs: "Tactile Ivory Bouclé · Hidden Plinth",
  },
  {
    id: "top-4",
    slug: "aura-low-profile-bed",
    name: "Aura Low-Profile Platform Bed",
    category: "Bedroom",
    price: "₹2,75,000",
    tag: "Signature Release",
    image: "/hero/bed.jpg",
    specs: "Backlit Natural Slate · Smoked Ash",
  },
  {
    id: "top-5",
    slug: "nero-marquina-credenza",
    name: "Nero Marquina Fluted Credenza",
    category: "Storage",
    price: "₹1,95,000",
    tag: "Best Seller",
    image: "/hero/fluted-credenza.jpg",
    specs: "Honed Black Marble · Smoked Oak",
  },
  {
    id: "top-6",
    slug: "solstice-chandelier",
    name: "Solstice Geometric Chandelier",
    category: "Lighting",
    price: "₹1,45,000",
    tag: "Trending",
    image: "/hero/pendant-chandelier.jpg",
    specs: "Brushed Champagne Brass · Alabaster",
  },
];

const filterCategories = ["All", "Living", "Dining", "Bedroom", "Storage", "Lighting"];

// Live prices from the database, keyed by product id (see src/app/page.tsx)
export type TopSellingPrices = Record<string, { priceInr: number; originalPriceInr?: number }>;

export default function TopSellingProducts({ prices }: { prices: TopSellingPrices }) {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered =
    activeFilter === "All"
      ? topProducts
      : topProducts.filter((p) => p.category === activeFilter);

  return (
    <section className="w-full bg-white pt-10 sm:pt-14 pb-16 sm:pb-20 px-4 sm:px-8 lg:px-16 border-t border-stone-200/60">
      <div className="max-w-7xl mx-auto">
        
        {/* Header matching the modern sans-serif typography with smooth scroll reveal */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal tracking-tight text-[#111110]">
              <TextReveal text="Selected pieces" />
            </h2>
            <p className="text-sm sm:text-base text-stone-500 font-sans font-normal mt-3 max-w-lg">
              A few of the pieces we make most often, each one built to order.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-5 overflow-x-auto pb-2 scrollbar-none">
            {filterCategories.map((cat) => {
              const isActive = activeFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`pb-1 text-sm transition-colors cursor-pointer shrink-0 border-b ${
                    isActive ? "border-stone-900 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-900"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* 3-Column Luxury Product Grid with Staggered Scroll Animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {filtered.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.6,
                delay: (idx % 3) * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group flex flex-col"
            >
              {/* Product Image Frame */}
              <div className="relative aspect-[4/3.5] w-full overflow-hidden bg-stone-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                

                {/* Quick Action Overlay (On Hover) */}
                <Link
                  href={`/products/${product.slug}`}
                  aria-label={`View ${product.name}`}
                  className="absolute inset-0"
                />
                <WishlistButton productId={product.slug} variant="overlay" className="absolute top-3 right-3" />
              </div>

              {/* Product Info */}
              <div className="pt-5 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-xs text-stone-500 block mb-1">
                    {product.category}
                  </span>
                  <h3 className="font-serif text-2xl font-normal text-stone-900 leading-snug">
                    <Link href={`/products/${product.slug}`} className="hover:underline underline-offset-4">
                      {product.name}
                    </Link>
                  </h3>
                  <p className="text-xs text-stone-500 font-sans mt-2 font-normal">
                    {product.specs}
                  </p>
                </div>

                {/* Price and CTA */}
                <div className="mt-4 flex items-center justify-between">
                  <PriceTag
                    price={prices[product.slug]?.priceInr ?? 0}
                    original={prices[product.slug]?.originalPriceInr}
                  />

                  <Link
                    href={`/products/${product.slug}`}
                    className="text-sm text-stone-900 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900"
                  >
                    View piece
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}

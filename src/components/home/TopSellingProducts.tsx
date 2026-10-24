"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PriceTag from "@/components/products/PriceTag";
import WishlistButton from "@/components/account/WishlistButton";
import { m } from "framer-motion";
import TextReveal from "@/components/motion/TextReveal";

// One piece in the section: a product ticked "home page" in admin (see src/app/page.tsx)
export interface SelectedPiece {
  id: string;
  name: string;
  category: string; // category name, also the filter it falls under
  specs: string;
  image: string;
  priceInr: number;
  originalPriceInr?: number;
}

export default function TopSellingProducts({ products }: { products: SelectedPiece[] }) {
  const [activeFilter, setActiveFilter] = useState("All");
  // Only the categories that have a piece here, in the order they first appear
  const filterCategories = ["All", ...new Set(products.map((p) => p.category))];

  const filtered =
    activeFilter === "All"
      ? products
      : products.filter((p) => p.category === activeFilter);

  if (products.length === 0) return null;

  return (
    <section className="w-full bg-white pt-10 sm:pt-14 pb-16 sm:pb-20 px-4 sm:px-8 lg:px-16 border-t border-stone-200/60">
      <div className="max-w-7xl mx-auto">
        
        {/* Header matching the modern sans-serif typography with smooth scroll reveal */}
        <m.div
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
            {filterCategories.length > 2 && filterCategories.map((cat) => {
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
        </m.div>

        {/* 3-Column Luxury Product Grid with Staggered Scroll Animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {filtered.map((product, idx) => (
            <m.div
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
                  href={`/products/${product.id}`}
                  aria-label={`View ${product.name}`}
                  className="absolute inset-0"
                />
                <WishlistButton productId={product.id} variant="overlay" className="absolute top-3 right-3" />
              </div>

              {/* Product Info */}
              <div className="pt-5 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-xs text-stone-500 block mb-1">
                    {product.category}
                  </span>
                  <h3 className="font-serif text-2xl font-normal text-stone-900 leading-snug">
                    <Link href={`/products/${product.id}`} className="hover:underline underline-offset-4">
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
                    price={product.priceInr}
                    original={product.originalPriceInr}
                  />

                  <Link
                    href={`/products/${product.id}`}
                    className="text-sm text-stone-900 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900"
                  >
                    View piece
                  </Link>
                </div>
              </div>
            </m.div>
          ))}
        </div>

      </div>
    </section>
  );
}

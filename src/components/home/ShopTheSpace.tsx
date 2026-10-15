"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Plus, ArrowRight, Star, Check } from "lucide-react";

interface Hotspot {
  id: string;
  name: string;
  category: string;
  price: string;
  rating: string;
  specs: string;
  image: string;
  top: string;
  left: string;
}

const hotspots: Hotspot[] = [
  {
    id: "chandelier",
    name: "Solstice Geometric Chandelier",
    category: "Lighting",
    price: "₹1,45,000",
    rating: "9.9",
    specs: "Brushed Brass · Frosted Alabaster",
    image: "/hero/pendant-chandelier.jpg",
    top: "22%",
    left: "49%",
  },
  {
    id: "sofa",
    name: "Serpentine Modular Sofa",
    category: "Living Seating",
    price: "₹3,40,000",
    rating: "9.7",
    specs: "Textured Cream Bouclé · Slate Plinth",
    image: "/hero/modular-sofa.jpg",
    top: "68%",
    left: "70%",
  },
  {
    id: "coffee-table",
    name: "Fluted Oak & Slate Table",
    category: "Centerpiece",
    price: "₹89,000",
    rating: "9.1",
    specs: "Natural Chiseled Slate · Fluted Oak",
    image: "/hero/card-coffee.jpg",
    top: "80%",
    left: "53%",
  },
  {
    id: "lounge-chair",
    name: "Saddle Leather Lounge Chair",
    category: "Accent Chair",
    price: "₹1,25,000",
    rating: "9.6",
    specs: "Full-Grain Caramel Leather · Solid Walnut",
    image: "/hero/saddle-chair.jpg",
    top: "74%",
    left: "26%",
  },
];

export default function ShopTheSpace() {
  const [activeHotspot, setActiveHotspot] = useState<Hotspot>(hotspots[1]); // default to sofa

  return (
    <section className="w-full bg-[#FAF8F5] py-14 sm:py-20 px-4 sm:px-8 lg:px-16 border-t border-stone-200/60 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.22em] text-stone-600 font-bold block mb-1.5">
              Living Editorial
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 tracking-tight">
              The Contemporary Sanctuary
            </h2>
          </div>
          <p className="text-stone-600 text-xs sm:text-sm font-light max-w-md leading-relaxed">
            Styled in perfect architectural harmony. Tap the interactive tags on the room to inspect individual handcrafted creations.
          </p>
        </div>

        {/* Interactive Living Room Stage Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Main Visual Stage with Hotspots (Left / Center) */}
          <div className="lg:col-span-8 relative aspect-[16/10] sm:aspect-[16/9] rounded-3xl overflow-hidden bg-stone-900 shadow-xl border border-stone-200/80 group">
            <Image
              src="/hero/curated-living-space.jpg"
              alt="Curated Contemporary Living Space"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 66vw"
              priority
            />

            {/* Subtle Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/15 pointer-events-none" />

            {/* Interactive Hotspot Pins */}
            {hotspots.map((spot) => {
              const isActive = activeHotspot.id === spot.id;
              return (
                <div
                  key={spot.id}
                  style={{ top: spot.top, left: spot.left }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  <button
                    onClick={() => setActiveHotspot(spot)}
                    aria-label={`Inspect ${spot.name}`}
                    className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                      isActive
                        ? "bg-[#E08A50] text-white scale-110 shadow-[0_0_25px_rgba(224,138,80,0.8)] ring-4 ring-white/50"
                        : "bg-white/90 hover:bg-white text-stone-900 backdrop-blur-md shadow-lg hover:scale-105"
                    }`}
                  >
                    {/* Glowing Radar Wave Effect for active pin */}
                    {isActive && (
                      <span className="absolute -inset-1 rounded-full bg-[#E08A50]/40 animate-ping pointer-events-none" />
                    )}
                    <Plus className={`w-4 h-4 transition-transform duration-300 ${isActive ? "rotate-45" : ""}`} />
                  </button>
                </div>
              );
            })}

            {/* Quick helper badge overlay */}
            <div className="hidden sm:flex absolute bottom-4 left-4 z-20 items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white/90 text-[11px] font-medium border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#E08A50] animate-pulse" />
              <span>Tap + pins on furniture</span>
            </div>
          </div>

          {/* Active Piece Inspection Card (Right Side) */}
          <div className="lg:col-span-4 flex flex-col justify-between h-full bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-[0_10px_35px_rgba(0,0,0,0.05)]">
            
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#E08A50]">
                  {activeHotspot.category}
                </span>
                <div className="flex items-center gap-1 bg-[#FAF8F5] border border-stone-200 px-2 py-0.5 rounded-md text-[11px] font-bold text-stone-900">
                  <Star className="w-3 h-3 fill-[#F5A623] text-[#F5A623]" />
                  <span>{activeHotspot.rating}</span>
                </div>
              </div>

              {/* Product Thumbnail */}
              <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-stone-100 mb-5 border border-stone-100">
                <Image
                  src={activeHotspot.image}
                  alt={activeHotspot.name}
                  fill
                  className="object-cover object-center transition-transform duration-500 hover:scale-105"
                />
              </div>

              {/* Title & Specs */}
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 leading-tight">
                {activeHotspot.name}
              </h3>
              <p className="text-xs text-stone-500 font-light mt-1.5">
                {activeHotspot.specs}
              </p>
            </div>

            {/* Price & Action Button */}
            <div className="mt-6 pt-5 border-t border-stone-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-medium">
                  Direct Atelier Price
                </span>
                <span className="text-xl sm:text-2xl font-bold font-sans text-stone-900">
                  {activeHotspot.price}
                </span>
              </div>

              <a
                href="#contact"
                className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <span>Inquire</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Horizontal Mini Thumbnails Switcher */}
            <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
              {hotspots.map((spot) => (
                <button
                  key={spot.id}
                  onClick={() => setActiveHotspot(spot)}
                  aria-label={`Select ${spot.name}`}
                  className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    activeHotspot.id === spot.id
                      ? "border-[#E08A50] scale-105 shadow-xs"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={spot.image}
                    alt={spot.name}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

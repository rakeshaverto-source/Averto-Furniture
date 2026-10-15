"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

interface MaterialDetail {
  id: string;
  name: string;
  subtitle: string;
  origin: string;
  swatchImage: string;
  furnitureImage: string;
  furnitureTitle: string;
  furniturePrice: string;
  editorialQuote: string;
  specs: { label: string; value: string }[];
}

const materialsData: MaterialDetail[] = [
  {
    id: "slate",
    name: "Kund Multi Slate",
    subtitle: "Hand-Cleft Natural Monolithic Stone",
    origin: "Kund, Rajasthan",
    swatchImage: "/hero/slate-texture.jpg",
    furnitureImage: "/hero/poster-table.jpg",
    furnitureTitle: "The Monolith Slate Table",
    furniturePrice: "₹2,45,000",
    editorialQuote:
      "Quarried from the historic rock formations of Rajasthan, naturally cleft along organic geological strata and flame-dressed by master Karigars into a silky, heat-and-spill-proof dining surface.",
    specs: [
      { label: "Thermal Tolerance", value: "Up to 400°C" },
      { label: "Porosity", value: "Naturally Zero" },
      { label: "Finish", value: "Hand-Chiseled Edge" },
    ],
  },
  {
    id: "leather",
    name: "Averto Saddle Hide",
    subtitle: "Organic Vegetable-Tanned Full Grain Leather",
    origin: "Kanpur Heritage Tannery",
    swatchImage: "/hero/yarwood-leather-rolls.jpg",
    furnitureImage: "/hero/saddle-chair.jpg",
    furnitureTitle: "Saddle Leather Lounge Chair",
    furniturePrice: "₹1,25,000",
    editorialQuote:
      "Handcrafted with organic vegetable-tanned top-grain hides steeped in natural acacia and babool tree extracts. Ages gracefully over solid seasoned teakwood with lifelong patina.",
    specs: [
      { label: "Tannage", value: "Organic Acacia Bark" },
      { label: "Surface", value: "Full-Grain Wax Patina" },
      { label: "Pliancy", value: "1.4mm Heavy Hide" },
    ],
  },
  {
    id: "boucle",
    name: "Kashmir Textured Weave",
    subtitle: "Plush Tactile Looped Architectural Wool",
    origin: "Himalayan Handloom Atelier",
    swatchImage: "/hero/sage-fabric-swatch.png",
    furnitureImage: "/hero/chair.jpg",
    furnitureTitle: "Sculptural Bouclé Armchair",
    furniturePrice: "₹85,000",
    editorialQuote:
      "Woven on artisanal looms blending durable long-staple yarn with rich looped texture. Naturally breathable, stain-resistant, and tailored seamlessly over ergonomic hardwood frames.",
    specs: [
      { label: "Rub Count", value: "75,000 Heavy Domestic" },
      { label: "Yarn", value: "Long-Staple Looped" },
      { label: "Tactile", value: "Deep Cloud Texture" },
    ],
  },
  {
    id: "walnut",
    name: "Solid Indian Teakwood",
    subtitle: "Old-Growth Forest Timber with Natural Oils",
    origin: "Saharanpur Atelier Joinery",
    swatchImage: "/hero/artisan-craft.jpg",
    furnitureImage: "/hero/fluted-credenza.jpg",
    furnitureTitle: "Nero Marquina Credenza",
    furniturePrice: "₹1,95,000",
    editorialQuote:
      "Seasoned over 90 days and hand-planed by generational woodcrafters. Features rich golden-honey grains naturally saturated with insect-resistant silica oils and mortise joinery.",
    specs: [
      { label: "Curing", value: "100% Seasoned Kiln" },
      { label: "Joinery", value: "Mortise & Tenon" },
      { label: "Coating", value: "Hand-Rubbed Organic Wax" },
    ],
  },
];

export default function InteractiveMaterialLab() {
  const [activeId, setActiveId] = useState("slate");
  const current = materialsData.find((m) => m.id === activeId) || materialsData[0];

  return (
    <section className="w-full bg-[#FAF8F5] py-20 sm:py-28 px-6 sm:px-10 lg:px-16 border-t border-stone-200/60 overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Minimalist Studio Editorial Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div>
            <span className="text-xs uppercase tracking-[0.22em] text-stone-500 font-bold block mb-2">
              Natural Matter & Craft
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-sans font-bold text-[#111110] tracking-tight">
              Tactile Materials
            </h2>
          </div>

          {/* Minimalist Material Switcher Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {materialsData.map((item) => {
              const isActive = item.id === current.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveId(item.id)}
                  className={`px-5 py-2.5 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer shrink-0 flex items-center gap-2.5 ${
                    isActive
                      ? "bg-stone-900 text-white shadow-md"
                      : "bg-white/80 hover:bg-white text-stone-600 border border-stone-200/80 hover:border-stone-300"
                  }`}
                >
                  <span className="relative w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 border border-white/20">
                    <Image
                      src={item.swatchImage}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </span>
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Editorial Stage */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center"
          >
            {/* Left Column: 1:1 Macro Material Swatch Photo */}
            <div className="lg:col-span-5 relative aspect-[4/5] sm:aspect-[4/4.5] rounded-3xl overflow-hidden bg-stone-900 shadow-xl group border border-stone-200/80">
              <Image
                src={current.swatchImage}
                alt={current.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

              {/* Top Origin Tag */}
              <div className="absolute top-6 left-6">
                <span className="text-[11px] uppercase tracking-widest text-white/80 font-mono bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15">
                  Origin · {current.origin}
                </span>
              </div>

              {/* Bottom Swatch Metadata */}
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <h3 className="text-2xl sm:text-3xl font-sans font-bold leading-tight tracking-tight">
                  {current.name}
                </h3>
                <p className="text-xs text-white/80 font-normal mt-1">
                  {current.subtitle}
                </p>
              </div>
            </div>

            {/* Right Column: Crafted Furniture Piece & Editorial Story */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
              {/* Editorial Description */}
              <div>
                <p className="text-base sm:text-xl font-sans font-normal text-stone-700 leading-relaxed max-w-xl">
                  &ldquo;{current.editorialQuote}&rdquo;
                </p>
              </div>

              {/* Crafted Piece Feature Banner */}
              <div className="relative rounded-2xl overflow-hidden bg-stone-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg border border-stone-800">
                {/* Background Furniture Preview with Overlay */}
                <div className="absolute inset-0">
                  <Image
                    src={current.furnitureImage}
                    alt={current.furnitureTitle}
                    fill
                    className="object-cover object-center brightness-[0.45]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-transparent pointer-events-none" />
                </div>

                {/* Left Piece Details */}
                <div className="relative z-10 space-y-1.5 max-w-sm">
                  <span className="text-[10px] uppercase tracking-widest text-[#E08A50] font-mono font-bold block">
                    Tailored Commission
                  </span>
                  <h4 className="text-xl sm:text-2xl font-sans font-bold text-white leading-tight tracking-tight">
                    {current.furnitureTitle}
                  </h4>
                  <p className="text-xs text-stone-300 font-light pt-1">
                    Direct Atelier Price: <span className="font-bold text-white">{current.furniturePrice}</span>
                  </p>
                </div>

                {/* Action Inquire Link */}
                <div className="relative z-10 shrink-0">
                  <a
                    href="#custom"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-stone-950 hover:bg-stone-100 text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md"
                  >
                    <span>Inquire Piece</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-stone-950" />
                  </a>
                </div>
              </div>

              {/* Authentic Technical Specs Grid */}
              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-stone-200/80">
                {current.specs.map((s, idx) => (
                  <div key={idx} className="space-y-1">
                    <span className="text-[11px] uppercase tracking-widest text-stone-400 font-mono block">
                      {s.label}
                    </span>
                    <p className="text-sm sm:text-base font-sans font-bold text-stone-900 tracking-tight">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}


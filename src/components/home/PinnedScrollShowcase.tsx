"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { ArrowRight, Compass, Shield, Ruler } from "lucide-react";

const scrollItems = [
  {
    step: "01",
    badge: "Bespoke Seating",
    title: "Sculptural Bouclé & Slate Armchair",
    desc: "Engineered with Italian Ligurian slate arm-inlays and generational European white oak frame. Tailored for contemplative living.",
    specs: ["Custom Seat Height", "Natural Matte Honed Slate", "Italian Bouclé"],
    price: "From ₹85,000",
    image: "/hero/cutout-chair.jpg",
  },
  {
    step: "02",
    badge: "Monolithic Dining",
    title: "The Monolith Slate Dining Table",
    desc: "Flame-textured 20mm natural slate cut directly from ancient quarries. Resilient to boiling cookware, knives, and wine stains.",
    specs: ["Custom Length: 160–320 cm", "Fluted Oak Pedestal Base", "Thermal & Scratch Proof"],
    price: "From ₹2,45,000",
    image: "/hero/cutout-table.jpg",
  },
  {
    step: "03",
    badge: "Architectural Bedroom",
    title: "Aura Low-Profile Slate Bedstead",
    desc: "A grounding platform sanctuary featuring a single, continuous slate monolith headboard with gentle ambient warm illumination.",
    specs: ["Custom Mattress Proportions", "Smoked American Ash", "Integrated Ambient Wiring"],
    price: "From ₹2,75,000",
    image: "/hero/cutout-bed.jpg",
  },
];

export default function PinnedScrollShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalHeight = containerRef.current.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;

      if (scrolled <= 0) {
        setActiveIndex(0);
      } else {
        const progress = Math.min(Math.max(scrolled / totalHeight, 0), 1);
        const index = Math.min(
          Math.floor(progress * scrollItems.length),
          scrollItems.length - 1
        );
        setActiveIndex(index);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const current = scrollItems[activeIndex];

  return (
    <section
      ref={containerRef}
      className="relative bg-[#FAF8F5] text-stone-900 border-t border-stone-200/70"
      style={{ height: "300vh" }}
    >
      {/* Sticky Fullscreen Viewport */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between p-6 sm:p-12 lg:px-20 overflow-hidden">
        
        {/* Top Minimal Info Bar */}
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full pt-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-medium">
              Bespoke Gallery
            </span>
            <span className="w-8 h-[1px] bg-stone-300" />
            <span className="text-xs font-serif font-bold text-stone-900">
              0{activeIndex + 1} / 03
            </span>
          </div>

          <div className="flex items-center gap-2">
            {scrollItems.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === activeIndex
                    ? "w-8 bg-stone-900"
                    : "w-2 bg-stone-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Center Stage: Split Screen with 3D Floating Cutout (Center) & Content (Left/Right) */}
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-4">
          
          {/* Left Column: Editorial Information */}
          <div className="lg:col-span-5 space-y-5 text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-stone-200 text-[#E08A50] text-[11px] uppercase tracking-[0.2em] font-medium shadow-xs">
              <Compass className="w-3.5 h-3.5" />
              <span>{current.badge}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 leading-tight transition-all duration-500">
              {current.title}
            </h2>

            <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed max-w-md">
              {current.desc}
            </p>

            {/* Architectural Specs List */}
            <div className="space-y-2 pt-2">
              {current.specs.map((sp, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-stone-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E08A50]" />
                  <span>{sp}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 block">Custom Estimate</span>
                <span className="text-base font-semibold text-stone-900">{current.price}</span>
              </div>
              <a
                href="#contact"
                className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs uppercase tracking-wider font-medium flex items-center gap-2 transition-all shadow-sm"
              >
                <span>Commission Piece</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right Column: 3D Floating Cutout Stage */}
          <div className="lg:col-span-7 relative h-[320px] sm:h-[440px] lg:h-[500px] flex items-center justify-center">
            
            {/* Soft Ambient Radial Floor Glow */}
            <div className="absolute w-[320px] sm:w-[450px] h-[320px] sm:h-[450px] bg-gradient-to-tr from-[#EBE6DB] to-transparent rounded-full blur-2xl opacity-60 pointer-events-none" />

            {/* Dynamic Swapping 3D Cutout Items */}
            {scrollItems.map((item, idx) => (
              <div
                key={item.step}
                className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out ${
                  idx === activeIndex
                    ? "opacity-100 scale-100 translate-y-0 rotate-0"
                    : idx < activeIndex
                    ? "opacity-0 scale-90 -translate-y-16 rotate-[-4deg] pointer-events-none"
                    : "opacity-0 scale-110 translate-y-16 rotate-[4deg] pointer-events-none"
                }`}
              >
                <div className="relative w-full h-full max-w-[440px] max-h-[440px] animate-float">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    priority={idx === 0}
                    className="object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.12)] mix-blend-multiply"
                    sizes="(max-width: 1024px) 90vw, 500px"
                  />
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom Scroll Cue */}
        <div className="max-w-7xl mx-auto w-full pb-4 flex items-center justify-between text-[11px] text-stone-400">
          <span>Scroll down to cycle through custom furniture works</span>
          <span className="hidden sm:inline">Crafted by Averto Studio</span>
        </div>

      </div>
    </section>
  );
}

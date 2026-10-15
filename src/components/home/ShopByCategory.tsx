"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import TextReveal from "@/components/motion/TextReveal";

interface CategoryItem {
  id: string;
  name: string;
  count: string;
  image: string;
  href: string;
  // Optional zoom to crop away a built-in white frame/caption baked into the photo
  zoomClass?: string;
}

const categories: CategoryItem[] = [
  {
    id: "sofas",
    name: "Sofas",
    count: "14 Designs",
    image: "/hero/modular-sofa.jpg",
    href: "/collections?category=sofas",
  },
  {
    id: "seating",
    name: "Seating",
    count: "18 Designs",
    image: "/hero/chair.jpg",
    href: "/collections?category=seating",
  },
  {
    id: "dining",
    name: "Dining",
    count: "10 Designs",
    image: "/hero/dining-table.jpg",
    href: "/collections?category=dining",
  },
  {
    id: "beds",
    name: "Beds",
    count: "8 Designs",
    image: "/hero/bed.jpg",
    href: "/collections?category=beds",
  },
  {
    id: "storage",
    name: "Storage",
    count: "12 Designs",
    image: "/hero/fluted-credenza.jpg",
    href: "/collections?category=storage",
  },
  {
    id: "lighting",
    name: "Lighting",
    count: "16 Designs",
    image: "/hero/pendant-chandelier.jpg",
    href: "/collections?category=lighting",
  },
  {
    id: "tables",
    name: "Tables",
    count: "15 Designs",
    image: "/hero/card-coffee.jpg",
    href: "/collections?category=tables",
    zoomClass: "scale-[1.18]",
  },
  {
    id: "consoles",
    name: "Consoles",
    count: "9 Designs",
    image: "/hero/card-console.jpg",
    href: "/collections?category=consoles",
  },
  {
    id: "leather",
    name: "Leather",
    count: "11 Designs",
    image: "/hero/saddle-chair.jpg",
    href: "/collections?category=leather",
  },
  {
    id: "atelier",
    name: "Atelier",
    count: "7 Designs",
    image: "/hero/table.jpg",
    href: "/collections",
  },
];

export default function ShopByCategory() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScroll - 10);

    if (maxScroll > 0) {
      setScrollProgress(Math.min(Math.max(scrollLeft / maxScroll, 0), 1));
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const distance = 340;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  return (
    <section className="w-full bg-[#FAF8F5] pt-8 pb-6 sm:pt-12 sm:pb-8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Minimal Editorial Header with Integrated Action Arrows */}
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.22em] text-stone-600 font-bold block mb-1.5">
              Curated Collections
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold text-[#111110] tracking-tight">
              <TextReveal text="Shop By Category" />
            </h2>
          </div>

          {/* Minimalist Top-Right Arrow Buttons (Desktop) */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              aria-label="Previous categories"
              className="w-10 h-10 rounded-full border border-stone-400 hover:border-stone-950 text-stone-900 bg-white hover:bg-stone-900 hover:text-white disabled:opacity-30 disabled:border-stone-200 disabled:text-stone-400 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              aria-label="Next categories"
              className="w-10 h-10 rounded-full border border-stone-400 hover:border-stone-950 text-stone-900 bg-white hover:bg-stone-900 hover:text-white disabled:opacity-30 disabled:border-stone-200 disabled:text-stone-400 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Squircle Categories Track */}
        <div
          ref={scrollRef}
          className="flex items-center gap-5 sm:gap-7 overflow-x-auto scrollbar-none scroll-smooth pb-4 snap-x snap-mandatory touch-pan-y"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group flex flex-col items-center shrink-0 snap-start text-center focus:outline-none"
            >
              {/* Ultra-Clean Squircle Photo Container */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-[1.75rem] sm:rounded-[2rem] overflow-hidden bg-[#ECE8E1] border border-stone-300 group-hover:border-stone-500 shadow-[0_4px_16px_rgba(0,0,0,0.04)] group-hover:shadow-[0_10px_25px_rgba(0,0,0,0.09)] transition-all duration-500">
                <div className={`absolute inset-0 ${item.zoomClass ?? ""}`}>
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
                    sizes="(max-width: 640px) 112px, 144px"
                  />
                </div>
                {/* Gentle Ambient Warm Sheen on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Minimal Single-Word Label + Item Count */}
              <div className="mt-3.5 flex flex-col items-center">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.14em] text-stone-900 group-hover:text-[#E08A50] transition-colors leading-none">
                  {item.name}
                </span>
                <span className="text-[11px] text-stone-600 font-medium mt-1 tracking-normal">
                  {item.count}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Slim Editorial Progress Track Bar */}
        <div className="mt-4 sm:mt-5 max-w-xs mx-auto h-[2px] bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-stone-800 rounded-full transition-all duration-200 ease-out"
            style={{
              width: "35%",
              transform: `translateX(${scrollProgress * 185}%)`,
            }}
          />
        </div>

      </div>
    </section>
  );
}

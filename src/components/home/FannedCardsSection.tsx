"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Star, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import TextReveal from "@/components/motion/TextReveal";

const posterCards = [
  {
    id: "card-1",
    rating: "9.8",
    badge: "BESPOKE",
    title: "The Monolith Slate Table",
    specs: "20mm Flame Slate · Fluted Oak",
    category: "Dining Centerpiece",
    price: "₹2,45,000",
    image: "/hero/dining-table.jpg",
  },
  {
    id: "card-2",
    rating: "9.5",
    badge: "SIGNATURE",
    title: "Sculptural Bouclé Chair",
    specs: "Ligurian Slate Inlays · American Oak",
    category: "Bespoke Seating",
    price: "₹85,000",
    image: "/hero/chair.jpg",
  },
  {
    id: "card-3",
    rating: "9.9",
    badge: "ARCHITECTURAL",
    title: "Aura Low-Profile Bed",
    specs: "Backlit Slate Slab · Smoked Ash",
    category: "Sanctuary Series",
    price: "₹2,75,000",
    image: "/hero/bed.jpg",
  },
  {
    id: "card-4",
    rating: "9.7",
    badge: "NEW ARRIVAL",
    title: "Serpentine Modular Sofa",
    specs: "Textured Cream Bouclé · Slate Plinth",
    category: "Living Pavilion",
    price: "₹3,40,000",
    image: "/hero/modular-sofa.jpg",
  },
  {
    id: "card-5",
    rating: "9.4",
    badge: "CRAFTED",
    title: "Nero Marquina Credenza",
    specs: "Smoked Oak · Honed Black Marble Slab",
    category: "Editorial Storage",
    price: "₹1,95,000",
    image: "/hero/fluted-credenza.jpg",
  },
  {
    id: "card-6",
    rating: "9.9",
    badge: "ILLUMINATION",
    title: "Solstice Geometric Chandelier",
    specs: "Brushed Brass · Frosted Alabaster Glass",
    category: "Architectural Lighting",
    price: "₹1,45,000",
    image: "/hero/pendant-chandelier.jpg",
  },
  {
    id: "card-7",
    rating: "9.3",
    badge: "BESPOKE",
    title: "Solstice Wall Console",
    specs: "Raw Slate Cut · Brushed Champagne Brass",
    category: "Foyer & Gallery",
    price: "₹1,15,000",
    image: "/hero/card-console.jpg",
  },
  {
    id: "card-8",
    rating: "9.6",
    badge: "HANDCRAFTED",
    title: "Saddle Leather Lounge Chair",
    specs: "Full-Grain Caramel Leather · Solid Walnut",
    category: "Contemplation Chair",
    price: "₹1,25,000",
    image: "/hero/saddle-chair.jpg",
  },
  {
    id: "card-9",
    rating: "9.1",
    badge: "LIMITED",
    title: "Round Slate Coffee Table",
    specs: "Chiseled Natural Rim · Solid White Oak",
    category: "Living Core",
    price: "₹89,000",
    image: "/hero/card-coffee.jpg",
  },
  {
    id: "card-10",
    rating: "9.4",
    badge: "ARCHITECTURAL",
    title: "Cantilevered Travertine Desk",
    specs: "Honed Roman Travertine · Matte Slate Legs",
    category: "Executive Atelier",
    price: "₹2,25,000",
    image: "/hero/table.jpg",
  },
];

const START_INDEX = 3; // Serpentine Modular Sofa (balanced with 3 cards on left and 6 on right)

// Calculate shortest circular difference on a looping ring of N cards
function getCircularDiff(index: number, active: number, total: number) {
  let diff = (index - active) % total;
  while (diff > total / 2) diff -= total;
  while (diff < -total / 2) diff += total;
  return diff;
}

export default function FannedCardsSection() {
  const [activeFloat, setActiveFloat] = useState<number>(START_INDEX);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalCards = posterCards.length;
  const activeInt =
    ((Math.round(activeFloat) % totalCards) + totalCards) % totalCards;

  const nextCard = () => {
    setActiveFloat((prev) => prev + 1);
  };

  const prevCard = () => {
    setActiveFloat((prev) => prev - 1);
  };

  const handleCardClick = (idx: number) => {
    if (isSwipingRef.current) return;
    const diff = getCircularDiff(idx, activeFloat, totalCards);
    setActiveFloat((prev) => prev + diff);
  };

  // Touch Swipe Gesture Handling for Mobile
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);
  const isSwipingRef = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchDeltaXRef.current = 0;
    isSwipingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartXRef.current;
    const diffY = currentY - touchStartYRef.current;

    // Detect horizontal swipe intent vs vertical scroll
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      isSwipingRef.current = true;
      touchDeltaXRef.current = diffX;
    }
  };

  const handleTouchEnd = () => {
    const deltaX = touchDeltaXRef.current;
    const threshold = 40; // minimum swipe distance in pixels

    if (deltaX < -threshold) {
      // Swiped left -> Next card
      nextCard();
    } else if (deltaX > threshold) {
      // Swiped right -> Previous card
      prevCard();
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchDeltaXRef.current = 0;
    isSwipingRef.current = false;
  };

  const getCardPhysics = (index: number) => {
    // Infinite circular distance ensures cards are always visible on BOTH left and right
    const diff = getCircularDiff(index, activeFloat, totalCards);
    const absDiff = Math.abs(diff);
    const isHovered = hoveredIndex === index && absDiff > 0.3;

    // Visible window: ±3.8 cards fan out horizontally; farther cards stack smoothly behind
    const clampedDiff = Math.sign(diff) * Math.min(absDiff, 3.8);
    const rotationY = clampedDiff * -14; // 3D Y-axis tilt towards center
    const rotationZ = clampedDiff * 5.2; // subtle fan tilt
    const translateX = clampedDiff * 165; // card horizontal spreading within container
    const translateY = Math.pow(Math.min(absDiff, 3.5), 1.35) * 22; // parabolic downward curve on wings
    const translateZ = -absDiff * 65; // depth receding into background
    const scale = Math.max(1.08 - absDiff * 0.09, 0.72);
    const zIndex = Math.round(30 - absDiff * 4);

    // Cards beyond ±3.6 positions fade away gracefully around the back
    const opacity =
      absDiff > 3.6
        ? Math.max(1 - (absDiff - 3.6) * 1.5, 0)
        : Math.max(1 - absDiff * 0.16, 0.42);

    const blur = absDiff > 2.0 ? Math.min((absDiff - 2.0) * 1.8, 6) : 0;

    // Grayscale logic: Center card is 0% grayscale (vibrant color)
    // Side cards smoothly become 100% grayscale (pure black & white)
    let grayscale = Math.min(absDiff * 1.25, 1);
    if (isHovered) {
      grayscale = 0.2; // softly reveal color when user hovers a side card
    }

    const filterParts: string[] = [];
    if (grayscale > 0.01) {
      filterParts.push(`grayscale(${Math.round(grayscale * 100)}%)`);
    }
    if (absDiff > 0.4 && !isHovered) {
      const brightness = Math.max(1 - (absDiff - 0.4) * 0.12, 0.78);
      filterParts.push(`brightness(${Math.round(brightness * 100)}%)`);
    }
    if (blur > 0) {
      filterParts.push(`blur(${blur.toFixed(1)}px)`);
    }

    const filter = filterParts.length > 0 ? filterParts.join(" ") : "none";
    const pointerEvents: React.CSSProperties["pointerEvents"] =
      opacity < 0.1 ? "none" : "auto";

    return {
      transform: `perspective(1200px) translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateY(${rotationY}deg) rotateZ(${rotationZ}deg) scale(${scale})`,
      zIndex,
      opacity,
      filter,
      pointerEvents,
      transition:
        "transform 0.35s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease, filter 0.3s ease",
    };
  };

  return (
    <section className="relative z-10 w-full bg-gradient-to-b from-[#FAF8F5] via-white to-[#F7F5F0] text-stone-900 pb-16 sm:pb-24 overflow-hidden">
      
      {/* Moving Luxury Brand Ticker Ribbon */}
      <div className="w-full bg-[#141413] text-white py-3 border-y border-white/10 overflow-hidden mb-10 sm:mb-14 select-none">
        <div className="animate-marquee flex items-center gap-8 text-[11px] sm:text-xs font-sans tracking-[0.22em] uppercase font-semibold text-stone-300">
          {[...Array(2)].map((_, groupIdx) => (
            <div key={groupIdx} className="flex items-center gap-8 shrink-0">
              <span className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E08A50]" />
                AUTUMN / WINTER ATELIER RELEASE
              </span>
              <span>·</span>
              <span>NATURAL RAJASTHAN SLATE</span>
              <span>·</span>
              <span className="text-[#E08A50]">BESPOKE COMMISSION READY</span>
              <span>·</span>
              <span>HANDCRAFTED SEASONED TEAK</span>
              <span>·</span>
              <span>ALL INDIA DOORSTEP DELIVERY</span>
              <span>·</span>
              <span>ARCHITECTURAL LIVING EDITIONS</span>
              <span>·</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-16">
        
        {/* Editorial Header Left Aligned with Right Arrow Buttons (Identical to Shop By Category) */}
        <div className="flex items-end justify-between mb-8 sm:mb-12 w-full z-20">
          <div>
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.22em] text-stone-600 font-bold block mb-1.5">
              Architectural Releases
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold text-[#111110] tracking-tight">
              <TextReveal text="New Arrivals" />
            </h2>
          </div>

          {/* Minimalist Top-Right Arrow Buttons (Desktop) */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              onClick={prevCard}
              aria-label="Previous card"
              className="w-10 h-10 rounded-full border border-stone-400 hover:border-stone-950 text-stone-900 bg-white hover:bg-stone-900 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextCard}
              aria-label="Next card"
              className="w-10 h-10 rounded-full border border-stone-400 hover:border-stone-950 text-stone-900 bg-white hover:bg-stone-900 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center 3D Fanned Stage matching standard section boundaries */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full max-w-5xl mx-auto h-[480px] sm:h-[540px] flex items-center justify-center touch-pan-y select-none"
        >
          {/* Subtle Ambient Radial Stage Light */}
          <div className="absolute w-[680px] h-[380px] bg-gradient-to-t from-stone-200/40 via-stone-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />

          {posterCards.map((card, idx) => {
            const isCenter = idx === activeInt;
            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(idx)}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={getCardPhysics(idx)}
                className={`absolute w-[240px] sm:w-[290px] h-[370px] sm:h-[430px] rounded-3xl overflow-hidden cursor-pointer select-none bg-stone-900 border transition-all duration-300 ${
                  isCenter
                    ? "shadow-[0_30px_70px_rgba(0,0,0,0.38)] border-stone-500/80 ring-2 ring-white/30"
                    : "shadow-[0_15px_35px_rgba(0,0,0,0.22)] border-stone-800/60"
                }`}
              >
                {/* Poster Background Image */}
                <div className="absolute inset-0">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 240px, 290px"
                  />
                  {/* Cinematic Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/60" />
                </div>

                {/* Top Badges */}
                <div className="relative z-10 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-[#F5A623] text-stone-950 px-2 py-0.5 rounded-md text-[11px] font-bold shadow-sm">
                    <Star className="w-3 h-3 fill-stone-950" />
                    <span>{card.rating}</span>
                  </div>
                  <span className="bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-md border border-white/10">
                    {card.badge}
                  </span>
                </div>

                {/* Bottom Poster Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10 text-white">
                  <span className="text-[10px] uppercase tracking-wider text-[#E08A50] font-semibold block mb-0.5">
                    {card.category}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold font-sans tracking-tight text-white leading-tight drop-shadow-md">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-stone-300 mt-1 font-light tracking-wide truncate">
                    {card.specs}
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/90">{card.price}</span>
                    <span className="text-[10px] uppercase tracking-wider text-stone-300 flex items-center gap-1 group-hover:text-white">
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

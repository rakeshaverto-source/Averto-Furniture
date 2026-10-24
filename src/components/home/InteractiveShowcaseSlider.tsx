"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import TextReveal from "@/components/motion/TextReveal";
import { formatPrice } from "@/data/collections";

// A product ticked "Show in the signature slider" in admin
export interface ShowcasePiece {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  badge: string;
  description: string;
  priceInr: number;
  image: string;
  zoomClass?: string;
  // Second photo of the piece, used for the round material frame when its category has no texture
  detailImage?: string;
}

// Colour and material photo per category; any other category takes a colour from FALLBACK_GRADIENTS in turn
const CATEGORY_LOOKS: Record<string, { bgGradient: string; texture?: string; textureAlt?: string }> = {
  leather: { bgGradient: "from-[#8B481D] via-[#663212] to-[#3B1B08]", texture: "/hero/yarwood-leather-rolls.jpg", textureAlt: "Full-grain leather rolls" },
  seating: { bgGradient: "from-[#2A5C4F] via-[#1D4439] to-[#122A23]", texture: "/hero/sage-fabric-swatch.png", textureAlt: "Textured upholstery fabric" },
  dining: { bgGradient: "from-[#2A3036] via-[#1D2226] to-[#111417]", texture: "/hero/slate-texture.jpg", textureAlt: "Flame-honed slate surface" },
  tables: { bgGradient: "from-[#2A3036] via-[#1D2226] to-[#111417]", texture: "/hero/slate-texture.jpg", textureAlt: "Flame-honed slate surface" },
  beds: { bgGradient: "from-[#4D3830] via-[#382822] to-[#251A16]" },
};
const FALLBACK_GRADIENTS = [
  "from-[#4D3830] via-[#382822] to-[#251A16]",
  "from-[#2A5C4F] via-[#1D4439] to-[#122A23]",
  "from-[#8B481D] via-[#663212] to-[#3B1B08]",
  "from-[#2A3036] via-[#1D2226] to-[#111417]",
];

function lookFor(piece: ShowcasePiece, index: number) {
  const look = CATEGORY_LOOKS[piece.categoryId];
  return {
    bgGradient: look?.bgGradient ?? FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length],
    texture: look?.texture ?? piece.detailImage ?? piece.image,
    textureAlt: look?.textureAlt ?? `${piece.name}, detail`,
  };
}

export default function InteractiveShowcaseSlider({ pieces }: { pieces: ShowcasePiece[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  if (pieces.length === 0) return null;

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % pieces.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + pieces.length) % pieces.length);
  };

  // The list can shrink after an admin change while the page is open
  const index = currentIndex % pieces.length;
  const current = pieces[index];
  const look = lookFor(current, index);
  const href = `/products/${current.id}`;

  return (
    <section id="showcase" className="w-full bg-[#FAF8F5] scroll-mt-24 pt-4 pb-14 sm:pt-6 sm:pb-20 px-4 sm:px-8 lg:px-16 overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Section Header matching exact design system */}
        <div className="max-w-3xl mb-6 sm:mb-8">
          <span className="text-[11px] sm:text-xs uppercase tracking-[0.22em] text-stone-600 font-bold block mb-1.5 font-sans">
            Tactile Material Archive
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold text-[#111110] tracking-tight">
            <TextReveal text="Signature Monolith Editions" />
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-sans font-normal leading-relaxed mt-2 max-w-xl">
            Experience our iconic hand-split Rajasthan slate, full-grain saddle leather, and cloud-weave bouclé crafted into monolithic statement centerpieces.
          </p>
        </div>

        {/* Hero Slider Stage */}
        <div
          className={`relative w-full bg-gradient-to-br ${look.bgGradient} text-white shadow-2xl overflow-hidden transition-colors duration-700 rounded-[2rem] sm:rounded-[2.5rem] lg:min-h-[580px] flex items-center border border-white/10`}
        >
          {/* Left Circular Semi-Circle Texture Frame with Roll-in & Scale Animation (desktop; phones get a small swatch by the title) */}
          <div className="hidden lg:block absolute -left-44 top-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full overflow-hidden border-8 border-white/20 shadow-[0_0_60px_rgba(0,0,0,0.6)] z-20 group bg-stone-900 flex-shrink-0">
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={current.id + "-circle"}
                initial={{ opacity: 0, scale: 0.85, rotate: direction * 25 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 1.1, rotate: -direction * 25 }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full h-full"
              >
                <Image
                  src={look.texture}
                  alt={look.textureAlt}
                  fill
                  className="object-cover scale-105 group-hover:scale-110 transition-transform duration-700"
                  sizes="480px"
                />
              </m.div>
            </AnimatePresence>
            {/* Subtle Vignette on Circle Edge */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20 pointer-events-none" />
          </div>

          {/* Main Content Grid */}
          <div className="relative z-20 w-full h-full grid grid-cols-1 lg:grid-cols-12 items-center gap-6 sm:gap-8 lg:gap-0 p-5 sm:p-10 lg:py-12 lg:px-16">

            {/* Spacer / Left Circle Offset */}
            <div className="hidden lg:block lg:col-span-3" />

            {/* Center Content Column with Staggered Fade-Slide Animation */}
            <div className="order-2 lg:order-none lg:col-span-5 lg:pl-4 lg:pr-2 flex flex-col justify-center lg:min-h-[300px]">
              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={current.id + "-text"}
                  initial={{ opacity: 0, y: direction * 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -direction * 22 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col justify-center"
                >
                  {/* Badge or category, with the material swatch beside it on phones */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="lg:hidden relative h-11 w-11 flex-none rounded-full overflow-hidden border-2 border-white/30 shadow-md">
                      <Image src={look.texture} alt={look.textureAlt} fill className="object-cover" sizes="44px" />
                    </span>
                    <m.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                      transition={{ delay: 0.05, duration: 0.4 }}
                      className="text-[11px] sm:text-xs uppercase font-sans tracking-[0.22em] sm:tracking-[0.25em] text-white/70 font-semibold"
                    >
                      {current.badge || "Signature Edition"}
                    </m.p>
                  </div>

                  {/* Product name, links to its page */}
                  <m.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08, duration: 0.5 }}
                    className="text-[28px] sm:text-4xl lg:text-[44px] font-sans font-black tracking-tight leading-[1.05] uppercase text-white mb-2"
                  >
                    <Link href={href} className="hover:underline decoration-2 underline-offset-[6px]">
                      {current.name}
                    </Link>
                  </m.h3>

                  {/* Category */}
                  <m.p
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 0.9, x: 0 }}
                    transition={{ delay: 0.12, duration: 0.5 }}
                    className="font-serif italic text-2xl sm:text-3xl lg:text-[36px] leading-tight text-white/90 mb-5"
                  >
                    {current.categoryName}
                  </m.p>

                  <p className="text-xs sm:text-sm text-white/75 line-clamp-3 sm:line-clamp-2 max-w-sm mb-6 sm:mb-7 font-sans leading-relaxed">
                    {current.description}
                  </p>
                </m.div>
              </AnimatePresence>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-5">
                <Link
                  href={href}
                  className="px-5 sm:px-7 py-3 whitespace-nowrap rounded-full bg-white text-stone-950 hover:bg-stone-100 text-xs font-bold uppercase tracking-wider transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-stone-900" />
                  <span>Buy Now · {formatPrice(current.priceInr)}</span>
                </Link>

                {/* Round Arrow Buttons */}
                {pieces.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevSlide}
                      aria-label="Previous piece"
                      className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-90 backdrop-blur-md cursor-pointer shadow-sm"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextSlide}
                      aria-label="Next piece"
                      className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-90 backdrop-blur-md cursor-pointer shadow-sm"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Product Photo Column with 3D Float & Spring Reveal */}
            <div className="order-1 lg:order-none lg:col-span-4 flex items-center justify-center relative">
              <div className="relative w-full aspect-square max-w-[340px] sm:max-w-[380px] flex items-center justify-center">
                <AnimatePresence mode="wait" initial={false}>
                  <m.div
                    key={current.id + "-product"}
                    initial={{ opacity: 0, x: direction * 45, scale: 0.92, rotate: direction * 3 }}
                    animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, x: -direction * 45, scale: 0.92, rotate: -direction * 3 }}
                    transition={{
                      type: "spring",
                      stiffness: 280,
                      damping: 24,
                    }}
                    className="relative w-full h-full flex items-center justify-center"
                  >
                    {/* Floating subtle ambient hover micro-animation */}
                    <m.div
                      animate={{ y: [0, -7, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="relative w-full h-full"
                    >
                      <Link
                        href={href}
                        aria-label={`View ${current.name}`}
                        className="group/photo block relative w-full h-full rounded-[1.75rem] overflow-hidden bg-white ring-1 ring-white/20 shadow-[0_24px_48px_rgba(0,0,0,0.45)]"
                      >
                        <Image
                          src={current.image}
                          alt={current.name}
                          fill
                          className={`object-cover transition-transform duration-700 group-hover/photo:scale-105 ${current.zoomClass ?? ""}`}
                          sizes="(max-width: 640px) 340px, 380px"
                        />
                        <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-900 shadow">
                          View piece →
                        </span>
                      </Link>
                    </m.div>
                  </m.div>
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

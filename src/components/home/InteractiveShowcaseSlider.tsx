"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import TextReveal from "@/components/motion/TextReveal";

interface ShowcaseSlide {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  price: string;
  specs: string[];
  themeColor: string;
  bgGradient: string;
  swatchLabel: string;
  swatchSublabel: string;
  circularTextureImage: string;
  circularTextureAlt: string;
  heroProductCutout: string;
  heroProductAlt: string;
}

const slides: ShowcaseSlide[] = [
  {
    id: "leather-rolls",
    category: "Artisanal Saddle Hide",
    title: "YARWOOD",
    subtitle: "LEATHER LOUNGE",
    tagline: "Full-Grain Caramel & Cobalt Leather Swatches with Smoked Walnut",
    description:
      "Hand-selected European full-grain hides steeped in natural mimosa and chestnut bark. Tailored over an ergonomic white ash cradle, developing a deep organic patina with generational use.",
    price: "₹1,25,000",
    specs: ["Yarwood Full Grain", "Zero Artificial PU", "Natural Wax Patina"],
    themeColor: "#934E22",
    bgGradient: "from-[#8B481D] via-[#663212] to-[#3B1B08]",
    swatchLabel: "YARWOOD LEATHER",
    swatchSublabel: "Full Grain Leather Rolls",
    circularTextureImage: "/hero/yarwood-leather-rolls.jpg",
    circularTextureAlt: "Yarwood Leather colored roll swatches",
    heroProductCutout: "/hero/chair-whitebg.jpg",
    heroProductAlt: "Yarwood Saddle Lounge Chair",
  },
  {
    id: "sage-boucle",
    category: "Tactile Looped Textile",
    title: "VERDANT",
    subtitle: "BOUCLÉ ARMCHAIR",
    tagline: "Fine-Woven Textured Sage Green Fabric & Slate Tablets",
    description:
      "Plush woven yarn with cloud-like tactile texture. Engineered with heavy domestic rub counts, organic stain-repellent backing, and hand-honed slate arm inlays.",
    price: "₹85,000",
    specs: ["Sage Weave Fabric", "Ligurian Slate Arms", "80,000 Rub Count"],
    themeColor: "#2F6557",
    bgGradient: "from-[#2A5C4F] via-[#1D4439] to-[#122A23]",
    swatchLabel: "TEXTILE ARCHIVE",
    swatchSublabel: "Tactile Green Weave",
    circularTextureImage: "/hero/sage-fabric-swatch.png",
    circularTextureAlt: "Sage green textured upholstery fabric swatch",
    heroProductCutout: "/hero/chair-whitebg.jpg",
    heroProductAlt: "Verdant Bouclé Armchair",
  },
  {
    id: "slate-dining",
    category: "Signature Monolith",
    title: "LIGURIAN",
    subtitle: "SLATE TABLE",
    tagline: "Flame-Honed European Slate & Fluted Smoked Oak",
    description:
      "Handcrafted from a continuous 20mm monolithic slate slab. Naturally heat-proof, stain-resistant, and impervious to wine or boiling cast iron cookware. Supported by solid fluted oak pedestals.",
    price: "₹2,45,000",
    specs: ["Flame-Honed Slate", "100% Heat-Proof", "Custom 160–340 cm"],
    themeColor: "#2F353B",
    bgGradient: "from-[#2A3036] via-[#1D2226] to-[#111417]",
    swatchLabel: "FLAME-HONED SLATE",
    swatchSublabel: "Natural Monolithic Stone",
    circularTextureImage: "/hero/slate-texture.jpg",
    circularTextureAlt: "Flame-honed natural Ligurian slate surface texture",
    heroProductCutout: "/hero/table-whitebg.jpg",
    heroProductAlt: "Averto Monolith Slate Dining Table",
  },
  {
    id: "low-profile-bed",
    category: "Sanctuary Pavilion",
    title: "AURA SLATE",
    subtitle: "PLATFORM BED",
    tagline: "Floating Monolithic Headboard with Integrated Luminescence",
    description:
      "A grounding low-profile timber bedstead anchored by an expansive slate slab headboard. Engineered with warm concealed halo backlighting and integrated brass bedside tablets.",
    price: "₹2,75,000",
    specs: ["Backlit Natural Slate", "Smoked Ash Timber", "Hidden Floating Base"],
    themeColor: "#5A443A",
    bgGradient: "from-[#4D3830] via-[#382822] to-[#251A16]",
    swatchLabel: "MONOLITHIC SLATE",
    swatchSublabel: "Architectural Bedstead",
    circularTextureImage: "/hero/bed.jpg",
    circularTextureAlt: "Monolithic slate headboard architectural detail",
    heroProductCutout: "/hero/bed-whitebg.jpg",
    heroProductAlt: "Aura Low-Profile Slate Platform Bed",
  },
];

export default function InteractiveShowcaseSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const current = slides[currentIndex];

  return (
    <section className="w-full bg-[#FAF8F5] pt-4 pb-14 sm:pt-6 sm:pb-20 px-4 sm:px-8 lg:px-16 overflow-hidden">
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
          className={`relative w-full rounded-[2.5rem] bg-gradient-to-br ${current.bgGradient} text-white shadow-2xl overflow-hidden transition-colors duration-700 min-h-[500px] sm:min-h-[540px] lg:min-h-[580px] flex items-center border border-white/10`}
        >
          {/* Left Circular Semi-Circle Texture Frame with Roll-in & Scale Animation */}
          <div className="absolute -left-28 sm:-left-36 lg:-left-44 top-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 lg:w-[480px] lg:h-[480px] rounded-full overflow-hidden border-4 sm:border-8 border-white/20 shadow-[0_0_60px_rgba(0,0,0,0.6)] z-20 group bg-stone-900 flex-shrink-0">
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
                  src={current.circularTextureImage}
                  alt={current.circularTextureAlt}
                  fill
                  className="object-cover scale-105 group-hover:scale-110 transition-transform duration-700"
                  sizes="(max-width: 1024px) 380px, 480px"
                  priority
                />
              </m.div>
            </AnimatePresence>
            {/* Subtle Vignette on Circle Edge */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20 pointer-events-none" />
          </div>

          {/* Main Content Grid */}
          <div className="relative z-20 w-full h-full grid grid-cols-1 lg:grid-cols-12 items-center py-12 px-6 sm:px-12 lg:px-16">
            
            {/* Spacer / Left Circle Offset */}
            <div className="hidden lg:block lg:col-span-3" />

            {/* Center Content Column with Staggered Fade-Slide Animation */}
            <div className="lg:col-span-5 pl-24 sm:pl-32 lg:pl-4 pr-2 flex flex-col justify-center min-h-[300px]">
              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={current.id + "-text"}
                  initial={{ opacity: 0, y: direction * 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -direction * 22 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col justify-center"
                >
                  {/* Category / Sub-tag */}
                  <m.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ delay: 0.05, duration: 0.4 }}
                    className="text-xs uppercase font-sans tracking-[0.25em] text-white/70 font-semibold mb-3"
                  >
                    {current.category}
                  </m.p>

                  {/* Title */}
                  <m.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08, duration: 0.5 }}
                    className="text-3xl sm:text-5xl lg:text-[54px] font-sans font-black tracking-tight leading-[1.05] uppercase text-white mb-2"
                  >
                    {current.title}
                  </m.h3>

                  {/* Subtitle */}
                  <m.p
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 0.9, x: 0 }}
                    transition={{ delay: 0.12, duration: 0.5 }}
                    className="font-serif italic text-2xl sm:text-4xl lg:text-[42px] leading-tight text-white/90 mb-5"
                  >
                    {current.subtitle}
                  </m.p>

                  {/* 1-sentence craft summary */}
                  <p className="text-xs sm:text-sm text-white/75 line-clamp-2 max-w-sm mb-7 font-sans leading-relaxed">
                    {current.description}
                  </p>
                </m.div>
              </AnimatePresence>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                <a
                  href="#custom"
                  className="px-7 py-3 rounded-full bg-white text-stone-950 hover:bg-stone-100 text-xs font-bold uppercase tracking-wider transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-stone-900" />
                  <span>Buy Now · {current.price}</span>
                </a>

                {/* Round Arrow Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevSlide}
                    aria-label="Previous slide"
                    className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-90 backdrop-blur-md cursor-pointer shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextSlide}
                    aria-label="Next slide"
                    className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-90 backdrop-blur-md cursor-pointer shadow-sm"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Product Hero Cutout Column with 3D Float & Spring Reveal */}
            <div className="lg:col-span-4 flex items-center justify-center relative mt-8 lg:mt-0 h-[280px] sm:h-[360px] lg:h-[420px]">
              <div className="relative w-full h-full max-w-[420px] flex items-center justify-center">
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
                      className="relative w-full h-full [mix-blend-mode:multiply] contrast-[1.05] brightness-[1.01]"
                    >
                      <Image
                        src={current.heroProductCutout}
                        alt={current.heroProductAlt}
                        fill
                        className="object-contain filter drop-shadow-[0_22px_32px_rgba(0,0,0,0.52)]"
                        sizes="(max-width: 640px) 260px, (max-width: 1024px) 360px, 420px"
                        priority
                      />
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


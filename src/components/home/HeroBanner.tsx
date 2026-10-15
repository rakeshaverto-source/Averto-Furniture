"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import TextReveal from "@/components/motion/TextReveal";

interface HeroSlide {
  id: string;
  badge: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  image: string;
  objectPos: string;
  ctaText: string;
  ctaHref: string;
}

const heroSlides: HeroSlide[] = [
  {
    id: "warm-living",
    badge: "2026 ARCHITECTURAL LIVING",
    titleLine1: "Design Your",
    titleLine2: "Dream Living",
    subtitle: "Curated organic luxury furniture handcrafted with natural Rajasthan slate and solid seasoned teakwood.",
    image: "/hero/warm-living-hero.jpg",
    objectPos: "object-[center_right] sm:object-center",
    ctaText: "Explore Collections",
    ctaHref: "/collections",
  },
  {
    id: "curated-villa",
    badge: "BESPOKE VILLA SUITE",
    titleLine1: "Crafted For",
    titleLine2: "Serene Interiors",
    subtitle: "Custom curved bouclé sofas, chiseled stone centerpieces, and tailored architectural lighting.",
    image: "/hero/curated-living-space.jpg",
    objectPos: "object-right sm:object-center",
    ctaText: "View Bespoke Works",
    ctaHref: "#bespoke",
  },
  {
    id: "minimal-lounge",
    badge: "MINIMALIST LIVING SUITE",
    titleLine1: "Effortless",
    titleLine2: "Spatial Luxury",
    subtitle: "Minimal silhouette sectional lounges, warm timber textures, and natural daylight ambiance.",
    image: "/hero/living-hero.jpg",
    objectPos: "object-center",
    ctaText: "Discover Living",
    ctaHref: "#seating",
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Parallax: photo drifts slower than the page, copy lifts away and fades as the hero scrolls out
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => {
      nextSlide();
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [current, isPaused]);

  const slide = heroSlides[current];

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-[580px] lg:min-h-[660px] flex items-center bg-[#F5F2EB] overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Slides */}
      <motion.div className="absolute inset-0 z-0" style={{ y: bgY }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 overflow-hidden"
          >
            {/* Slow Ken Burns zoom-out while each slide is on screen */}
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1.12 }}
              animate={{ scale: 1 }}
              transition={{ duration: 7, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Image
                src={slide.image}
                alt={`${slide.titleLine1} ${slide.titleLine2}`}
                fill
                priority
                className={`object-cover ${slide.objectPos}`}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Soft subtle warm gradient: brings back the rich photography details instead of heavy whiteout */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5]/85 via-[#FAF8F5]/45 via-45% to-transparent pointer-events-none" />
        
        {/* Seamless bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#FAF8F5] to-transparent pointer-events-none" />
      </motion.div>

      {/* Hero Content Left Aligned */}
      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 w-full py-16"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="max-w-xl">
          <h1
            key={slide.id}
            className="text-4xl sm:text-5xl lg:text-6xl font-sans text-[#1C1B19] leading-[1.1] tracking-tight font-extrabold"
          >
            <TextReveal text={slide.titleLine1} className="block" trigger="mount" />
            <TextReveal
              text={slide.titleLine2}
              className="block text-stone-900"
              trigger="mount"
              delay={0.15}
            />
          </h1>

          <motion.p
            key={`${slide.id}-subtitle`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 text-base sm:text-lg text-[#5A5750] font-light max-w-md leading-relaxed min-h-[56px]"
          >
            {slide.subtitle}
          </motion.p>

          <div className="mt-8 flex items-center gap-4">
            <a
              href={slide.ctaHref}
              className="inline-block px-8 py-3.5 rounded-xl bg-[#E08A50] hover:bg-[#cf7b43] text-white text-sm font-medium transition-all shadow-md shadow-[#E08A50]/25 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>{slide.ctaText}</span>
            </a>

            <a
              href="#contact"
              className="inline-block px-6 py-3.5 rounded-xl border border-stone-300 hover:border-stone-400 bg-white/80 hover:bg-white text-stone-800 text-sm font-medium transition-colors"
            >
              Consult Studio
            </a>
          </div>
        </div>
      </motion.div>

      {/* Slider Controls (Bottom Right) */}
      <div className="absolute bottom-10 right-6 sm:right-16 z-20 flex items-center gap-4 bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-full border border-stone-200/80 shadow-sm">
        {/* Indicators */}
        <div className="flex items-center gap-2">
{heroSlides.map((s, idx) => (   
            <button
              key={s.id}
              onClick={() => setCurrent(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                current === idx ? "w-7 bg-[#E08A50]" : "w-2 bg-stone-300 hover:bg-stone-400"
              }`}
            />
          ))}
        </div>

        <div className="w-[1px] h-4 bg-stone-300 mx-1" />

        {/* Arrow buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white text-stone-700 hover:text-stone-950 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white text-stone-700 hover:text-stone-950 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

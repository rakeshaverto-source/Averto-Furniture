"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import TextReveal from "@/components/motion/TextReveal";

interface LifestyleCard {
  id: string;
  category: string;
  headline: string;
  subheadline: string;
  description: string;
  ctaText: string;
  href: string;
  image: string;
  alt: string;
}

const lifestyleCollections: LifestyleCard[] = [
  {
    id: "living",
    category: "Living room",
    headline: "Sofas and armchairs",
    subheadline: "in bouclé and leather",
    description: "Modular sofas you can arrange to fit the room, and deep chairs to sink into.",
    ctaText: "Shop living room",
    href: "#sofas",
    image: "/hero/modular-sofa.jpg",
    alt: "Curved bouclé architectural modular sofa in modern living room",
  },
  {
    id: "dining",
    category: "Dining",
    headline: "Slate dining tables",
    subheadline: "made to your length",
    description: "20mm Rajasthan slate on fluted teak bases. Heat-proof, and built to be handed down.",
    ctaText: "Shop dining",
    href: "#dining",
    image: "/hero/dining-table.jpg",
    alt: "Natural Rajasthan slate dining table with fluted wood pedestal",
  },
  {
    id: "bedroom",
    category: "Bedroom",
    headline: "Low beds",
    subheadline: "with slate headboards",
    description: "Platform beds with a softly lit slate headboard and Belgian linen.",
    ctaText: "Shop bedroom",
    href: "#beds",
    image: "/hero/bed.jpg",
    alt: "Architectural low-profile platform bed with backlit natural stone slab",
  },
  {
    id: "accents",
    category: "Accents",
    headline: "Coffee tables",
    subheadline: "and leather chairs",
    description: "Saddle-leather lounge chairs, stone coffee tables and lighting to finish a room.",
    ctaText: "Shop accents",
    href: "#seating",
    image: "/hero/card-coffee.jpg",
    alt: "Fluted oak and natural slate circular coffee table",
  },
];

export default function ShopBySpaceSection() {
  return (
    <section className="w-full bg-[#FAF8F5] py-20 px-6 sm:px-10 lg:px-16 border-b border-stone-200/80 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header with Scroll Fade Up */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto space-y-2.5"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal text-[#111110] tracking-tight">
            <TextReveal text="Shop by room" />
          </h2>
          <p className="text-sm sm:text-base text-stone-600 font-normal max-w-md mx-auto pt-1 leading-relaxed">
            Start with the room you are furnishing.
          </p>
        </motion.div>

        {/* 2x2 Editorial Photo Grid with Curtain Reveal & Parallax */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {lifestyleCollections.map((card, idx) => (
            <SpaceCard key={card.id} card={card} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SpaceCard({ card, idx }: { card: LifestyleCard; idx: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  const ease = [0.22, 1, 0.36, 1] as const;
  const stagger = (idx % 2) * 0.15;

  return (
    <div ref={cardRef}>
      <Link
        href={card.href}
        className="group relative block aspect-[4/4] sm:aspect-[4/4.2] rounded-sm overflow-hidden transition-all duration-500"
      >
        {/* Photo + overlay open like a curtain from the bottom edge */}
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
          whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.1, delay: stagger, ease }}
        >
          {/* Background Image (taller than the card so parallax never shows an edge) */}
          <motion.div className="absolute inset-x-0 -top-[8%] -bottom-[8%]" style={{ y: imageY }}>
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1.2 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.4, delay: stagger, ease }}
            >
              <Image
                src={card.image}
                alt={card.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            </motion.div>
          </motion.div>

          {/* Rich Warm Ambient Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/40 via-45% to-stone-900/10 group-hover:from-stone-950/90 transition-all duration-500" />
        </motion.div>

        {/* Foreground Editorial Text Content */}
        <motion.div
          className="relative z-20 h-full flex flex-col justify-end p-8 sm:p-10 text-white space-y-3"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: stagger + 0.5, ease }}
        >
          {/* Category Micro-Label */}
          <span className="text-xs tracking-wide text-white/75">
            {card.category}
          </span>

          {/* Main Headline */}
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-medium leading-[1.12] text-white">
            <span>{card.headline}</span> <br />
            <span className="italic font-light text-stone-200">{card.subheadline}</span>
          </h3>

          {/* Subtitle / Description */}
          <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed max-w-md line-clamp-2">
            {card.description}
          </p>

          {/* Underlined Editorial CTA with Arrow */}
          <div className="pt-2">
            <span className="inline-flex items-center gap-2 pb-1 border-b border-white/80 text-sm text-white transition-colors">
              <span>{card.ctaText}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
            </span>
          </div>
        </motion.div>
      </Link>
    </div>
  );
}

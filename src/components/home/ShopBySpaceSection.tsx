"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { m, useScroll, useTransform } from "framer-motion";
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
    category: "FOR THE LIVING ROOM",
    headline: "Architectural Lounges.",
    subheadline: "Sculpted In Bouclé.",
    description: "Curved modular sectionals and deep-seated armchairs designed to anchor spacious modern living sanctuaries.",
    ctaText: "SHOP LIVING",
    href: "#sofas",
    image: "/hero/modular-sofa.jpg",
    alt: "Curved bouclé architectural modular sofa in modern living room",
  },
  {
    id: "dining",
    category: "FOR THE DINING SPACE",
    headline: "Monolithic Slate.",
    subheadline: "Generational Tables.",
    description: "20mm flame-cleft natural Rajasthan stone surfaces perched on fluted solid teakwood pedestals.",
    ctaText: "SHOP DINING",
    href: "#dining",
    image: "/hero/dining-table.jpg",
    alt: "Natural Rajasthan slate dining table with fluted wood pedestal",
  },
  {
    id: "bedroom",
    category: "FOR THE SANCTUARY",
    headline: "Low-Profile Beds.",
    subheadline: "Illuminated Slate.",
    description: "Backlit floating platform bedframes with hand-split stone slabs and organic Belgian linen textures.",
    ctaText: "SHOP BEDROOM",
    href: "#beds",
    image: "/hero/bed.jpg",
    alt: "Architectural low-profile platform bed with backlit natural stone slab",
  },
  {
    id: "accents",
    category: "FOR BESPOKE ACCENTS",
    headline: "Chiseled Tables.",
    subheadline: "Full-Grain Leather.",
    description: "Caramel saddle hide lounge chairs paired with live-edge stone coffee tables and statement lighting.",
    ctaText: "SHOP ACCENTS",
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
        <m.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto space-y-2.5"
        >
          <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#A66E38] font-bold block">
            Curated Spaces
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold text-[#111110] tracking-tight">
            <TextReveal text="Shop By Living Space" />
          </h2>
          <p className="text-sm sm:text-base text-stone-600 font-normal max-w-md mx-auto pt-1 leading-relaxed">
            Curated architectural collections handcrafted for distinct spatial atmospheres.
          </p>
        </m.div>

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
        className="group relative block aspect-[4/4] sm:aspect-[4/4.2] rounded-2xl overflow-hidden shadow-lg border border-stone-200/60 hover:shadow-2xl transition-all duration-500"
      >
        {/* Photo + overlay. Always visible: a curtain reveal that waited for the card to scroll into view
            left some photos hidden on phones, so the photo only settles from a slight zoom instead. */}
        <div className="absolute inset-0 z-0">
          {/* Background Image (taller than the card so parallax never shows an edge) */}
          <m.div className="absolute inset-x-0 -top-[8%] -bottom-[8%]" style={{ y: imageY }}>
            <m.div
              className="absolute inset-0"
              initial={{ scale: 1.12 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, delay: stagger, ease }}
            >
              <Image
                src={card.image}
                alt={card.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                // Start fetching well before the card is reached, so it isn't blank on a slow connection
                loading="eager"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            </m.div>
          </m.div>

          {/* Rich Warm Ambient Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/40 via-45% to-stone-900/10 group-hover:from-stone-950/90 transition-all duration-500" />
        </div>

        {/* Foreground Editorial Text Content */}
        <m.div
          className="relative z-20 h-full flex flex-col justify-end p-8 sm:p-10 text-white space-y-3"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: stagger + 0.5, ease }}
        >
          {/* Category Micro-Label */}
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-[#E8D4B0] font-semibold">
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
            <span className="inline-flex items-center gap-2 pb-1 border-b border-white/80 group-hover:border-[#E8D4B0] text-xs font-semibold uppercase tracking-[0.2em] text-white group-hover:text-[#E8D4B0] transition-colors">
              <span>{card.ctaText}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
            </span>
          </div>
        </m.div>
      </Link>
    </div>
  );
}

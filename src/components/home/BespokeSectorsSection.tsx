"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/data/collections";
import { motion, AnimatePresence } from "framer-motion";
import TextReveal from "@/components/motion/TextReveal";

interface SectorProject {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  scope: string[];
  image: string;
  ctaText: string;
}

const sectors: SectorProject[] = [
  {
    id: "residential",
    category: "Homes",
    title: "Homes",
    subtitle: "Living rooms, dining rooms and bedrooms",
    description:
      "Dining tables cut to the length of your room, low beds, and modular sofas in the fabric you choose.",
    scope: [
      "Made to your measurements",
      "Living and dining sets",
      "Beds",
      "Sideboards and storage",
    ],
    image: "/hero/curated-living-space.jpg",
    ctaText: "Tell us about your home",
  },
  {
    id: "hospitality",
    category: "Hotels & restaurants",
    title: "Hotels and restaurants",
    subtitle: "Furniture that takes daily wear",
    description:
      "Slate tables and bar tops that shrug off heat and spills, and seating upholstered for commercial use.",
    scope: [
      "Heat- and scratch-resistant slate",
      "Lounge and bar seating",
      "Guest room furniture",
      "Reception desks",
    ],
    image: "/hero/dining-table.jpg",
    ctaText: "Ask about a hotel project",
  },
  {
    id: "institutional",
    category: "Schools & colleges",
    title: "Schools and colleges",
    subtitle: "Libraries, staff rooms and offices",
    description:
      "Solid teak tables and desks for libraries, staff rooms and offices, built to be used every day for years.",
    scope: [
      "Solid teak",
      "Library and meeting tables",
      "Desks",
      "Seating",
    ],
    image: "/hero/custom-atelier.jpg",
    ctaText: "Ask about a campus project",
  },
  {
    id: "corporate",
    category: "Offices",
    title: "Offices and studios",
    subtitle: "Meeting rooms and workspaces",
    description:
      "Stone meeting tables with hidden cable channels, desks, and lounge seating for reception areas.",
    scope: [
      "Hidden cable channels",
      "Tables for up to 20",
      "Wall panelling",
      "Lounge seating",
    ],
    image: "/hero/cad-blueprint.jpg",
    ctaText: "Ask about an office project",
  },
];

export default function BespokeSectorsSection() {
  const [activeSectorId, setActiveSectorId] = useState("residential");

  const current =
    sectors.find((s) => s.id === activeSectorId) || sectors[0];

  return (
    <section className="w-full bg-[#FAF8F5] pt-16 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-8 lg:px-16 border-t border-stone-200/60 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Header with smooth scroll reveal */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mb-10 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-normal text-[#111110] tracking-tight">
            <TextReveal text="Made for homes, hotels and offices" />
          </h2>
          <p className="text-sm sm:text-base text-stone-600 font-sans font-normal leading-relaxed mt-3 max-w-2xl">
            Tell us the room and its measurements. We make the pieces to fit, in the materials you choose.
          </p>
        </motion.div>

        {/* Sector Filter Tabs */}
        <div className="flex items-center gap-6 overflow-x-auto mb-8 sm:mb-10 scrollbar-none border-b border-stone-200">
          {sectors.map((sec) => {
            const isActive = sec.id === current.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSectorId(sec.id)}
                className={`-mb-px pb-3 text-sm transition-colors cursor-pointer shrink-0 border-b ${
                  isActive ? "border-stone-900 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-900"
                }`}
              >
                {sec.category}
              </button>
            );
          })}
        </div>

        {/* Active Sector Showcase Stage with Scroll Entrance */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center"
        >
          
          {/* Left Column: Details & Capabilities */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div>
              <span className="text-sm text-stone-500 block mb-2">
                {current.subtitle}
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl font-normal text-stone-900 tracking-tight leading-snug">
                {current.title}
              </h3>
              <p className="text-sm sm:text-base text-stone-600 font-sans font-normal mt-4 leading-relaxed">
                {current.description}
              </p>
            </div>

            {/* Scope Bullet Points */}
            <div className="pt-2">
              <span className="text-sm text-stone-500 block mb-2">What we make</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 border-t border-stone-200">
                {current.scope.map((item, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-stone-800 py-2.5 border-b border-stone-200"
                  >
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello Averto, I would like furniture made for a project. Here is my floor plan.")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] text-white text-sm whitespace-nowrap transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send your floor plan on WhatsApp</span>
              </a>

              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-1.5 px-2 py-3.5 text-sm text-stone-900 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 whitespace-nowrap"
              >
                <span>{current.ctaText}</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right Column: Architectural Photography Frame */}
          <div className="lg:col-span-6 relative aspect-[16/11] sm:aspect-[16/10] w-full rounded-sm overflow-hidden bg-stone-200">
            <Image
              src={current.image}
              alt={current.title}
              fill
              className="object-cover object-center transition-transform duration-1000 hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

        </motion.div>

      </div>
    </section>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, MessageCircle } from "lucide-react";
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
    category: "Luxury Homes & Villas",
    title: "Private Residences & Penthouses",
    subtitle: "Custom Living, Dining & Master Suites",
    description:
      "From bespoke monolithic dining tables fitted to your floor plan dimensions to custom low-profile platform beds and modular sofas tailored in custom bouclé.",
    scope: [
      "Custom Dimension Sizing",
      "Living & Dining Suites",
      "Master Bedsteads",
      "Fluted Storage Credenzas",
    ],
    image: "/hero/curated-living-space.jpg",
    ctaText: "Discuss Home Project",
  },
  {
    id: "hospitality",
    category: "Hotels & Fine Dining",
    title: "Boutique Hotels & Restaurants",
    subtitle: "High-Traffic Luxury Hospitality Fit-Outs",
    description:
      "Heavy-duty architectural stone tables, flame-honed slate bar surfaces, and commercial rub-count seating engineered for enduring hospitality elegance.",
    scope: [
      "Scratch & Heat-Proof Slate",
      "Lounge & Bar Seating",
      "Suite Room Furniture",
      "Custom Reception Desks",
    ],
    image: "/hero/dining-table.jpg",
    ctaText: "Inquire Hospitality Fit-Out",
  },
  {
    id: "institutional",
    category: "Schools & Colleges",
    title: "Educational & Campus Spaces",
    subtitle: "Architectural Libraries, Auditoriums & Faculty Lounges",
    description:
      "Durable, seasoned natural hardwoods and solid timber tables engineered for high-capacity university libraries, executive boardrooms, and modern student hubs.",
    scope: [
      "Heavy-Duty Solid Teak",
      "Conference & Library Tables",
      "Faculty Executive Desks",
      "Modular Acoustic Seating",
    ],
    image: "/hero/custom-atelier.jpg",
    ctaText: "Campus & Institutional Query",
  },
  {
    id: "corporate",
    category: "Offices & Studios",
    title: "Corporate & Architect Ateliers",
    subtitle: "Executive Boardrooms & Workspace Centers",
    description:
      "Monolithic stone conference tables with concealed cable channels, executive desks, and quiet-luxury lounge suites for modern Indian workplaces.",
    scope: [
      "Concealed Wire Troughs",
      "Custom 20-Seater Tables",
      "Acoustic Wall Paneling",
      "Private Pod Furniture",
    ],
    image: "/hero/cad-blueprint.jpg",
    ctaText: "Corporate Project Inquire",
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
          <span className="text-[11px] sm:text-xs uppercase tracking-[0.22em] text-stone-600 font-bold block mb-1.5 font-sans">
            Custom Architectural Fit-Outs
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold text-[#111110] tracking-tight">
            <TextReveal text="Bespoke Furniture For Every Space" />
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-sans font-normal leading-relaxed mt-3 max-w-2xl">
            Whether furnishing a private luxury residence, high-traffic boutique hotel, or educational campus, our master atelier customizes materials and dimensions to your architectural blueprint.
          </p>
        </motion.div>

        {/* Sector Filter Tabs */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-4 mb-8 sm:mb-10 scrollbar-none">
          {sectors.map((sec) => {
            const isActive = sec.id === current.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSectorId(sec.id)}
                className={`px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-sans font-bold tracking-wide transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-stone-900 text-white shadow-md"
                    : "bg-white hover:bg-stone-100 text-stone-600 border border-stone-200/90"
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
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-stone-200/80 shadow-sm items-center"
        >
          
          {/* Left Column: Details & Capabilities */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div>
              <span className="text-xs font-sans font-bold uppercase tracking-widest text-[#E08A50] block mb-2">
                {current.subtitle}
              </span>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold text-stone-900 tracking-tight leading-snug">
                {current.title}
              </h3>
              <p className="text-sm sm:text-base text-stone-600 font-sans font-normal mt-4 leading-relaxed">
                {current.description}
              </p>
            </div>

            {/* Scope Bullet Points */}
            <div className="pt-2">
              <span className="text-xs uppercase font-sans font-bold tracking-wider text-stone-400 block mb-3">
                Atelier Customization Scope:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {current.scope.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs sm:text-sm font-sans font-medium text-stone-800 bg-stone-50 px-3.5 py-2 rounded-xl border border-stone-200/60"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E08A50] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
              <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs sm:text-sm font-sans font-bold tracking-wide whitespace-nowrap transition-all shadow-md hover:scale-105 active:scale-95"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Share Floor Plan on WhatsApp</span>
              </a>

              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs sm:text-sm font-sans font-bold tracking-wide whitespace-nowrap transition-all"
              >
                <span>{current.ctaText}</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right Column: Architectural Photography Frame */}
          <div className="lg:col-span-6 relative aspect-[16/11] sm:aspect-[16/10] w-full rounded-2xl overflow-hidden bg-stone-950 shadow-lg border border-stone-200">
            <Image
              src={current.image}
              alt={current.title}
              fill
              className="object-cover object-center transition-transform duration-1000 hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#E08A50] bg-black/60 backdrop-blur-md px-3 py-1 rounded-md border border-white/10 inline-block mb-1.5">
                {current.category}
              </span>
              <h4 className="text-lg sm:text-xl font-sans font-bold text-white leading-tight">
                {current.title}
              </h4>
            </div>
          </div>

        </motion.div>

      </div>
    </section>
  );
}

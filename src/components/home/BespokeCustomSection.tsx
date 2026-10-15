"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Ruler,
  Layers,
  Compass,
  ShieldCheck,
  ArrowRight,
  MessageCircle,
  FileCheck2,
  Sliders,
  Check,
  Sparkles as SparklesIcon,
} from "lucide-react";

interface MaterialOption {
  id: string;
  name: string;
  category: string;
  origin: string;
  tag: string;
  desc: string;
  accentColor: string;
  image: string;
  characteristics: string[];
}

const bespokeMaterials: MaterialOption[] = [
  {
    id: "slate",
    name: "Flame-Honed Ligurian Slate",
    category: "Natural Monolithic Stone",
    origin: "Liguria, Italy",
    tag: "Heat, Knife & Wine Proof",
    desc: "Mined from subterranean Italian quarries, split naturally along geological strata, and flame-honed by hand into a velvety matte surface that repels red wine, hot cookware, and scratches effortlessly.",
    accentColor: "#2B2D2F",
    image: "/hero/slate-texture.jpg",
    characteristics: ["Zero chemical sealants", "Subtle natural cleft texture", "100% heat-proof up to 400°C"],
  },
  {
    id: "walnut",
    name: "Solid American Black Walnut",
    category: "Generational Hardwood",
    origin: "Pennsylvania, USA",
    tag: "FSC Certified Old-Growth",
    desc: "Kiln-dried over 90 days and hand-planed by Averto joiners. Features dense chocolate heartwood with undulating grain swirls, cured solely with non-toxic Austrian organic hardwax oils.",
    accentColor: "#4A3326",
    image: "/hero/artisan-craft.jpg",
    characteristics: ["Mortise & tenon joinery", "Hand-beveled 45° edges", "Zero formaldehyde or veneers"],
  },
  {
    id: "marble",
    name: "Calacatta Gold Architectural Marble",
    category: "Italian Mountain Marble",
    origin: "Carrara, Italy",
    tag: "Bookmatched Veining",
    desc: "Rare white marble extracted from the Apuan Alps, illuminated with warm caramel veining and soft pewter accents. Each slab is precision water-jet cut and finished with a silk matte hone.",
    accentColor: "#D6CEBF",
    image: "/hero/bespoke-materials.jpg",
    characteristics: ["Continuous grain waterfall edges", "Resin-free natural core", "Double-sealed stain guard"],
  },
  {
    id: "boucle",
    name: "Tactile Como Wool Bouclé",
    category: "High-Performance Textile",
    origin: "Lake Como, Italy",
    tag: "80,000 Rub Count",
    desc: "Spun from virgin European wool into deep looped coils for an irresistibly plush, cloud-soft touch. Backed by organic cotton canvas for supreme dimensional stability.",
    accentColor: "#E8E2D6",
    image: "/hero/chair.jpg",
    characteristics: ["Naturally flame retardant", "Breathable natural fibers", "Heavy residential & contract rated"],
  },
  {
    id: "leather",
    name: "Full-Grain Saddle Hide",
    category: "Vegetable-Tanned Leather",
    origin: "Bavaria, Germany",
    tag: "Ages into Patina",
    desc: "Steeped in chestnut and mimosa bark vats for two months. Retains original natural grain characteristics, deepening with light and touch into a bespoke amber-cognac patina over generations.",
    accentColor: "#9E5928",
    image: "/hero/saddle-chair.jpg",
    characteristics: ["2.2mm uncorrected thickness", "Hand-burnished wax edges", "Waxed linen saddler stitching"],
  },
];

const bespokeSteps = [
  {
    step: "01",
    subtitle: "Spatial Architecture",
    title: "Exact Millimeter Dimensioning",
    desc: "Tailored to your floor plan down to the millimeter. Specify custom dining lengths (140 to 380 cm), bespoke sofa depths, or headboard wall spans.",
    icon: Ruler,
    image: "/hero/architect-blueprint.jpg",
    highlight: "Laser-Measured Accuracy",
  },
  {
    step: "02",
    subtitle: "Atelier Curation",
    title: "Handpicked Raw Material Slabs",
    desc: "We photograph and reserve individual raw stone slabs and hardwood flitches, allowing you to hand-select the exact grain pattern and tone for your piece.",
    icon: Layers,
    image: "/hero/bespoke-materials.jpg",
    highlight: "100% Solid Natural Core",
  },
  {
    step: "03",
    subtitle: "Digital Prototype",
    title: "Millimeter 3D CAD Visualization",
    desc: "Before a single timber is planed or stone is carved, inspect photorealistic 3D architectural renders showing your custom design in your room's lighting.",
    icon: FileCheck2,
    image: "/hero/cad-blueprint.jpg",
    highlight: "Free 48-Hour Blueprints",
  },
  {
    step: "04",
    subtitle: "Master Installation",
    title: "White-Glove In-Room Delivery",
    desc: "Delivered by Averto's specialized installation team, positioned in your chosen space, leveled, and certified with your 10-Year Structural Guarantee.",
    icon: ShieldCheck,
    image: "/hero/white-glove.jpg",
    highlight: "10-Year Warranty & Certificate",
  },
];

export default function BespokeCustomSection() {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialOption>(bespokeMaterials[0]);

  return (
    <section id="custom" className="w-full bg-[#FAF8F5] py-20 sm:py-28 px-4 sm:px-8 lg:px-16 border-t border-stone-200/70 overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-14 gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#E08A50]" />
              <span className="text-[11px] sm:text-xs uppercase tracking-[0.24em] text-stone-600 font-bold">
                AVERTO ATELIER · MADE TO MEASURE
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-stone-900 tracking-tight leading-[1.12]">
              Custom Furniture Crafted <br className="hidden sm:inline" />
              For Your <span className="italic font-serif text-[#9E5928]">Exact Space</span>
            </h2>
          </div>
          <p className="text-stone-600 text-xs sm:text-sm font-light max-w-md leading-relaxed border-l-2 border-[#E08A50]/40 pl-4 mb-2">
            Have a unique architectural floor plan or signature vision? Collaborate one-on-one with our master artisans and stonemasons to create generational statement pieces.
          </p>
        </div>

        {/* Master Studio Atelier & Interactive Material Lab Container */}
        <div className="bg-[#FAF8F5]/90 rounded-[2.5rem] border border-stone-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-6 sm:p-10 lg:p-12 mb-16 sm:mb-20">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            {/* Left 7 Cols: Master Artisan Photography with Exact Reference Overlay */}
            <div className="lg:col-span-7 relative aspect-[16/11] sm:aspect-[16/10] rounded-3xl overflow-hidden bg-stone-950 shadow-2xl group border border-stone-200/60">
              <Image
                src="/hero/custom-atelier.jpg"
                alt="Averto Master Joiner Atelier Studio"
                fill
                className="object-cover object-center group-hover:scale-102 transition-transform duration-1000 ease-out"
                sizes="(max-width: 1024px) 100vw, 58vw"
                priority
              />
              {/* Subtle Atelier Lighting Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/30 pointer-events-none" />

              {/* Top Pill: Direct Atelier Commission with Pen/Chisel Icon */}
              <div className="absolute top-5 left-5 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-lg">
                <Compass className="w-3.5 h-3.5 text-[#E08A50]" />
                <span className="text-[11px] uppercase tracking-[0.2em] font-medium text-white/90">
                  Direct Atelier Commission
                </span>
              </div>

              {/* Bottom Floating White Plaque with Right Arrow Button */}
              <div className="absolute bottom-5 left-5 right-5 sm:right-6 flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-2xl">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-[#52331E] text-[#E08A50] flex items-center justify-center shrink-0 shadow-inner">
                    <Compass className="w-6 h-6 stroke-[1.75]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest truncate">
                        Averto Atelier Studio
                      </h4>
                      <span className="text-[10px] text-stone-400 font-mono">EST. 1998</span>
                    </div>
                    <p className="text-[11px] text-stone-500 font-light mt-0.5 leading-snug line-clamp-2">
                      Over 25+ years of bespoke joinery, monolithic stonework & tailored leathercraft
                    </p>
                  </div>
                </div>

                {/* Right Circular Arrow Button */}
                <button
                  type="button"
                  aria-label="View atelier details"
                  className="w-10 h-10 rounded-full bg-stone-100 hover:bg-[#E08A50] hover:text-white text-stone-700 flex items-center justify-center shrink-0 transition-colors shadow-2xs cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4 stroke-[2]" />
                </button>
              </div>
            </div>

            {/* Right 5 Cols: Tactile Material Selector Lab */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-[0.22em] font-bold text-[#E08A50]">
                      Tactile Finish Library
                    </span>
                    <span className="w-8 h-[1px] bg-stone-300 inline-block" />
                  </div>
                  <span className="text-xs text-stone-400 font-mono bg-stone-100 px-2 py-0.5 rounded-md">
                    {bespokeMaterials.findIndex((m) => m.id === selectedMaterial.id) + 1} of {bespokeMaterials.length} Finishes
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight leading-tight">
                  Select Your Natural Materials
                </h3>
                <p className="text-xs text-stone-500 font-light mt-2 leading-relaxed">
                  Every Averto piece begins with unadulterated European stone slabs, old-growth timber, or Italian bouclé. Touch any finish to view origin details.
                </p>
              </div>

              {/* Interactive Material Swatches - Photographic Squares */}
              <div>
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {bespokeMaterials.map((mat) => {
                    const isSelected = selectedMaterial.id === mat.id;
                    return (
                      <button
                        key={mat.id}
                        onClick={() => setSelectedMaterial(mat)}
                        aria-label={`Select ${mat.name}`}
                        className={`group relative flex flex-col items-center shrink-0 cursor-pointer transition-all duration-300 ${isSelected ? "-translate-y-1" : "hover:-translate-y-0.5 opacity-85 hover:opacity-100"
                          }`}
                      >
                        <div
                          className={`w-14 h-14 rounded-2xl border-2 transition-all relative overflow-hidden shadow-sm flex items-center justify-center ${isSelected
                              ? "border-[#E08A50] ring-4 ring-[#E08A50]/20 scale-105"
                              : "border-stone-200 group-hover:border-stone-400"
                            }`}
                        >
                          <Image
                            src={mat.image}
                            alt={mat.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <div className="w-5 h-5 rounded-full bg-white text-stone-900 flex items-center justify-center shadow-xs">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] tracking-wider uppercase font-bold mt-2 transition-colors ${isSelected ? "text-stone-900" : "text-stone-400"
                          }`}>
                          {mat.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Material Detailed Inspection Card */}
              <div className="rounded-2xl bg-white border border-stone-200/90 p-5 shadow-xs transition-all duration-300">
                <div className="flex gap-4 items-start">

                  {/* Swatch Real Photo Preview */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 border border-stone-200 shadow-sm bg-stone-200">
                    <Image
                      src={selectedMaterial.image}
                      alt={selectedMaterial.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </div>

                  {/* Info details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-wider text-stone-500 font-mono font-medium truncate">
                        {selectedMaterial.origin}
                      </span>
                      <span className="text-[10px] font-bold text-[#E08A50] bg-[#FAF8F5] border border-[#E08A50]/30 px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs">
                        {selectedMaterial.tag}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-stone-900 tracking-tight leading-snug">
                      {selectedMaterial.name}
                    </h4>

                    <p className="text-xs text-stone-600 font-light mt-1.5 leading-relaxed line-clamp-2">
                      {selectedMaterial.desc}
                    </p>
                  </div>
                </div>

                {/* Characteristics Checklist */}
                <div className="mt-4 pt-3.5 border-t border-stone-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-700 font-medium">
                  {selectedMaterial.characteristics.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E08A50] shrink-0" />
                      <span className="truncate">{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quiet Luxury Guarantee Badges with clean divider lines */}
              <div className="pt-2 flex items-center justify-between text-xs text-stone-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-stone-400" />
                  Zero Toxic Laminates
                </span>
                <span className="h-3 w-[1px] bg-stone-300" />
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-stone-400" />
                  100% Solid Core
                </span>
                <span className="h-3 w-[1px] bg-stone-300" />
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-stone-400" />
                  10-Year Guarantee
                </span>
              </div>

            </div>

          </div>

        </div>

        {/* 4-Step Bespoke Commission Process - Editorial Showcase */}
        <div className="mb-16 sm:mb-20">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#E08A50] font-bold block mb-1.5">
              The Atelier Journey
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
              From Blueprint To Living Sanctuary
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 font-light mt-2">
              Four transparent steps to commission your customized furniture piece.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bespokeSteps.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="group bg-white rounded-3xl border border-stone-200/80 shadow-[0_6px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-500 overflow-hidden flex flex-col cursor-default"
                >
                  {/* Photo Header */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                    <Image
                      src={s.image}
                      alt={s.title}
                      fill
                      className="object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                    {/* Step Number Badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-stone-900 bg-white/95 backdrop-blur-md border border-stone-200/80 px-2.5 py-1 rounded-xl shadow-xs">
                        STEP {s.step}
                      </span>
                    </div>

                    {/* Minimalist Floating Icon */}
                    <div className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-black/40 backdrop-blur-md text-white border border-white/20 flex items-center justify-center shadow-xs">
                      <Icon className="w-4 h-4 stroke-[2]" />
                    </div>

                    {/* Bottom Image Tag */}
                    <span className="absolute bottom-3.5 left-4 text-[10px] font-medium tracking-wider uppercase text-white/95 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15">
                      {s.highlight}
                    </span>
                  </div>

                  {/* Body Text */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#E08A50] font-bold block mb-1">
                        {s.subtitle}
                      </span>
                      <h4 className="text-base font-bold text-stone-900 mb-2 group-hover:text-[#E08A50] transition-colors leading-snug">
                        {s.title}
                      </h4>
                      <p className="text-xs text-stone-500 font-light leading-relaxed">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}

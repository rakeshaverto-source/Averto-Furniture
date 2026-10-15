"use client";

import React from "react";
import Image from "next/image";
import { MessageCircle, ArrowRight } from "lucide-react";

export default function ArchitectConsultationBanner() {
  return (
    <section className="w-full bg-[#FAF8F5] pt-4 pb-16 sm:pb-24 px-4 sm:px-8 lg:px-16 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Private Commission CTA Architectural Box */}
        <div className="rounded-[2.5rem] bg-stone-950 text-white p-8 sm:p-12 lg:p-14 shadow-2xl relative overflow-hidden border border-stone-800">
          
          {/* Architectural CAD Blueprint Ambient Overlay */}
          <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-luminosity">
            <Image
              src="/hero/cad-blueprint.jpg"
              alt="Architectural CAD"
              fill
              className="object-cover scale-105"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/95 to-stone-900/90 pointer-events-none" />

          {/* Warm Amber Atelier Lighting Glow */}
          <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-[#E08A50]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-12">
            
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#E08A50] text-[11px] font-bold uppercase tracking-widest mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E08A50]" />
                Direct Design Architect Hotline
              </div>

              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-[1.12]">
                Have a floor plan or custom vision?
              </h3>
              
              <p className="mt-3.5 text-xs sm:text-sm text-stone-300 font-light leading-relaxed max-w-xl">
                Share your architectural floor plans, Pinterest moodboards, or exact dimensions with our studio architects. Receive bespoke 3D CAD visualizations and timber/stone sample swatches delivered to your doorstep.
              </p>
            </div>

            {/* Direct Contact Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-[#25D366]/25 hover:scale-102 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                <span>WhatsApp Atelier Architect</span>
              </a>

              <a
                href="#contact"
                className="px-7 py-4 rounded-2xl bg-white hover:bg-stone-100 text-stone-950 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all shadow-xl hover:scale-102 cursor-pointer"
              >
                <span>Book Design Studio Visit</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </a>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

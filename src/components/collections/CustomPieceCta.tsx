"use client";

import { ArrowUpRight, Mail } from "lucide-react";
import { m } from "framer-motion";
import TextReveal from "@/components/motion/TextReveal";
import { WHATSAPP_NUMBER } from "@/data/collections";

export default function CustomPieceCta() {
  const message = encodeURIComponent("Hello Averto, I would like to commission a custom piece.");

  return (
    <section className="w-full bg-[#141413] text-white py-16 sm:py-24 px-6 sm:px-10 lg:px-16">
      <m.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-3xl mx-auto text-center"
      >
        <span className="text-[11px] uppercase tracking-[0.25em] text-[#E8D4B0] font-bold block mb-4">
          Made To Order
        </span>
        <h2 className="font-serif text-3xl sm:text-5xl font-medium leading-[1.1]">
          <TextReveal text="Don't see the right size or finish?" />
        </h2>
        <p className="mt-5 text-stone-300 font-light leading-relaxed">
          Every piece can be resized, re-finished or designed from scratch. Share your floor plan and our
          studio will come back with options.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#1A1A18] hover:bg-[#3b3732] text-white text-sm font-semibold tracking-wide whitespace-nowrap transition-colors"
          >
            <span>Start A Commission</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
          <a
            href="mailto:concierge@averto.in"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-white/30 hover:border-white text-white text-sm font-semibold tracking-wide whitespace-nowrap transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>Email The Studio</span>
          </a>
        </div>
      </m.div>
    </section>
  );
}

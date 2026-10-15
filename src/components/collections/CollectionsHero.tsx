"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import TextReveal from "@/components/motion/TextReveal";

export default function CollectionsHero() {
  return (
    <section className="relative w-full min-h-[360px] sm:min-h-[440px] flex items-end overflow-hidden bg-[#1A1A18]">
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 6, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <Image
          src="/hero/living-hero.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-10 lg:px-16 pb-12 sm:pb-16 pt-24 text-white">
        <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.22em] text-stone-300 mb-4">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span className="mx-2 text-stone-500">/</span>
          <span className="text-[#E8D4B0]">Collections</span>
        </nav>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-medium leading-[1.05] tracking-tight">
          <TextReveal text="The Collections" trigger="mount" />
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-xl text-base sm:text-lg text-stone-200 font-light leading-relaxed"
        >
          Rajasthan slate, seasoned teak and full-grain leather, made to order and sized to your space.
        </motion.p>
      </div>
    </section>
  );
}

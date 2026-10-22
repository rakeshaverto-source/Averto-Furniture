"use client";

import Image from "next/image";
import { m } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import TextReveal from "@/components/motion/TextReveal";
import { WHATSAPP_NUMBER } from "@/data/collections";

interface Client {
  name: string;
  sector: string;
  // Optional logo in /public/clients (transparent SVG or PNG). Without one, the name is set as a wordmark.
  logo?: string;
  style: "serif" | "sans" | "caps";
}

// Sectors for Spazio and Garg & Company are best guesses; confirm with the clients before launch.
const clients: Client[] = [
  { name: "Park Plaza Mansa Devi", sector: "Hotel", style: "serif" },
  { name: "Kuber Homes", sector: "Real Estate", style: "sans" },
  { name: "Caramel School, Gurugram", sector: "School", style: "caps" },
  { name: "Caramel School, Sector 9", sector: "School", style: "serif" },
  { name: "Ambience Industries", sector: "Industry", style: "sans" },
  { name: "Taj Constructions", sector: "Construction", style: "caps" },
  { name: "Spazio", sector: "Interiors", style: "serif" },
  { name: "Garg & Company", sector: "Corporate", style: "sans" },
];

const WORDMARK_STYLES: Record<Client["style"], string> = {
  serif: "font-serif text-xl sm:text-2xl italic leading-tight",
  sans: "font-sans text-base sm:text-lg font-bold tracking-tight leading-snug",
  caps: "font-sans text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] leading-relaxed",
};

const EASE = [0.22, 1, 0.36, 1] as const;

function ClientCard({ client, index }: { client: Client; index: number }) {
  return (
    <m.li
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.08, ease: EASE }}
      className="group relative flex flex-col justify-between min-h-[132px] sm:min-h-[150px] bg-white rounded-sm border border-stone-200/70 p-5 sm:p-6 hover:-translate-y-1 hover:border-stone-300 hover:shadow-[0_18px_40px_-24px_rgba(17,17,16,0.35)] transition-all duration-500"
    >
      <div className="flex-1 flex items-start">
        {client.logo ? (
          <Image
            src={client.logo}
            alt={client.name}
            width={160}
            height={48}
            className="h-9 sm:h-10 w-auto object-contain grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
          />
        ) : (
          <span
            className={`text-stone-600 group-hover:text-stone-950 transition-colors duration-500 ${WORDMARK_STYLES[client.style]}`}
          >
            {client.name}
          </span>
        )}
      </div>

      <div className="mt-5 flex items-center gap-2.5">
        <span className="h-px w-5 bg-[#C2A268] group-hover:w-8 transition-all duration-500" />
        <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-stone-500 font-medium">
          {client.sector}
        </span>
      </div>
    </m.li>
  );
}

export default function ClientLogosStrip() {
  return (
    <section className="w-full bg-[#FAF8F5] py-20 sm:py-28 px-6 sm:px-10 lg:px-16 border-t border-stone-200/80">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Heading column, pinned while the cards scroll past on large screens */}
        <m.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="lg:col-span-4 lg:sticky lg:top-28 self-start"
        >
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#C2A268] font-semibold">
            Our Clients
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-serif font-normal text-[#111110] tracking-tight leading-[1.1]">
            <TextReveal text="Trusted by the people who build & host." />
          </h2>
          <p className="mt-5 text-sm sm:text-base text-stone-600 leading-relaxed max-w-sm">
            Hotels, schools, homes and offices that chose Averto to furnish their spaces.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello Averto, I would like to discuss furniture for a project.")}`}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] text-white text-sm whitespace-nowrap transition-colors"
          >
            Start a project
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </m.div>

        <ul className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {clients.map((client, idx) => (
            <ClientCard key={client.name} client={client} index={idx} />
          ))}
        </ul>
      </div>
    </section>
  );
}

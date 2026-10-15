"use client";

import Image from "next/image";
import { Star, Quote, Gem, Hammer, Truck, BadgeIndianRupee, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import TextReveal from "@/components/motion/TextReveal";

interface Review {
  id: string;
  name: string;
  role: string;
  firmOrCity: string;
  rating: number;
  projectTitle: string;
  projectType: string;
  reviewText: string;
  image: string;
  furnitureCommissioned: string;
  verified: boolean;
}

const reviewsData: Review[] = [
  {
    id: "review-1",
    name: "Ar. Rohini Singhania",
    role: "Principal Architect",
    firmOrCity: "Studio Atelier, New Delhi",
    rating: 5,
    projectTitle: "The Vasant Vihar Penthouse Suite",
    projectType: "Private Residential Commission",
    reviewText:
      "Working with Averto on the bespoke monolithic slate dining centerpiece completely transformed the spatial tone of our client's dining terrace. The Rajasthan stone cleft finish and solid seasoned teak joinery have a tactile presence that catalogue luxury brands simply cannot match.",
    image: "/hero/dining-table.jpg",
    furnitureCommissioned: "Monolith Flame-Slate Dining Table (10-Seater)",
    verified: true,
  },
  {
    id: "review-2",
    name: "Vikramaditya & Meera Roy",
    role: "Villa Homeowners",
    firmOrCity: "Alibaug Coastal Villa, Mumbai",
    rating: 5,
    projectTitle: "Minimalist Coastal Living Sanctuary",
    projectType: "Full Living & Lounge Fit-Out",
    reviewText:
      "The custom curved bouclé sectionals and honed coffee table have held up miraculously even in the coastal humidity. The white-glove installation team from Averto arrived on time and assembled each piece with architectural precision.",
    image: "/hero/curated-living-space.jpg",
    furnitureCommissioned: "Serpentine Modular Bouclé Sofa & Fluted Oak Plinths",
    verified: true,
  },
  {
    id: "review-3",
    name: "Siddharth Nambiar",
    role: "Design Director",
    firmOrCity: "Nambiar & Co. Hospitality, Bengaluru",
    rating: 5,
    projectTitle: "The Heritage Club Executive Lounge",
    projectType: "Luxury Hospitality Commission",
    reviewText:
      "We commissioned 18 full-grain saddle leather armchairs with solid walnut frames for our executive library. The organic mimosa-tanned hides are aging beautifully with a deep rich patina. Exceptional generational craftsmanship.",
    image: "/hero/chair.jpg",
    furnitureCommissioned: "Full-Grain Saddle Leather Armchairs & Slate Arm Inlays",
    verified: true,
  },
  {
    id: "review-4",
    name: "Pooja & Ananya Kothari",
    role: "Architectural Collectors",
    firmOrCity: "Jubilee Hills Residence, Hyderabad",
    rating: 5,
    projectTitle: "The Sanctuary Master Wing",
    projectType: "Bedroom & Credenza Architecture",
    reviewText:
      "The Aura low-profile bedframe with the backlit raw slate slab is a masterpiece of modern restraint. It's not just furniture; it anchors the room like a permanent architectural art installation.",
    image: "/hero/bed.jpg",
    furnitureCommissioned: "Aura Low-Profile Slate Bed & Nero Marquina Credenza",
    verified: true,
  },
];

// Guarantee / commission counts / atelier cities live in StatsStrip, so they are not repeated here
const trustBadges: { title: string; desc: string; icon: LucideIcon }[] = [
  {
    title: "Natural Materials",
    desc: "Rajasthan slate & seasoned solid teakwood",
    icon: Gem,
  },
  {
    title: "Karigar Craftsmanship",
    desc: "Generational hand-cleft stone finishing",
    icon: Hammer,
  },
  {
    title: "White Glove Delivery",
    desc: "Delivered and installed across India",
    icon: Truck,
  },
  {
    title: "Direct Atelier Pricing",
    desc: "Zero intermediary markups or retail fluff",
    icon: BadgeIndianRupee,
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

// "Ar. Rohini Singhania" -> RS, "Vikramaditya & Meera Roy" -> VM
function getInitials(name: string) {
  return name
    .replace(/^Ar\.\s*/, "")
    .split(/\s+/)
    .filter((w) => /[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5 text-[#E08A50]" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-current" />
      ))}
    </div>
  );
}

function ReviewCard({ review, index, featured }: { review: Review; index: number; featured: boolean }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: (index % 3) * 0.1, ease: EASE }}
      className={`group relative flex flex-col bg-white rounded-3xl border border-stone-200/80 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ${
        featured ? "lg:col-span-2" : ""
      }`}
    >
      <div className={featured ? "grid grid-cols-1 sm:grid-cols-5 flex-1" : "flex flex-col flex-1"}>
        <div className={`flex flex-col flex-1 p-7 sm:p-9 ${featured ? "sm:col-span-3" : ""}`}>
          <div className="flex items-start justify-between gap-4">
            <Quote className="w-11 h-11 text-[#E8D4B0] fill-[#E8D4B0]" strokeWidth={1} />
            <Stars count={review.rating} />
          </div>

          <p
            className={`font-serif text-stone-800 mt-5 flex-1 ${
              featured ? "text-xl sm:text-2xl leading-[1.4]" : "text-lg sm:text-xl leading-[1.45]"
            }`}
          >
            {review.reviewText}
          </p>

          <div className="mt-8 pt-6 border-t border-stone-200/80 flex items-center gap-4">
            <span
              aria-hidden="true"
              className="shrink-0 w-12 h-12 rounded-full bg-[#F5F2EB] border border-[#E8D4B0] text-[#9E5928] flex items-center justify-center font-serif text-lg font-semibold"
            >
              {getInitials(review.name)}
            </span>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-stone-950 font-sans">{review.name}</h4>
              <p className="text-xs text-stone-500 mt-0.5">
                {review.role} &middot; {review.firmOrCity}
              </p>
            </div>
          </div>
        </div>

        {featured && (
          <div className="relative min-h-[220px] sm:min-h-full sm:col-span-2 order-first sm:order-none">
            <Image
              src={review.image}
              alt={review.projectTitle}
              fill
              className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              sizes="(max-width: 640px) 100vw, 26vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#E8D4B0] block mb-1">
                {review.projectType}
              </span>
              <p className="font-serif text-lg leading-tight">{review.projectTitle}</p>
            </div>
          </div>
        )}
      </div>

      {!featured && (
        <div className="px-7 sm:px-9 py-3.5 bg-[#FAF8F5] border-t border-stone-200/80 text-[11px] text-stone-500 flex items-center justify-between gap-3">
          <span className="font-mono uppercase tracking-wider truncate">{review.projectType}</span>
          <span className="text-stone-700 font-medium truncate">{review.projectTitle}</span>
        </div>
      )}
    </motion.article>
  );
}

export default function ClientReviewsSection() {
  return (
    <section className="w-full bg-[#F5F2EB] py-20 sm:py-28 px-6 sm:px-10 lg:px-16 border-t border-stone-200/80 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Centered header with the rating summary that makes it read as reviews */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
        >
          <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#A66E38] font-bold block mb-3 font-sans">
            Client Reviews
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium text-[#111110] tracking-tight leading-[1.1]">
            <TextReveal text="Loved By Architects & Homeowners" />
          </h2>
          <div className="mt-6 inline-flex items-center gap-3 bg-white px-5 py-2.5 rounded-full border border-stone-200 shadow-xs">
            <Stars count={5} />
            <span className="text-sm font-bold text-stone-900">5.0</span>
            <span className="text-xs text-stone-500">Rated by our clients</span>
          </div>
        </motion.div>

        {/* Review cards: two wide cards with project photos, two compact ones */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {reviewsData.map((review, idx) => (
            <ReviewCard
              key={review.id}
              review={review}
              index={idx}
              featured={idx === 0 || idx === reviewsData.length - 1}
            />
          ))}
        </div>

        {/* Trust row: open columns separated by hairlines instead of boxed cards */}
        <div className="mt-16 sm:mt-24 pt-10 border-t border-stone-300/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8">
          {trustBadges.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex items-start gap-4"
              >
                <span className="shrink-0 w-11 h-11 rounded-full border border-stone-300 flex items-center justify-center text-[#A66E38]">
                  <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
                </span>
                <div>
                  <h4 className="text-xs font-bold font-sans uppercase tracking-wider text-stone-900">
                    {badge.title}
                  </h4>
                  <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">{badge.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

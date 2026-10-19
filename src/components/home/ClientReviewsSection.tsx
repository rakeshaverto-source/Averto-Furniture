"use client";

import Image from "next/image";
import { m } from "framer-motion";
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

// PLACEHOLDER testimonials written for the design preview, NOT from real clients. Replace them with
// real quotes (with the client's permission) before launch; invented testimonials mislead buyers.
const reviewsData: Review[] = [
  {
    id: "review-1",
    name: "Ar. Rohini Singhania",
    role: "Principal Architect",
    firmOrCity: "Studio Atelier, New Delhi",
    rating: 5,
    projectTitle: "Dining terrace",
    projectType: "Home, New Delhi",
    reviewText:
      "We had the slate table made at 3 metres for a client's dining terrace. It is the first thing everyone touches when they walk in. The teak base is properly made, nothing wobbles.",
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
    projectTitle: "Living room by the sea",
    projectType: "Villa, Alibaug",
    reviewText:
      "Two monsoons by the sea and the bouclé sofa and coffee table still look new. The team came on the day they said, set everything up and took the packing away.",
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
    projectTitle: "Club library",
    projectType: "Hospitality, Bengaluru",
    reviewText:
      "We ordered 18 leather armchairs for our club library. A year in, the leather has darkened nicely and not one chair has needed repair.",
    image: "/hero/chair.jpg",
    furnitureCommissioned: "Full-Grain Saddle Leather Armchairs & Slate Arm Inlays",
    verified: true,
  },
  {
    id: "review-4",
    name: "Pooja & Ananya Kothari",
    role: "Homeowners",
    firmOrCity: "Jubilee Hills Residence, Hyderabad",
    rating: 5,
    projectTitle: "Main bedroom",
    projectType: "Home, Hyderabad",
    reviewText:
      "The bed with the lit slate headboard is the reason we love our bedroom now. Simple, solid, and the light is just bright enough to read by.",
    image: "/hero/bed.jpg",
    furnitureCommissioned: "Aura Low-Profile Slate Bed & Nero Marquina Credenza",
    verified: true,
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

function ReviewCard({ review, index, featured }: { review: Review; index: number; featured: boolean }) {
  return (
    <m.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: (index % 3) * 0.1, ease: EASE }}
      className={`group relative flex flex-col bg-white rounded-sm overflow-hidden ${
        featured ? "lg:col-span-2" : ""
      }`}
    >
      <div className={featured ? "grid grid-cols-1 sm:grid-cols-5 flex-1" : "flex flex-col flex-1"}>
        <div className={`flex flex-col flex-1 p-7 sm:p-9 ${featured ? "sm:col-span-3" : ""}`}>

          <p
            className={`font-serif text-stone-800 flex-1 ${
              featured ? "text-xl sm:text-2xl leading-[1.4]" : "text-lg sm:text-xl leading-[1.45]"
            }`}
          >
            {review.reviewText}
          </p>

          <div className="mt-8">
            <div className="min-w-0">
              <h4 className="text-sm font-medium text-stone-950 font-sans">{review.name}</h4>
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
              <span className="text-xs text-white/70 block mb-1">
                {review.projectType}
              </span>
              <p className="font-serif text-lg leading-tight">{review.projectTitle}</p>
            </div>
          </div>
        )}
      </div>

      {!featured && (
        <div className="px-7 sm:px-9 py-3.5 border-t border-stone-100 text-xs text-stone-500 flex items-center justify-between gap-3">
          <span className="truncate">{review.projectType}</span>
          <span className="text-stone-700 font-medium truncate">{review.projectTitle}</span>
        </div>
      )}
    </m.article>
  );
}

export default function ClientReviewsSection() {
  return (
    <section className="w-full bg-[#F5F2EB] py-20 sm:py-28 px-6 sm:px-10 lg:px-16 border-t border-stone-200/80 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Centered header with the rating summary that makes it read as reviews */}
        <m.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal text-[#111110] tracking-tight leading-[1.1]">
            <TextReveal text="What our clients say" />
          </h2>
        </m.div>

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
      </div>
    </section>
  );
}

import React from "react";
import Image from "next/image";

const categoryCards = [
  {
    id: "modern-furniture",
    title: "Modern Furniture",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, eiusmod tempor.",
    image: "/hero/cutout-chair.jpg",
    btnText: "Shop Now",
    href: "#furniture",
  },
  {
    id: "decor-accents",
    title: "Decor Accents",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, eiusmod tempor.",
    image: "/hero/decor-vase.jpg",
    btnText: "Shop Now",
    href: "#decor",
  },
  {
    id: "inspired-living",
    title: "Inspired Living",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, eiusmod tempor.",
    image: "/hero/inspired-frame.jpg",
    btnText: "Shop Now",
    href: "#living",
  },
];

export default function FeaturedCards() {
  return (
    <section className="relative z-20 -mt-14 sm:-mt-20 px-6 md:px-16 max-w-7xl mx-auto w-full pb-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {categoryCards.map((card) => (
          <div
            key={card.id}
            className="bg-[#FAF8F5]/95 backdrop-blur-md rounded-2xl p-5 border border-stone-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.09)] transition-all duration-300 flex flex-col justify-between group"
          >
            <div className="flex items-center gap-4">
              {/* Product Thumbnail Box */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white shrink-0 overflow-hidden border border-stone-200/50 flex items-center justify-center p-2 shadow-xs">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Text info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-stone-900 leading-tight">
                  {card.title}
                </h3>
                <p className="text-[11px] text-stone-500 mt-1 leading-relaxed line-clamp-2">
                  {card.description}
                </p>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="mt-4 pt-2">
              <a
                href={card.href}
                className="w-full sm:w-auto inline-block text-center px-6 py-2 rounded-xl bg-[#8A9199] hover:bg-stone-800 text-white text-xs font-medium tracking-wide transition-colors shadow-xs"
              >
                {card.btnText}
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

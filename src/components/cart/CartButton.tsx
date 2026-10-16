"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "./CartProvider";

export default function CartButton() {
  const { count, openDrawer } = useCart();

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={count > 0 ? `Open cart, ${count} ${count === 1 ? "item" : "items"}` : "Open cart"}
      className="relative w-11 h-11 rounded-full flex items-center justify-center text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
    >
      <ShoppingBag className="w-5 h-5" strokeWidth={1.6} />
      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-[#1A1A18] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
          {count}
        </span>
      )}
    </button>
  );
}

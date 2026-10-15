"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/data/collections";
import { DEPOSIT_PERCENT, MAX_QTY_PER_LINE } from "@/data/store";
import { useCart } from "./CartProvider";
import CouponBox from "./CouponBox";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function CartDrawer() {
  const { lines, subtotal, savings, discount, total, deposit, drawerOpen, closeDrawer, setQty, remove } = useCart();

  // Esc closes; page scroll is locked while the drawer is open
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, closeDrawer]);

  return (
    <AnimatePresence>
      {drawerOpen && (
        <div className="fixed inset-0 z-[170]" role="dialog" aria-modal="true" aria-label="Shopping cart">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeDrawer}
            className="absolute inset-0 bg-black/50"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: EASE }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200">
              <h2 className="font-serif text-2xl text-[#111110]">Your cart</h2>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close cart"
                className="w-9 h-9 rounded-full hover:bg-stone-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <ShoppingBag className="w-10 h-10 text-stone-300" strokeWidth={1.2} />
                <p className="mt-4 font-serif text-xl text-stone-900">Your cart is empty</p>
                <p className="mt-1 text-sm text-stone-500">Browse the collections to find a piece you love.</p>
                <Link
                  href="/collections"
                  onClick={closeDrawer}
                  className="mt-6 px-7 py-3 rounded-xl bg-[#E08A50] hover:bg-[#cf7b43] text-white text-sm font-medium transition-colors"
                >
                  View collections
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 overflow-y-auto px-6 divide-y divide-stone-200">
                  {lines.map((line) => (
                    <li key={line.key} className="py-5 flex gap-4">
                      <Link
                        href={`/products/${line.product.id}`}
                        onClick={closeDrawer}
                        className="relative w-20 h-24 shrink-0 rounded-lg overflow-hidden bg-[#ECE8E1]"
                      >
                        <div className={`absolute inset-0 ${line.product.zoomClass ?? ""}`}>
                          <Image
                            src={line.color?.image ?? line.product.image}
                            alt={line.product.name}
                            fill
                            className="object-cover object-center"
                            sizes="80px"
                          />
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            href={`/products/${line.product.id}`}
                            onClick={closeDrawer}
                            className="text-sm font-medium text-stone-900 hover:underline underline-offset-4"
                          >
                            {line.product.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => remove(line.product.id, line.color?.id)}
                            aria-label={`Remove ${line.product.name}`}
                            className="text-stone-400 hover:text-stone-900 cursor-pointer shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {line.color && <p className="text-xs text-stone-500 mt-0.5">{line.color.name}</p>}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-lg border border-stone-300">
                            <button
                              type="button"
                              onClick={() => setQty(line.product.id, line.color?.id, line.qty - 1)}
                              aria-label="Decrease quantity"
                              className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-stone-100 rounded-l-lg"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm tabular-nums">{line.qty}</span>
                            <button
                              type="button"
                              onClick={() => setQty(line.product.id, line.color?.id, line.qty + 1)}
                              disabled={line.qty >= MAX_QTY_PER_LINE}
                              aria-label="Increase quantity"
                              className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-stone-100 rounded-r-lg disabled:opacity-30 disabled:pointer-events-none"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-right">
                            {line.originalUnit && line.originalUnit > line.unit && (
                              <span className="block text-xs text-stone-400 line-through">
                                {formatPrice(line.originalUnit * line.qty)}
                              </span>
                            )}
                            <span className="text-sm font-semibold text-stone-950">{formatPrice(line.total)}</span>
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="px-6 py-5 border-t border-stone-200 bg-[#FAF8F5]">
                  <div className="mb-4">
                    <CouponBox />
                  </div>
                  <div className="flex items-center justify-between text-sm text-stone-600">
                    <span>Subtotal</span>
                    <span className="text-stone-900">{formatPrice(subtotal)}</span>
                  </div>
                  {savings > 0 && (
                    <p className="mt-1 text-xs text-emerald-700">
                      You save {formatPrice(savings)} on the original prices
                    </p>
                  )}
                  {discount > 0 && (
                    <div className="mt-1.5 flex items-center justify-between text-sm text-emerald-800">
                      <span>Coupon discount</span>
                      <span>&minus;{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-900">Advance to pay now ({DEPOSIT_PERCENT}%)</span>
                    <span className="font-serif text-2xl text-stone-950">{formatPrice(deposit)}</span>
                  </div>
                  <p className="mt-2 text-xs text-stone-500">
                    The balance of {formatPrice(total - deposit)} is settled with our team before delivery.
                  </p>
                  <Link
                    href="/checkout"
                    onClick={closeDrawer}
                    className="mt-4 flex items-center justify-center w-full py-3.5 rounded-xl bg-[#E08A50] hover:bg-[#cf7b43] text-white text-sm font-medium transition-colors"
                  >
                    Checkout
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { CollectionProduct, ProductColor } from "@/data/collections";
import { depositFor, MAX_QTY_PER_LINE } from "@/data/store";
import type { Coupon } from "@/data/coupons";
import { quoteCart, type CartQuote } from "@/app/actions/cart";
import { parseCart, readCoupon, readRaw, sameLine, subscribe, writeCart, writeCoupon } from "@/lib/cart-store";
import CartDrawer from "./CartDrawer";

export interface ResolvedLine {
  key: string;
  product: CollectionProduct;
  color?: ProductColor;
  qty: number;
  unit: number;
  originalUnit?: number;
  total: number;
}

interface CartContextValue {
  lines: ResolvedLine[];
  count: number;
  subtotal: number;
  savings: number;
  coupon: Coupon | null;
  couponNotice: string;
  discount: number;
  total: number;
  deposit: number;
  // true while the latest cart change is still being priced by the server
  syncing: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  add: (productId: string, colorId?: string, qty?: number) => void;
  setQty: (productId: string, colorId: string | undefined, qty: number) => void;
  remove: (productId: string, colorId?: string) => void;
  clear: () => void;
  applyCoupon: (code: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  // "" on the server and during hydration, then the real cart
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const stored = useMemo(() => parseCart(raw), [raw]);
  const storedCoupon = useSyncExternalStore(subscribe, readCoupon, () => "");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // The browser only stores ids and quantities; names, photos and prices come from the server
  const quoteKey = `${raw}|${storedCoupon}`;
  const [quote, setQuote] = useState<{ key: string; data: CartQuote } | null>(null);
  useEffect(() => {
    if (stored.length === 0) return;
    let cancelled = false;
    quoteCart(stored, storedCoupon)
      .then((data) => {
        if (cancelled) return;
        setQuote({ key: quoteKey, data });
        // Save the cleaned-up cart (default colours filled in, removed products dropped, duplicates
        // merged) so the +, - and remove buttons always find the line they belong to
        const cleaned = data.lines.map((l) => ({ productId: l.productId, colorId: l.colorId, qty: l.qty }));
        if (JSON.stringify(cleaned) !== JSON.stringify(stored)) writeCart(cleaned);
      })
      .catch(() => {
        // offline or server error: keep showing the last prices; the next change tries again
      });
    return () => {
      cancelled = true;
    };
  }, [quoteKey, stored, storedCoupon]);

  const empty = stored.length === 0;
  const syncing = !empty && quote?.key !== quoteKey;
  const data = empty ? null : quote?.data;

  const lines = useMemo<ResolvedLine[]>(
    () =>
      (data?.lines ?? []).map((l) => ({
        key: `${l.productId}:${l.colorId ?? ""}`,
        product: l.product,
        color: l.color,
        qty: l.qty,
        unit: l.unit,
        originalUnit: l.originalUnit,
        total: l.unit * l.qty,
      })),
    [data],
  );

  const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
  // what the discounted prices already save compared with the original prices (coupons are separate)
  const savings = lines.reduce(
    (sum, l) => sum + (l.originalUnit && l.originalUnit > l.unit ? (l.originalUnit - l.unit) * l.qty : 0),
    0,
  );

  // The server re-checks the coupon against the cart every time, so a coupon that stops applying
  // (for example the cart drops below its minimum) is switched off instead of discounting wrongly
  const coupon = data?.coupon ?? null;
  const discount = data?.discount ?? 0;
  const couponNotice =
    storedCoupon && data?.couponError ? `${storedCoupon} no longer applies. ${data.couponError}` : "";
  const total = subtotal - discount;
  // Until the first prices arrive, count straight from storage so the cart badge never flickers to 0
  const count = (lines.length ? lines : stored).reduce((sum, l) => sum + l.qty, 0);

  // Always start from what is stored right now, so two quick clicks never overwrite each other
  const current = () => parseCart(readRaw());

  const add = useCallback((productId: string, colorId?: string, qty = 1) => {
    const lines = current();
    const existing = lines.find((l) => sameLine(l, productId, colorId));
    if (existing) existing.qty = Math.min(existing.qty + qty, MAX_QTY_PER_LINE);
    else lines.push({ productId, colorId, qty: Math.min(qty, MAX_QTY_PER_LINE) });
    writeCart(lines);
    setDrawerOpen(true);
  }, []);

  const setQty = useCallback((productId: string, colorId: string | undefined, qty: number) => {
    const next = current()
      .map((l) => (sameLine(l, productId, colorId) ? { ...l, qty: Math.min(qty, MAX_QTY_PER_LINE) } : l))
      .filter((l) => l.qty > 0);
    writeCart(next);
  }, []);

  const remove = useCallback((productId: string, colorId?: string) => {
    writeCart(current().filter((l) => !sameLine(l, productId, colorId)));
  }, []);

  const clear = useCallback(() => {
    writeCart([]);
    writeCoupon("");
  }, []);

  const applyCoupon = async (code: string): Promise<{ ok: true } | { ok: false; error: string }> => {
    if (!code.trim()) return { ok: false, error: "Enter a coupon code." };
    try {
      const result = await quoteCart(current(), code);
      if (!result.coupon) return { ok: false, error: result.couponError || "That coupon code is not valid." };
      writeCoupon(result.coupon.code);
      return { ok: true };
    } catch {
      return { ok: false, error: "We could not check that coupon. Please try again." };
    }
  };
  const removeCoupon = () => writeCoupon("");

  const value: CartContextValue = {
    lines,
    count,
    subtotal,
    savings,
    coupon,
    couponNotice,
    discount,
    total,
    deposit: depositFor(total),
    syncing,
    drawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    add,
    setQty,
    remove,
    clear,
    applyCoupon,
    removeCoupon,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

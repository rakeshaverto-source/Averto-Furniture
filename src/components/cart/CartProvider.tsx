"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import type { CollectionProduct, ProductColor } from "@/data/collections";
import { depositFor, MAX_QTY_PER_LINE, resolveLine } from "@/data/store";
import { applyCoupon as checkCoupon, type Coupon } from "@/data/coupons";
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
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  add: (productId: string, colorId?: string, qty?: number) => void;
  setQty: (productId: string, colorId: string | undefined, qty: number) => void;
  remove: (productId: string, colorId?: string) => void;
  clear: () => void;
  applyCoupon: (code: string) => { ok: true } | { ok: false; error: string };
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const lines = useMemo<ResolvedLine[]>(
    () =>
      stored.flatMap((line) => {
        const resolved = resolveLine(line.productId, line.colorId);
        if (!resolved) return [];
        return [
          {
            key: `${line.productId}:${resolved.color?.id ?? ""}`,
            product: resolved.product,
            color: resolved.color,
            qty: line.qty,
            unit: resolved.unit,
            originalUnit: resolved.originalUnit,
            total: resolved.unit * line.qty,
          },
        ];
      }),
    [stored],
  );

  const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
  // what the discounted prices already save compared with the original prices (coupons are separate)
  const savings = lines.reduce(
    (sum, l) => sum + (l.originalUnit && l.originalUnit > l.unit ? (l.originalUnit - l.unit) * l.qty : 0),
    0,
  );

  // The coupon is re-checked against the cart every time, so a coupon that stops applying
  // (for example the cart drops below its minimum) is switched off instead of discounting wrongly
  const storedCoupon = useSyncExternalStore(subscribe, readCoupon, () => "");
  const couponResult = storedCoupon ? checkCoupon(storedCoupon, subtotal) : null;
  const coupon = couponResult?.ok ? couponResult.coupon : null;
  const discount = couponResult?.ok ? couponResult.discount : 0;
  const couponNotice =
    couponResult && !couponResult.ok ? `${storedCoupon} no longer applies. ${couponResult.error}` : "";
  const total = subtotal - discount;
  const count = lines.reduce((sum, l) => sum + l.qty, 0);

  // Always start from what is stored right now, so two quick clicks never overwrite each other
  // Colour ids are normalised the same way the drawer shows them (a missing or unknown colour means the
  // product's default one), so the +, - and remove buttons always find the line they belong to
  const current = () =>
    parseCart(readRaw()).flatMap((line) => {
      const resolved = resolveLine(line.productId, line.colorId);
      return resolved ? [{ ...line, colorId: resolved.color?.id }] : [];
    });

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

  const applyCoupon = (code: string): { ok: true } | { ok: false; error: string } => {
    const result = checkCoupon(code, subtotal);
    if (!result.ok) return result;
    writeCoupon(result.coupon.code);
    return { ok: true };
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

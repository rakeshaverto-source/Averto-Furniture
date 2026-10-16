// Prices a cart from the database. Used by the cart drawer (through quoteCart) and by checkout, so
// what the customer sees and what they are charged always come from the same place.
import "server-only";
import { getProducts, findCoupon } from "@/lib/catalog";
import { evaluateCoupon, type CouponResult } from "@/data/coupons";
import { MAX_QTY_PER_LINE, priceLine } from "@/data/store";
import type { CollectionProduct, ProductColor } from "@/data/collections";

export interface CartItem {
  productId: string;
  colorId?: string;
  qty: number;
}

export interface PricedLine {
  productId: string;
  colorId?: string; // normalised: always a real colour of the product, or none if it has no colours
  qty: number;
  product: CollectionProduct;
  color?: ProductColor;
  unit: number;
  originalUnit?: number;
}

export const MAX_CART_LINES = 20;

// Lines that no longer exist come back in `missing` instead of being priced. Two lines that turn out
// to be the same product and colour are merged.
export async function priceItems(items: unknown): Promise<{ lines: PricedLine[]; missing: number }> {
  const list = Array.isArray(items) ? items.slice(0, MAX_CART_LINES) : [];
  const products = new Map((await getProducts()).map((p) => [p.id, p]));
  const lines: PricedLine[] = [];
  let missing = 0;

  for (const raw of list) {
    const item = (raw ?? {}) as Record<string, unknown>;
    const product = products.get(String(item.productId));
    const qty = Math.floor(Number(item.qty));
    if (!product || !Number.isFinite(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      missing++;
      continue;
    }
    const priced = priceLine(product, typeof item.colorId === "string" ? item.colorId : undefined);
    const existing = lines.find((l) => l.productId === product.id && l.colorId === priced.color?.id);
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, MAX_QTY_PER_LINE);
      continue;
    }
    lines.push({ productId: product.id, colorId: priced.color?.id, qty, ...priced });
  }
  return { lines, missing };
}

export const subtotalOf = (lines: PricedLine[]) => lines.reduce((sum, l) => sum + l.unit * l.qty, 0);

export async function priceCoupon(code: string, subtotal: number): Promise<CouponResult> {
  if (!String(code ?? "").trim()) return { ok: false, error: "Enter a coupon code." };
  return evaluateCoupon(await findCoupon(code), subtotal);
}

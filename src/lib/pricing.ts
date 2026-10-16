// Prices a cart from the database. Used by the cart drawer (through quoteCart) and by checkout, so
// what the customer sees and what they are charged always come from the same place.
import "server-only";
import { getProducts, findCoupon } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { evaluateCoupon, type Coupon, type CouponResult } from "@/data/coupons";
import type { Prisma } from "@/generated/prisma/client";
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

// Orders that count as having used a coupon: everything except cancelled orders and online
// payments that were started but abandoned more than an hour ago
const ABANDONED_AFTER_MS = 60 * 60 * 1000;

export function couponUseFilter(code: string, email?: string): Prisma.OrderWhereInput {
  return {
    couponCode: code,
    fulfillment: { not: "cancelled" },
    NOT: { status: "awaiting_payment", createdAt: { lt: new Date(Date.now() - ABANDONED_AFTER_MS) } },
    ...(email ? { customerEmail: { equals: email, mode: "insensitive" } } : {}),
  };
}

// Usage limits, checked against past orders. `db` lets checkout run this inside its transaction.
export async function checkCouponLimits(
  coupon: Coupon,
  email: string | undefined,
  db: Pick<typeof prisma, "order"> = prisma,
): Promise<string | null> {
  if (coupon.maxUses) {
    const used = await db.order.count({ where: couponUseFilter(coupon.code) });
    if (used >= coupon.maxUses) return "This coupon has been fully used.";
  }
  if (coupon.maxUsesPerCustomer && email) {
    const mine = await db.order.count({ where: couponUseFilter(coupon.code, email) });
    if (mine >= coupon.maxUsesPerCustomer) {
      return coupon.maxUsesPerCustomer === 1
        ? "You have already used this coupon."
        : `You have already used this coupon ${coupon.maxUsesPerCustomer} times.`;
    }
  }
  return null;
}

// email: the signed-in customer's email; personal coupons and per-customer limits are checked
// against it. Without it (signed out), those checks wait until checkout, where login is required.
export async function priceCoupon(code: string, subtotal: number, email?: string): Promise<CouponResult> {
  if (!String(code ?? "").trim()) return { ok: false, error: "Enter a coupon code." };
  const result = evaluateCoupon(await findCoupon(code), subtotal, email);
  if (!result.ok) return result;
  const limit = await checkCouponLimits(result.coupon, email);
  return limit ? { ok: false, error: limit } : result;
}

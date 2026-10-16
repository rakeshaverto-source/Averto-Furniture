"use server";

import { priceCoupon, priceItems, subtotalOf, type PricedLine } from "@/lib/pricing";
import type { Coupon } from "@/data/coupons";

export interface CartQuote {
  lines: PricedLine[];
  coupon: Coupon | null; // set only when the code applies to this cart
  couponError: string;
  discount: number;
}

// The browser keeps only product ids, colours and quantities; this turns them into names, photos and
// prices from the database, and checks the coupon without ever sending the list of codes.
export async function quoteCart(items: unknown, couponCode: unknown): Promise<CartQuote> {
  const { lines } = await priceItems(items);
  const code = typeof couponCode === "string" ? couponCode.slice(0, 40) : "";
  if (!code) return { lines, coupon: null, couponError: "", discount: 0 };

  const result = await priceCoupon(code, subtotalOf(lines));
  return result.ok
    ? { lines, coupon: result.coupon, couponError: "", discount: result.discount }
    : { lines, coupon: null, couponError: result.error, discount: 0 };
}

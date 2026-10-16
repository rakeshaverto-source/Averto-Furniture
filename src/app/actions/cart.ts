"use server";

import { priceCoupon, priceItems, subtotalOf, type PricedLine } from "@/lib/pricing";
import { getCustomer } from "@/lib/customer-auth";
import { toPublicCoupon, type PublicCoupon } from "@/data/coupons";

export interface CartQuote {
  lines: PricedLine[];
  coupon: PublicCoupon | null; // set only when the code applies to this cart (never the allowed emails)
  couponError: string;
  discount: number;
}

// The browser keeps only product ids, colours and quantities; this turns them into names, photos and
// prices from the database, and checks the coupon without ever sending the list of codes.
// Personal coupons and per-customer limits use the signed-in account's email, never one the
// browser sends, so nobody can borrow another customer's coupon.
export async function quoteCart(items: unknown, couponCode: unknown): Promise<CartQuote> {
  const { lines } = await priceItems(items);
  const code = typeof couponCode === "string" ? couponCode.slice(0, 40) : "";
  if (!code) return { lines, coupon: null, couponError: "", discount: 0 };

  const customer = await getCustomer();
  const result = await priceCoupon(code, subtotalOf(lines), customer?.email);
  return result.ok
    ? { lines, coupon: toPublicCoupon(result.coupon), couponError: "", discount: result.discount }
    : { lines, coupon: null, couponError: result.error, discount: 0 };
}

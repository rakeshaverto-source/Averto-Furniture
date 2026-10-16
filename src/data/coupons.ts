// Coupon rules. The coupons themselves live in the database (coupons table) and are only ever read
// on the server, so the list of codes never reaches the browser.

export interface Coupon {
  code: string; // stored upper case
  description: string;
  type: "percent" | "flat";
  value: number; // percent (e.g. 10) or rupees off
  minOrder?: number; // order subtotal needed, in rupees
  maxDiscount?: number; // cap for percent coupons, in rupees
}

export type CouponResult =
  | { ok: true; coupon: Coupon; discount: number }
  | { ok: false; error: string };

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// `coupon` is what the database found for the code (undefined when none matched or it is switched off)
export function evaluateCoupon(coupon: Coupon | undefined, subtotal: number): CouponResult {
  if (!coupon) return { ok: false, error: "That coupon code is not valid." };

  if (coupon.minOrder && subtotal < coupon.minOrder) {
    return { ok: false, error: `This coupon needs an order of ${rupees(coupon.minOrder)} or more.` };
  }

  let discount = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, subtotal); // never more than the order itself
  return { ok: true, coupon, discount };
}

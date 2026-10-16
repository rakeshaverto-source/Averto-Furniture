// Coupon rules. The coupons themselves live in the database (coupons table) and are only ever read
// on the server, so the list of codes never reaches the browser.

export interface Coupon {
  code: string; // stored upper case
  description: string;
  type: "percent" | "flat";
  value: number; // percent (e.g. 10) or rupees off
  minOrder?: number; // order subtotal needed, in rupees
  maxDiscount?: number; // cap for percent coupons, in rupees
  allowedEmails: string[]; // personal coupon when not empty (lower case); server only
  maxUses?: number; // total uses; checked on the server against past orders
  maxUsesPerCustomer?: number; // uses per customer email
}

// What the browser may know about an applied coupon: never the list of allowed emails
export interface PublicCoupon {
  code: string;
  description: string;
  personal: boolean; // only works for the email(s) it was given to
}

export const toPublicCoupon = (c: Coupon): PublicCoupon => ({
  code: c.code,
  description: c.description,
  personal: c.allowedEmails.length > 0,
});

export type CouponResult =
  | { ok: true; coupon: Coupon; discount: number }
  | { ok: false; error: string };

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export const normaliseEmail = (email: string) => email.trim().toLowerCase();

// `coupon` is what the database found for the code (undefined when none matched or it is switched off).
// `email` is the customer's email once known (checkout). Before that a personal coupon is allowed
// provisionally; checkout checks it again with the email.
export function evaluateCoupon(coupon: Coupon | undefined, subtotal: number, email?: string): CouponResult {
  if (!coupon) return { ok: false, error: "That coupon code is not valid." };

  if (coupon.allowedEmails.length > 0 && email && !coupon.allowedEmails.includes(normaliseEmail(email))) {
    return { ok: false, error: "This coupon is not available for this email address." };
  }

  if (coupon.minOrder && subtotal < coupon.minOrder) {
    return { ok: false, error: `This coupon needs an order of ${rupees(coupon.minOrder)} or more.` };
  }

  let discount = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, subtotal); // never more than the order itself
  return { ok: true, coupon, discount };
}

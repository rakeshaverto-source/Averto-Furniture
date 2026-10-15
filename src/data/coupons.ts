// SAMPLE COUPONS, written only so the coupon box can be tried out. Replace them with the real offers
// (or move them to the database) before launch. The server checks every coupon again at checkout.

export interface Coupon {
  code: string; // stored upper case
  description: string;
  type: "percent" | "flat";
  value: number; // percent (e.g. 10) or rupees off
  minOrder?: number; // order subtotal needed, in rupees
  maxDiscount?: number; // cap for percent coupons, in rupees
}

export const coupons: Coupon[] = [
  {
    code: "WELCOME10",
    description: "10% off your order",
    type: "percent",
    value: 10,
    maxDiscount: 50000,
  },
  {
    code: "AVERTO5000",
    description: "₹5,000 off orders above ₹1,00,000",
    type: "flat",
    value: 5000,
    minOrder: 100000,
  },
];

export type CouponResult =
  | { ok: true; coupon: Coupon; discount: number }
  | { ok: false; error: string };

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function applyCoupon(rawCode: string, subtotal: number): CouponResult {
  const code = String(rawCode ?? "").trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a coupon code." };

  const coupon = coupons.find((c) => c.code === code);
  if (!coupon) return { ok: false, error: "That coupon code is not valid." };

  if (coupon.minOrder && subtotal < coupon.minOrder) {
    return { ok: false, error: `This coupon needs an order of ${rupees(coupon.minOrder)} or more.` };
  }

  let discount = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, subtotal); // never more than the order itself
  return { ok: true, coupon, discount };
}

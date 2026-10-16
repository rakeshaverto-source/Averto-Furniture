// SAMPLE COUPONS, so the coupon box can be tried out. The seed copies them into the database;
// manage real offers in the coupons table.
import type { Coupon } from "../../src/data/coupons";

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

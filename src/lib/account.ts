// Shared bits for the customer's "My account" pages.
import "server-only";
import { prisma } from "@/lib/prisma";
import { getProducts } from "@/lib/catalog";
import { PLACED_ORDER } from "@/lib/orders";
import type { FulfillmentStatus } from "@/generated/prisma/client";

// The order journey as customers see it
export const JOURNEY: { value: FulfillmentStatus; label: string; hint: string }[] = [
  { value: "new", label: "Order placed", hint: "We have your order and will call to confirm the details." },
  { value: "confirmed", label: "Confirmed", hint: "Details are final and your piece is scheduled." },
  { value: "in_production", label: "Being made", hint: "Our craftsmen are making your piece." },
  { value: "shipped", label: "On the way", hint: "Your piece has left the workshop." },
  { value: "out_for_delivery", label: "Out for delivery", hint: "Your piece reaches you today." },
  { value: "delivered", label: "Delivered", hint: "Enjoy it! We would love a review." },
];

export const journeyStep = (status: FulfillmentStatus) => JOURNEY.findIndex((s) => s.value === status);

export const balanceDue = (o: { total: number; deposit: number; status: string }) =>
  o.total - (o.status === "deposit_paid" ? o.deposit : 0);

// Main photo per product id, for showing order lines and wishlist items
export async function productPhotos() {
  return new Map((await getProducts()).map((p) => [p.id, { image: p.image, zoomClass: p.zoomClass }]));
}

// Personal coupons the customer can still use, with how many uses are left
export async function couponsFor(email: string) {
  const now = new Date();
  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      allowedEmails: { has: email },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  });
  return Promise.all(
    coupons.map(async (c) => {
      const used = c.maxUsesPerCustomer
        ? await prisma.order.count({
            where: {
              couponCode: c.code,
              fulfillment: { not: "cancelled" },
              customerEmail: { equals: email, mode: "insensitive" },
            },
          })
        : 0;
      const left = c.maxUsesPerCustomer ? Math.max(c.maxUsesPerCustomer - used, 0) : null;
      return { ...c, left };
    }),
  ).then((list) => list.filter((c) => c.left === null || c.left > 0));
}

export async function accountSummary(userId: string, email: string) {
  const [orders, active, saved, coupons] = await Promise.all([
    prisma.order.count({ where: { ...PLACED_ORDER, userId } }),
    prisma.order.count({ where: { ...PLACED_ORDER, userId, fulfillment: { notIn: ["delivered", "cancelled"] } } }),
    prisma.wishlistItem.count({ where: { userId } }),
    couponsFor(email).then((c) => c.length),
  ]);
  return { orders, active, saved, coupons };
}

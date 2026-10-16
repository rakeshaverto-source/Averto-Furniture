// Writing orders to the database. Kept out of the Server Action file so it is not callable from
// the browser and can be tested on its own.
import "server-only";
import { prisma } from "@/lib/prisma";
import { checkCouponLimits } from "@/lib/pricing";
import type { Coupon } from "@/data/coupons";
import type { Prisma } from "@/generated/prisma/client";

export class CouponLimitReached extends Error {}

// Saves the order. With a usage-limited coupon, the limit is checked again inside the same
// transaction while holding a lock on that code, so two checkouts at the same moment can't both
// squeeze past "once per customer".
export async function saveOrder(data: Prisma.OrderCreateInput, coupon: Coupon | undefined, email: string) {
  if (!coupon || (!coupon.maxUses && !coupon.maxUsesPerCustomer)) {
    await prisma.order.create({ data });
    return;
  }
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`coupon:${coupon.code}`}))`;
    const limit = await checkCouponLimits(coupon, email, tx);
    if (limit) throw new CouponLimitReached(limit);
    await tx.order.create({ data });
  });
}

// Keeps a customer's delivery address for next time, unless the same one is already saved.
// The first saved address becomes the default.
export async function rememberAddress(
  userId: string,
  a: { name: string; phone: string; address: string; city: string; state: string; pincode: string },
) {
  const saved = await prisma.address.findMany({ where: { userId }, select: { address: true, pincode: true } });
  const same = (x: string, y: string) => x.trim().toLowerCase() === y.trim().toLowerCase();
  if (saved.some((s) => same(s.address, a.address) && s.pincode === a.pincode)) return;
  if (saved.length >= 10) return; // plenty; the customer can manage them in their account
  await prisma.address.create({
    data: {
      userId,
      label: saved.length === 0 ? "Home" : "",
      name: a.name,
      phone: a.phone,
      address: a.address,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      isDefault: saved.length === 0,
    },
  });
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/slug";
import { FULFILLMENT } from "@/lib/admin-format";
import { normaliseEmail } from "@/data/coupons";
import type { FulfillmentStatus } from "@/generated/prisma/client";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const refreshAdmin = () => revalidatePath("/admin", "layout");

export interface FormState {
  error?: string;
  ok?: string;
}

// ─── Orders ─────────────────────────────────────────────────────────────────

export async function updateOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(formData, "id");
  const fulfillment = text(formData, "fulfillment") as FulfillmentStatus;
  if (!FULFILLMENT.some((f) => f.value === fulfillment)) return { error: "Choose a status." };
  const balancePaid = formData.get("balancePaid") === "on";
  const adminNote = text(formData, "adminNote").slice(0, 2000);

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return { error: "This order no longer exists." };
  await prisma.order.update({
    where: { id },
    data: {
      fulfillment,
      adminNote,
      balancePaid,
      balancePaidAt: balancePaid ? (order.balancePaidAt ?? new Date()) : null,
    },
  });
  refreshAdmin();
  return { ok: "Order updated." };
}

// ─── Reviews ────────────────────────────────────────────────────────────────

export async function setReviewStatus(formData: FormData) {
  await requireAdmin();
  const status = text(formData, "status");
  if (status !== "approved" && status !== "rejected" && status !== "pending") return;
  await prisma.review.updateMany({ where: { id: text(formData, "id") }, data: { status } });
  updateTag("reviews");
  refreshAdmin();
}

export async function deleteReview(formData: FormData) {
  await requireAdmin();
  await prisma.review.deleteMany({ where: { id: text(formData, "id") } });
  updateTag("reviews");
  refreshAdmin();
}

// ─── Coupons ────────────────────────────────────────────────────────────────

export async function saveCoupon(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const existing = text(formData, "existingCode");
  const code = (existing || text(formData, "code")).toUpperCase();
  const description = text(formData, "description");
  const type: "percent" | "flat" = text(formData, "type") === "flat" ? "flat" : "percent";
  const value = Number(text(formData, "value"));
  const minRaw = text(formData, "minOrder");
  const maxRaw = text(formData, "maxDiscount");
  const minOrder = minRaw ? Number(minRaw) : null;
  const maxDiscount = maxRaw ? Number(maxRaw) : null;
  const expiresRaw = text(formData, "expiresAt");
  // The date picker gives a day; the coupon works until the end of that day in India
  const expiresAt = expiresRaw ? new Date(`${expiresRaw}T23:59:59+05:30`) : null;
  const isActive = formData.get("isActive") === "on";
  // Personal coupon: emails separated by commas, spaces or new lines; empty means anyone
  const allowedEmails = [
    ...new Set(
      text(formData, "allowedEmails")
        .split(/[\s,;]+/)
        .map(normaliseEmail)
        .filter(Boolean),
    ),
  ];
  const usesRaw = text(formData, "maxUses");
  const perCustomerRaw = text(formData, "maxUsesPerCustomer");
  const maxUses = usesRaw ? Number(usesRaw) : null;
  const maxUsesPerCustomer = perCustomerRaw ? Number(perCustomerRaw) : null;
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) return { error: "Total uses must be a whole number, 1 or more." };
  if (maxUsesPerCustomer !== null && (!Number.isInteger(maxUsesPerCustomer) || maxUsesPerCustomer < 1)) {
    return { error: "Uses per customer must be a whole number, 1 or more." };
  }
  const badEmail = allowedEmails.find((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  if (badEmail) return { error: `"${badEmail}" is not a valid email.` };
  if (allowedEmails.length > 500) return { error: "A coupon can be limited to at most 500 emails." };

  if (!/^[A-Z0-9]{3,20}$/.test(code)) return { error: "Code: 3 to 20 letters or numbers, no spaces." };
  if (description.length < 3 || description.length > 120) {
    return { error: "Add a short description (customers see it)." };
  }
  if (!Number.isInteger(value) || value < 1) return { error: "Enter the discount as a whole number." };
  if (type === "percent" && value > 90) return { error: "A percent discount can be at most 90%." };
  if (minOrder !== null && (!Number.isInteger(minOrder) || minOrder < 1)) {
    return { error: "Minimum order must be a whole number of rupees." };
  }
  if (maxDiscount !== null && (!Number.isInteger(maxDiscount) || maxDiscount < 1)) {
    return { error: "Maximum discount must be a whole number of rupees." };
  }
  if (expiresAt && Number.isNaN(expiresAt.getTime())) return { error: "That expiry date is not valid." };

  const data = {
    description,
    type,
    value,
    minOrder,
    maxDiscount: type === "percent" ? maxDiscount : null, // a cap only means something for percent coupons
    expiresAt,
    isActive,
    allowedEmails,
    maxUses,
    maxUsesPerCustomer,
  };
  if (existing) {
    await prisma.coupon.update({ where: { code }, data });
  } else {
    if (await prisma.coupon.findUnique({ where: { code } })) return { error: `${code} already exists.` };
    await prisma.coupon.create({ data: { code, ...data } });
  }
  refreshAdmin();
  return { ok: existing ? `${code} saved.` : `${code} created.` };
}

export async function deleteCoupon(formData: FormData) {
  await requireAdmin();
  // Orders keep the code as plain text, so old orders still show which coupon they used
  await prisma.coupon.deleteMany({ where: { code: text(formData, "code") } });
  refreshAdmin();
}

// ─── Categories ─────────────────────────────────────────────────────────────

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const existing = text(formData, "existingId");
  const name = text(formData, "name");
  const id = existing || slugify(name);
  const blurb = text(formData, "blurb");
  const sortOrder = Number(text(formData, "sortOrder") || 0);

  if (name.length < 2 || name.length > 40) return { error: "Name should be 2 to 40 characters." };
  if (!id) return { error: "Use letters or numbers in the name." };
  if (blurb.length > 160) return { error: "Keep the short description under 160 characters." };
  if (!Number.isInteger(sortOrder)) return { error: "Position must be a whole number." };

  if (existing) {
    await prisma.category.update({ where: { id }, data: { name, blurb, sortOrder } });
  } else {
    if (await prisma.category.findUnique({ where: { id } })) return { error: "A category with this name already exists." };
    await prisma.category.create({ data: { id, name, blurb, sortOrder } });
  }
  updateTag("catalog");
  refreshAdmin();
  return { ok: existing ? `${name} saved.` : `${name} added.` };
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id");
  const inUse = await prisma.product.count({ where: { categoryId: id } });
  if (inUse > 0) redirect(`/admin/categories?inuse=${encodeURIComponent(id)}`);
  await prisma.category.deleteMany({ where: { id } });
  updateTag("catalog");
  refreshAdmin();
}

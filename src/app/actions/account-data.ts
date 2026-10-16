"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/customer-auth";
import { getProduct } from "@/lib/catalog";
import { createSupabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createRazorpayOrder, isGenuinePayment, razorpayKeys } from "@/lib/razorpay";

export interface FormResult {
  error?: string;
  ok?: string;
  fieldErrors?: Record<string, string>;
}

const text = (formData: FormData, key: string, max = 200) => String(formData.get(key) ?? "").trim().slice(0, max);
const refreshAccount = () => revalidatePath("/account", "layout");
const validPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13;
};

// ─── Profile ────────────────────────────────────────────────────────────────

export async function updateProfile(_prev: FormResult, formData: FormData): Promise<FormResult> {
  if (!(await getCustomer())) return { error: "Please log in again." };
  const name = text(formData, "name", 80);
  const phone = text(formData, "phone", 20);
  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Please enter your full name.";
  if (!validPhone(phone)) fieldErrors.phone = "Please enter a valid phone number.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.updateUser({ data: { full_name: name, phone } });
  if (error) return { error: "Could not save. Please try again." };
  // The name lives inside the session token, so get a fresh one for the pages to show it
  await supabase.auth.refreshSession();
  refreshAccount();
  return { ok: "Saved." };
}

// ─── Addresses ──────────────────────────────────────────────────────────────

export async function saveAddress(_prev: FormResult, formData: FormData): Promise<FormResult> {
  const customer = await getCustomer();
  if (!customer) return { error: "Please log in again." };
  const id = text(formData, "id", 40);
  const data = {
    label: text(formData, "label", 30),
    name: text(formData, "name", 80),
    phone: text(formData, "phone", 20),
    address: text(formData, "address", 240),
    city: text(formData, "city", 60),
    state: text(formData, "state", 60),
    pincode: text(formData, "pincode", 10),
  };
  const fieldErrors: Record<string, string> = {};
  if (data.name.length < 2) fieldErrors.name = "Enter the name to deliver to.";
  if (!validPhone(data.phone)) fieldErrors.phone = "Enter a valid phone number.";
  if (data.address.length < 5) fieldErrors.address = "Enter the street address.";
  if (data.city.length < 2) fieldErrors.city = "Enter the city.";
  if (data.state.length < 2) fieldErrors.state = "Enter the state.";
  if (!/^\d{6}$/.test(data.pincode)) fieldErrors.pincode = "Enter a 6-digit pincode.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  if (id) {
    // updateMany with the user id, so nobody can edit another customer's address
    const { count } = await prisma.address.updateMany({ where: { id, userId: customer.id }, data });
    if (!count) return { error: "This address no longer exists." };
  } else {
    const existing = await prisma.address.count({ where: { userId: customer.id } });
    if (existing >= 10) return { error: "You can save up to 10 addresses." };
    await prisma.address.create({ data: { ...data, userId: customer.id, isDefault: existing === 0 } });
  }
  refreshAccount();
  return { ok: id ? "Address updated." : "Address saved." };
}

export async function deleteAddress(formData: FormData) {
  const customer = await getCustomer();
  if (!customer) return;
  const id = text(formData, "id", 40);
  const removed = await prisma.address.findFirst({ where: { id, userId: customer.id } });
  if (!removed) return;
  await prisma.address.delete({ where: { id } });
  // keep one default address if any remain
  if (removed.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId: customer.id }, orderBy: { createdAt: "asc" } });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  refreshAccount();
}

export async function setDefaultAddress(formData: FormData) {
  const customer = await getCustomer();
  if (!customer) return;
  const id = text(formData, "id", 40);
  if (!(await prisma.address.findFirst({ where: { id, userId: customer.id } }))) return;
  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId: customer.id }, data: { isDefault: false } }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  refreshAccount();
}

// ─── Wishlist ───────────────────────────────────────────────────────────────

export async function getWishlistIds(): Promise<string[]> {
  const customer = await getCustomer();
  if (!customer) return [];
  const rows = await prisma.wishlistItem.findMany({ where: { userId: customer.id }, select: { productId: true } });
  return rows.map((r) => r.productId);
}

export async function toggleWishlist(productId: unknown): Promise<{ saved: boolean } | { needsLogin: true }> {
  const customer = await getCustomer();
  if (!customer) return { needsLogin: true };
  const id = String(productId ?? "").slice(0, 100);
  const existing = await prisma.wishlistItem.findUnique({ where: { userId_productId: { userId: customer.id, productId: id } } });
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    refreshAccount();
    return { saved: false };
  }
  if (!(await getProduct(id))) return { saved: false };
  await prisma.wishlistItem.create({ data: { userId: customer.id, productId: id } });
  refreshAccount();
  return { saved: true };
}

export async function removeFromWishlist(formData: FormData) {
  const customer = await getCustomer();
  if (!customer) return;
  await prisma.wishlistItem.deleteMany({ where: { userId: customer.id, productId: text(formData, "productId", 100) } });
  refreshAccount();
}

// ─── Reviews from "My account" ──────────────────────────────────────────────

export async function submitAccountReview(_prev: FormResult, formData: FormData): Promise<FormResult> {
  const customer = await getCustomer();
  if (!customer) return { error: "Please log in again." };
  const productId = text(formData, "productId", 100);
  const rating = Number(text(formData, "rating", 1));
  const title = text(formData, "title", 80);
  const body = text(formData, "text", 1000);
  const location = text(formData, "location", 60);

  const fieldErrors: Record<string, string> = {};
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) fieldErrors.rating = "Choose a star rating.";
  if (title.length < 3) fieldErrors.title = "Add a short title.";
  if (body.length < 20) fieldErrors.text = "Please write at least 20 characters.";
  if (Object.keys(fieldErrors).length) return { fieldErrors };
  if (!(await getProduct(productId))) return { error: "This product is no longer available to review." };

  // "Verified buyer" only for a product the customer received
  const delivered = await prisma.orderItem.count({
    where: { productId, order: { userId: customer.id, fulfillment: "delivered" } },
  });
  if (!delivered) return { error: "You can review a product once it has been delivered to you." };
  if (await prisma.review.findUnique({ where: { userId_productId: { userId: customer.id, productId } } })) {
    return { error: "You have already reviewed this product." };
  }

  await prisma.review.create({
    data: {
      productId,
      userId: customer.id,
      verified: true,
      rating,
      title,
      text: body,
      name: customer.name || customer.email.split("@")[0],
      location,
      email: customer.email,
      status: "pending", // still read by the team before it appears
    },
  });
  refreshAccount();
  return { ok: "Thank you! Your review will appear once our team has read it." };
}

// ─── Paying the balance online ──────────────────────────────────────────────

const balanceDue = (o: { total: number; deposit: number; status: string }) =>
  o.total - (o.status === "deposit_paid" ? o.deposit : 0);

export type StartBalanceResult =
  | { ok: false; error: string }
  | { ok: true; keyId: string; razorpayOrderId: string; amountPaise: number; ref: string };

export async function startBalancePayment(ref: unknown): Promise<StartBalanceResult> {
  const customer = await getCustomer();
  if (!customer) return { ok: false, error: "Please log in again." };
  const keys = razorpayKeys();
  if (!keys) return { ok: false, error: "Online payment is not available yet. Our team will contact you." };

  const order = await prisma.order.findFirst({ where: { ref: String(ref ?? ""), userId: customer.id } });
  // Only the balance after an online advance; anything else is settled with the team
  if (!order || order.status !== "deposit_paid" || order.balancePaid || order.fulfillment === "cancelled") {
    return { ok: false, error: "There is nothing to pay on this order right now." };
  }
  const amount = balanceDue(order);
  const razorpayOrderId = await createRazorpayOrder(amount, `${order.ref}-BAL`);
  if (!razorpayOrderId) return { ok: false, error: "We could not start the payment. Please try again." };
  await prisma.order.update({ where: { id: order.id }, data: { balanceRazorpayOrderId: razorpayOrderId } });
  return { ok: true, keyId: keys.keyId, razorpayOrderId, amountPaise: amount * 100, ref: order.ref };
}

export async function confirmBalancePayment(input: {
  ref: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const customer = await getCustomer();
  if (!customer) return { ok: false, error: "Please log in again." };
  try {
    const order = await prisma.order.findFirst({ where: { ref: String(input?.ref ?? ""), userId: customer.id } });
    if (!order?.balanceRazorpayOrderId || order.balanceRazorpayOrderId !== String(input.razorpay_order_id)) {
      return { ok: false, error: "We could not match this payment to your order." };
    }
    if (order.balancePaid) return { ok: true };
    const valid = isGenuinePayment(
      order.balanceRazorpayOrderId,
      String(input.razorpay_payment_id),
      String(input.razorpay_signature),
    );
    if (!valid) return { ok: false, error: "We could not verify this payment." };
    await prisma.order.update({
      where: { id: order.id },
      data: { balancePaid: true, balancePaidAt: new Date(), balanceRazorpayPaymentId: String(input.razorpay_payment_id) },
    });
    refreshAccount();
    return { ok: true };
  } catch {
    return { ok: false, error: "We could not confirm this payment right now." };
  }
}

// ─── Deleting the account ───────────────────────────────────────────────────

export async function deleteAccount(_prev: FormResult, formData: FormData): Promise<FormResult> {
  const customer = await getCustomer();
  if (!customer) return { error: "Please log in again." };
  if (text(formData, "confirm", 20).toUpperCase() !== "DELETE") return { error: 'Type DELETE to confirm.' };

  try {
    // Orders stay for accounting and warranty but no longer point to the account. Saved addresses,
    // the wishlist and reviews go.
    await prisma.$transaction([
      prisma.order.updateMany({ where: { userId: customer.id }, data: { userId: null } }),
      prisma.address.deleteMany({ where: { userId: customer.id } }),
      prisma.wishlistItem.deleteMany({ where: { userId: customer.id } }),
      prisma.review.deleteMany({ where: { userId: customer.id } }),
    ]);
    const { error } = await supabaseAdmin().auth.admin.deleteUser(customer.id);
    if (error) throw error;
  } catch {
    return { error: "We could not delete your account right now. Please contact us and we will do it for you." };
  }
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/?account-deleted=1");
}

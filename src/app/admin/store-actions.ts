"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/slug";
import { FULFILLMENT, formatDate } from "@/lib/admin-format";
import { normaliseEmail } from "@/data/coupons";
import { refreshOrders, saveOrderChange } from "@/lib/order-status";
import { hashPin, isValidPin, normalisePhone } from "@/lib/driver-auth";
import { pinOrderDrop } from "@/lib/geo";
import { returnUpdateEmail, sendMail } from "@/lib/mailer";
import { SITE_URL } from "@/lib/seo";
import { RETURN_STATUSES } from "@/data/returns";
import type { FulfillmentStatus, ReturnStatus } from "@/generated/prisma/client";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const refreshAdmin = () => revalidatePath("/admin", "layout");

export interface FormState {
  error?: string;
  ok?: string;
}

// ─── Orders ─────────────────────────────────────────────────────────────────

const isFulfillment = (value: string): value is FulfillmentStatus => FULFILLMENT.some((f) => f.value === value);

export async function updateOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("orders");
  const id = text(formData, "id");
  const fulfillment = text(formData, "fulfillment");
  if (!isFulfillment(fulfillment)) return { error: "Choose a status." };
  const balancePaid = formData.get("balancePaid") === "on";
  const adminNote = text(formData, "adminNote").slice(0, 2000);
  const expected = text(formData, "expectedDelivery");
  if (expected && !/^\d{4}-\d{2}-\d{2}$/.test(expected)) return { error: "Enter a valid delivery date." };
  const trackingUrl = text(formData, "trackingUrl").slice(0, 500);
  if (trackingUrl && !/^https?:\/\//i.test(trackingUrl)) return { error: "The tracking link should start with https://" };
  // Choosing one of our drivers copies their details onto the order; "none" clears them
  const driverId = text(formData, "driverId");
  const driver = driverId ? await prisma.driver.findUnique({ where: { id: driverId } }) : null;
  if (driverId && !driver) return { error: "That driver no longer exists." };

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return { error: "This order no longer exists." };
  if (driver && !driver.isActive && order.driverId !== driver.id) return { error: `${driver.name} is turned off.` };
  await saveOrderChange(order, {
    fulfillment,
    adminNote,
    balancePaid,
    balancePaidAt: balancePaid ? (order.balancePaidAt ?? new Date()) : null,
    expectedDelivery: expected ? new Date(`${expected}T00:00:00Z`) : null,
    courierName: text(formData, "courierName").slice(0, 80),
    trackingNumber: text(formData, "trackingNumber").slice(0, 80),
    trackingUrl,
    driverId: driver?.id ?? null,
    driverName: driver?.name ?? "",
    driverPhone: driver?.phone ?? "",
    vehicleNumber: driver?.vehicleNumber ?? "",
    deliverySlot: text(formData, "deliverySlot").slice(0, 40),
  });
  refreshOrders();
  return { ok: "Order updated." };
}

// ─── Returns ────────────────────────────────────────────────────────────────

const isReturnStatus = (value: string): value is ReturnStatus => RETURN_STATUSES.some((s) => s.value === value);

// Moves a customer's return along: decide, fix the pickup, mark it collected and refunded.
// The customer gets an email whenever the status changes.
export async function updateReturn(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("orders");
  const id = text(formData, "id");
  const status = text(formData, "status");
  if (!isReturnStatus(status)) return { error: "Choose a status." };
  const request = await prisma.returnRequest.findUnique({ where: { id }, include: { order: true } });
  if (!request) return { error: "This return no longer exists." };

  const pickup = text(formData, "pickupDate");
  if (pickup && !/^\d{4}-\d{2}-\d{2}$/.test(pickup)) return { error: "Enter a valid pickup date." };
  if (status === "pickup_scheduled" && !pickup) return { error: "Choose the pickup date." };

  const driverId = text(formData, "driverId");
  const driver = driverId ? await prisma.driver.findUnique({ where: { id: driverId } }) : null;
  if (driverId && !driver) return { error: "That driver no longer exists." };
  if (driver && !driver.isActive && request.driverId !== driver.id) return { error: `${driver.name} is turned off.` };

  const refundRaw = text(formData, "refundAmount");
  const refundAmount = refundRaw ? Number(refundRaw) : null;
  if (refundAmount !== null && (!Number.isInteger(refundAmount) || refundAmount < 1 || refundAmount > request.order.total)) {
    return { error: `The refund should be a whole amount up to ${request.order.total.toLocaleString("en-IN")}.` };
  }
  if (status === "refunded" && refundAmount === null) return { error: "Enter the amount refunded." };

  const teamMessage = text(formData, "teamMessage").slice(0, 1000);
  if (status === "rejected" && !teamMessage) return { error: "Tell the customer why the return was declined." };

  const now = new Date();
  const changed = status !== request.status;
  await prisma.returnRequest.update({
    where: { id },
    data: {
      status,
      teamMessage,
      adminNote: text(formData, "adminNote").slice(0, 2000),
      pickupDate: pickup ? new Date(`${pickup}T00:00:00Z`) : null,
      pickupSlot: text(formData, "pickupSlot").slice(0, 40),
      driverId: driver?.id ?? null,
      driverName: driver?.name ?? "",
      driverPhone: driver?.phone ?? "",
      vehicleNumber: driver?.vehicleNumber ?? "",
      refundAmount,
      decidedAt: status === "requested" ? null : (request.decidedAt ?? now),
      pickedUpAt: status === "picked_up" || status === "refunded" ? (request.pickedUpAt ?? now) : null,
      refundedAt: status === "refunded" ? (request.refundedAt ?? now) : null,
    },
  });

  if (changed && status !== "requested") {
    const info = RETURN_STATUSES.find((s) => s.value === status)!;
    const pickupText = [pickup && formatDate(new Date(`${pickup}T00:00:00Z`)), text(formData, "pickupSlot")].filter(Boolean).join(", ");
    const message =
      status === "pickup_scheduled" && pickupText
        ? `We'll collect the piece on ${pickupText}${driver ? `; ${driver.name} (${driver.phone}) will come by` : ""}. ${info.hint}`
        : status === "refunded" && refundAmount
          ? `We've refunded ₹${refundAmount.toLocaleString("en-IN")}. ${info.hint}`
          : `${info.hint}${teamMessage ? ` Note from our team: ${teamMessage}` : ""}`;
    const to = request.order.customerEmail;
    after(async () => {
      try {
        await sendMail({ to, ...returnUpdateEmail({ ref: request.order.ref, heading: info.label, message, siteUrl: SITE_URL }) });
      } catch (e) {
        console.error("Return update email not sent", e);
      }
    });
  }
  refreshOrders();
  return { ok: changed ? "Saved. An email to the customer is on its way." : "Saved." };
}

// ─── Drivers ────────────────────────────────────────────────────────────────

// Adds a driver, or updates one when an id is sent. The PIN is required for a new driver and,
// when editing, only changed if a new one is typed.
export async function saveDriver(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("drivers");
  const id = text(formData, "id");
  const name = text(formData, "name").slice(0, 80);
  const phone = normalisePhone(text(formData, "phone"));
  const pin = text(formData, "pin");
  const vehicleNumber = text(formData, "vehicleNumber").slice(0, 20).toUpperCase();
  const isActive = id ? formData.get("isActive") === "on" : true;
  if (!name) return { error: "Enter the driver's name." };
  if (!phone) return { error: "Enter the driver's 10-digit mobile number." };
  if ((!id || pin) && !isValidPin(pin)) return { error: "The PIN should be 4 to 6 digits." };

  const taken = await prisma.driver.findUnique({ where: { phone } });
  if (taken && taken.id !== id) return { error: `${phone} is already used by ${taken.name}.` };

  const data = { name, phone, vehicleNumber, isActive, ...(pin ? { pinHash: hashPin(pin), failedLogins: 0, lockedUntil: null } : {}) };
  if (id) {
    await prisma.$transaction([
      prisma.driver.update({ where: { id }, data }),
      // A new PIN or turning the driver off signs them out of the app
      ...(pin || !isActive ? [prisma.driverSession.deleteMany({ where: { driverId: id } })] : []),
    ]);
  } else {
    await prisma.driver.create({ data: { ...data, pinHash: hashPin(pin) } });
  }
  refreshAdmin();
  return { ok: id ? "Driver updated." : `${name} added. Share the phone number and PIN with them.` };
}

// Signs the driver out of the app on every phone, e.g. after a phone is lost
export async function signOutDriver(formData: FormData) {
  await requireAdmin("drivers");
  await prisma.driverSession.deleteMany({ where: { driverId: text(formData, "id") } });
  refreshAdmin();
}

// The status dropdown on the orders list
export async function setOrderStatus(formData: FormData) {
  await requireAdmin("orders");
  const fulfillment = text(formData, "fulfillment");
  if (!isFulfillment(fulfillment)) return;
  const order = await prisma.order.findUnique({ where: { id: text(formData, "id") } });
  if (!order || order.fulfillment === fulfillment) return;
  await saveOrderChange(order, { fulfillment });
  refreshOrders();
}

// Corrects the customer's details, the items (quantity 0 removes one) and the discount.
// Totals are worked out again here; an advance already paid online is never changed.
export async function updateOrderDetails(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("orders");
  const order = await prisma.order.findUnique({ where: { id: text(formData, "id") }, include: { items: true } });
  if (!order) return { error: "This order no longer exists." };

  const customer = {
    customerName: text(formData, "customerName").slice(0, 80),
    customerPhone: text(formData, "customerPhone").slice(0, 20),
    address: text(formData, "address").slice(0, 240),
    locality: text(formData, "locality").slice(0, 80),
    landmark: text(formData, "landmark").slice(0, 80),
    city: text(formData, "city").slice(0, 60),
    tehsil: text(formData, "tehsil").slice(0, 60),
    state: text(formData, "state").slice(0, 60),
    pincode: text(formData, "pincode").slice(0, 10),
  };
  const digits = customer.customerPhone.replace(/\D/g, "");
  if (customer.customerName.length < 2) return { error: "Enter the customer's name." };
  if (digits.length < 10 || digits.length > 13) return { error: "Enter a valid phone number." };
  if (customer.address.length < 5 || customer.city.length < 2 || customer.state.length < 2) {
    return { error: "Enter the full delivery address." };
  }
  if (!/^\d{6}$/.test(customer.pincode)) return { error: "Enter a 6-digit pincode." };

  const items = order.items.map((item) => ({
    id: item.id,
    qty: Math.floor(Number(formData.get(`qty_${item.id}`))),
    unitPrice: Math.round(Number(formData.get(`price_${item.id}`))),
  }));
  if (items.some((i) => !Number.isFinite(i.qty) || i.qty < 0 || i.qty > 99)) return { error: "Quantities must be 0 to 99." };
  if (items.some((i) => !Number.isFinite(i.unitPrice) || i.unitPrice < 0)) return { error: "Enter a valid price for each item." };
  const kept = items.filter((i) => i.qty > 0);
  if (kept.length === 0) return { error: "An order needs at least one item. To drop the whole order, set it to Cancelled." };

  const subtotal = kept.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const discount = Math.round(Number(formData.get("discount")) || 0);
  if (discount < 0 || discount > subtotal) return { error: "The discount can't be more than the subtotal." };
  const total = subtotal - discount;
  const advancePaid = order.status === "deposit_paid";
  const deposit = advancePaid ? order.deposit : Math.round((total * order.depositPercent) / 100);
  // More to pay than before means the balance is no longer settled
  const stillSettled = order.balancePaid && total <= order.total;
  // A changed address no longer matches the drop pin on the map, so it is looked up again
  const moved = (["address", "locality", "city", "state", "pincode"] as const).some((k) => customer[k] !== order[k]);

  await prisma.$transaction([
    ...items.map((i) =>
      i.qty > 0
        ? prisma.orderItem.update({ where: { id: i.id }, data: { qty: i.qty, unitPrice: i.unitPrice } })
        : prisma.orderItem.delete({ where: { id: i.id } }),
    ),
    prisma.order.update({
      where: { id: order.id },
      data: {
        ...customer,
        subtotal,
        discount,
        total,
        deposit,
        balancePaid: stillSettled,
        balancePaidAt: stillSettled ? order.balancePaidAt : null,
        ...(moved ? { dropLat: null, dropLng: null } : {}),
      },
    }),
  ]);
  if (moved) after(() => pinOrderDrop(order.ref));
  refreshOrders();
  const overpaid = (advancePaid ? deposit : 0) - total;
  return {
    ok:
      overpaid > 0
        ? `Order updated. The customer has paid ₹${overpaid.toLocaleString("en-IN")} more than the new total, so arrange a refund.`
        : "Order updated.",
  };
}

// ─── Reviews ────────────────────────────────────────────────────────────────

export async function setReviewStatus(formData: FormData) {
  await requireAdmin("reviews");
  const status = text(formData, "status");
  if (status !== "approved" && status !== "rejected" && status !== "pending") return;
  await prisma.review.updateMany({ where: { id: text(formData, "id") }, data: { status } });
  updateTag("reviews");
  refreshAdmin();
}

export async function deleteReview(formData: FormData) {
  await requireAdmin("reviews");
  await prisma.review.deleteMany({ where: { id: text(formData, "id") } });
  updateTag("reviews");
  refreshAdmin();
}

// ─── Coupons ────────────────────────────────────────────────────────────────

export async function saveCoupon(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("coupons");
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
  await requireAdmin("coupons");
  // Orders keep the code as plain text, so old orders still show which coupon they used
  await prisma.coupon.deleteMany({ where: { code: text(formData, "code") } });
  refreshAdmin();
}

// ─── Categories ─────────────────────────────────────────────────────────────

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("categories");
  const existing = text(formData, "existingId");
  const name = text(formData, "name");
  const id = existing || slugify(name);
  const blurb = text(formData, "blurb");
  const sortOrder = Number(text(formData, "sortOrder") || 0);
  // An uploaded photo (categories/…) or one of the sample photos in /public
  const image = text(formData, "image");
  const onHomePage = formData.get("onHomePage") === "on";

  if (name.length < 2 || name.length > 40) return { error: "Name should be 2 to 40 characters." };
  if (!id) return { error: "Use letters or numbers in the name." };
  if (blurb.length > 160) return { error: "Keep the short description under 160 characters." };
  if (!Number.isInteger(sortOrder)) return { error: "Position must be a whole number." };
  if (image && !/^(categories\/[\w-]+\.webp|\/hero\/[\w.-]+)$/.test(image)) return { error: "Upload the photo again." };

  const data = { name, blurb, sortOrder, image, onHomePage };
  if (existing) {
    await prisma.category.update({ where: { id }, data });
  } else {
    if (await prisma.category.findUnique({ where: { id } })) return { error: "A category with this name already exists." };
    await prisma.category.create({ data: { id, ...data } });
  }
  updateTag("catalog");
  refreshAdmin();
  return { ok: existing ? `${name} saved.` : `${name} added.` };
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin("categories");
  const id = text(formData, "id");
  const inUse = await prisma.product.count({ where: { categoryId: id } });
  if (inUse > 0) redirect(`/admin/categories?inuse=${encodeURIComponent(id)}`);
  await prisma.category.deleteMany({ where: { id } });
  updateTag("catalog");
  refreshAdmin();
}

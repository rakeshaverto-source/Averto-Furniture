"use server";

import { promises as fs } from "fs";
import path from "path";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { DEPOSIT_PERCENT, MAX_QTY_PER_LINE, depositFor, resolveLine } from "@/data/store";
import { applyCoupon } from "@/data/coupons";

export interface CheckoutItem {
  productId: string;
  colorId?: string;
  qty: number;
}

export interface CheckoutCustomer {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
}

export type CreateOrderResult =
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof CheckoutCustomer, string>> }
  | { ok: true; mode: "manual"; ref: string; total: number; deposit: number }
  | {
      ok: true;
      mode: "razorpay";
      ref: string;
      total: number;
      deposit: number;
      keyId: string;
      razorpayOrderId: string;
      amountPaise: number;
    };

export type ConfirmPaymentResult = { ok: true; ref: string } | { ok: false; error: string };

interface StoredOrder {
  ref: string;
  createdAt: string;
  // received: no payment gateway configured, the team follows up | awaiting_payment | deposit_paid
  status: "received" | "awaiting_payment" | "deposit_paid";
  customer: CheckoutCustomer;
  lines: { productId: string; name: string; colorId?: string; colorName?: string; qty: number; unit: number }[];
  subtotal: number;
  couponCode?: string;
  discount: number;
  total: number;
  deposit: number;
  depositPercent: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: string;
}

// Orders are kept in this file for now (never committed, see .gitignore). A real database is the
// next step before launch; the shape above is what to store there.
const ORDERS_FILE = path.join(process.cwd(), "data", "orders.json");

async function readOrders(): Promise<StoredOrder[]> {
  try {
    const data: unknown = JSON.parse(await fs.readFile(ORDERS_FILE, "utf8"));
    return Array.isArray(data) ? (data as StoredOrder[]) : [];
  } catch {
    return [];
  }
}

async function writeOrders(orders: StoredOrder[]) {
  await fs.mkdir(path.dirname(ORDERS_FILE), { recursive: true });
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

const clean = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

function validateCustomer(input: CheckoutCustomer) {
  const customer: CheckoutCustomer = {
    name: clean(input?.name, 80),
    phone: clean(input?.phone, 20),
    email: clean(input?.email, 120),
    address: clean(input?.address, 240),
    city: clean(input?.city, 60),
    state: clean(input?.state, 60),
    pincode: clean(input?.pincode, 10),
    notes: clean(input?.notes, 1000),
  };
  const errors: Partial<Record<keyof CheckoutCustomer, string>> = {};
  if (customer.name.length < 2) errors.name = "Please enter your full name.";
  const digits = customer.phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) errors.phone = "Please enter a valid phone number.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) errors.email = "Please enter a valid email address.";
  if (customer.address.length < 5) errors.address = "Please enter the delivery address.";
  if (customer.city.length < 2) errors.city = "Please enter the city.";
  if (customer.state.length < 2) errors.state = "Please enter the state.";
  if (!/^\d{6}$/.test(customer.pincode)) errors.pincode = "Please enter a 6-digit pincode.";
  return { customer, errors };
}

export async function createOrder(
  items: CheckoutItem[],
  customerInput: CheckoutCustomer,
  couponInput?: string,
): Promise<CreateOrderResult> {
  // This can be called directly with a POST, so the cart and the amount are rebuilt here from our own
  // price list; nothing the browser sends about prices is trusted.
  if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
    return { ok: false, error: "Your cart is empty." };
  }
  const lines: StoredOrder["lines"] = [];
  for (const item of items) {
    const resolved = resolveLine(String(item?.productId), item?.colorId ? String(item.colorId) : undefined);
    const qty = Math.floor(Number(item?.qty));
    if (!resolved || !Number.isFinite(qty) || qty < 1 || qty > MAX_QTY_PER_LINE) {
      return { ok: false, error: "Something in your cart is no longer available. Please review it and try again." };
    }
    lines.push({
      productId: resolved.product.id,
      name: resolved.product.name,
      colorId: resolved.color?.id,
      colorName: resolved.color?.name,
      qty,
      unit: resolved.unit,
    });
  }

  const { customer, errors } = validateCustomer(customerInput);
  if (Object.keys(errors).length > 0) {
    return { ok: false, error: "Please check the highlighted details.", fieldErrors: errors };
  }

  const subtotal = lines.reduce((sum, l) => sum + l.unit * l.qty, 0);

  // The coupon is checked again here against our own list and the rebuilt subtotal
  let discount = 0;
  let couponCode: string | undefined;
  if (couponInput) {
    const result = applyCoupon(couponInput, subtotal);
    if (!result.ok) return { ok: false, error: `Your coupon could not be applied. ${result.error}` };
    discount = result.discount;
    couponCode = result.coupon.code;
  }
  const total = subtotal - discount;
  const deposit = depositFor(total);
  const ref = `AV-${randomBytes(5).toString("hex").toUpperCase()}`;
  const order: StoredOrder = {
    ref,
    createdAt: new Date().toISOString(),
    status: "received",
    customer,
    lines,
    subtotal,
    couponCode,
    discount,
    total,
    deposit,
    depositPercent: DEPOSIT_PERCENT,
  };

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  try {
    if (!keyId || !keySecret) {
      // No payment gateway set up yet: keep the order so the team can contact the customer
      await writeOrders([...(await readOrders()), order]);
      return { ok: true, mode: "manual", ref, total, deposit };
    }

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      body: JSON.stringify({ amount: deposit * 100, currency: "INR", receipt: ref, notes: { ref } }),
    });
    if (!response.ok) {
      return { ok: false, error: "We could not start the payment. Please try again in a moment." };
    }
    const razorpayOrder = (await response.json()) as { id?: string };
    if (!razorpayOrder.id) {
      return { ok: false, error: "We could not start the payment. Please try again in a moment." };
    }

    order.status = "awaiting_payment";
    order.razorpayOrderId = razorpayOrder.id;
    await writeOrders([...(await readOrders()), order]);
    return {
      ok: true,
      mode: "razorpay",
      ref,
      total,
      deposit,
      keyId,
      razorpayOrderId: razorpayOrder.id,
      amountPaise: deposit * 100,
    };
  } catch {
    return { ok: false, error: "We could not place your order right now. Please try again or contact us." };
  }
}

export async function confirmPayment(input: {
  ref: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<ConfirmPaymentResult> {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return { ok: false, error: "Payments are not configured." };

  const orders = await readOrders();
  const order = orders.find((o) => o.ref === String(input?.ref));
  if (!order || !order.razorpayOrderId || order.razorpayOrderId !== String(input.razorpay_order_id)) {
    return { ok: false, error: "We could not match this payment to an order." };
  }
  if (order.status === "deposit_paid") return { ok: true, ref: order.ref };

  // Razorpay signs "order_id|payment_id" with our secret; anything else is not a real payment
  const expected = createHmac("sha256", keySecret)
    .update(`${order.razorpayOrderId}|${String(input.razorpay_payment_id)}`)
    .digest("hex");
  const given = String(input.razorpay_signature);
  const valid =
    given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!valid) return { ok: false, error: "We could not verify this payment." };

  order.status = "deposit_paid";
  order.razorpayPaymentId = String(input.razorpay_payment_id);
  order.paidAt = new Date().toISOString();
  await writeOrders(orders);
  return { ok: true, ref: order.ref };
}

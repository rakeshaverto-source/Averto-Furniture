"use server";

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { DEPOSIT_PERCENT, depositFor } from "@/data/store";
import { prisma } from "@/lib/prisma";
import { MAX_CART_LINES, priceCoupon, priceItems, subtotalOf } from "@/lib/pricing";

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
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_CART_LINES) {
    return { ok: false, error: "Your cart is empty." };
  }
  let priced: Awaited<ReturnType<typeof priceItems>>;
  try {
    priced = await priceItems(items);
  } catch {
    return { ok: false, error: "We could not place your order right now. Please try again or contact us." };
  }
  const { lines, missing } = priced;
  if (missing > 0 || lines.length === 0) {
    return { ok: false, error: "Something in your cart is no longer available. Please review it and try again." };
  }

  const { customer, errors } = validateCustomer(customerInput);
  if (Object.keys(errors).length > 0) {
    return { ok: false, error: "Please check the highlighted details.", fieldErrors: errors };
  }

  const subtotal = subtotalOf(lines);

  // The coupon is checked again here against the database and the rebuilt subtotal
  let discount = 0;
  let couponCode: string | undefined;
  if (couponInput) {
    const result = await priceCoupon(String(couponInput), subtotal);
    if (!result.ok) return { ok: false, error: `Your coupon could not be applied. ${result.error}` };
    discount = result.discount;
    couponCode = result.coupon.code;
  }
  const total = subtotal - discount;
  const deposit = depositFor(total);
  const ref = `AV-${randomBytes(5).toString("hex").toUpperCase()}`;
  const order = {
    ref,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerEmail: customer.email,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    pincode: customer.pincode,
    notes: customer.notes,
    subtotal,
    couponCode,
    discount,
    total,
    deposit,
    depositPercent: DEPOSIT_PERCENT,
    // a copy of what was bought, so later price or name changes never rewrite this order
    items: {
      create: lines.map((l) => ({
        productId: l.productId,
        name: l.product.name,
        colorSlug: l.colorId,
        colorName: l.color?.name,
        qty: l.qty,
        unitPrice: l.unit,
      })),
    },
  };

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  try {
    if (!keyId || !keySecret) {
      // No payment gateway set up yet: keep the order so the team can contact the customer
      await prisma.order.create({ data: { ...order, status: "received" } });
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

    await prisma.order.create({
      data: { ...order, status: "awaiting_payment", razorpayOrderId: razorpayOrder.id },
    });
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

  try {
    const order = await prisma.order.findUnique({ where: { ref: String(input?.ref ?? "") } });
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

    // Only an order still waiting for payment moves on, so a repeated confirmation changes nothing
    await prisma.order.updateMany({
      where: { id: order.id, status: "awaiting_payment" },
      data: {
        status: "deposit_paid",
        razorpayPaymentId: String(input.razorpay_payment_id),
        paidAt: new Date(),
      },
    });
    return { ok: true, ref: order.ref };
  } catch {
    return { ok: false, error: "We could not confirm this payment right now." };
  }
}

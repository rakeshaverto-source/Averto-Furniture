"use server";

import { randomBytes } from "crypto";
import { DEPOSIT_PERCENT, depositFor } from "@/data/store";
import { prisma } from "@/lib/prisma";
import { MAX_CART_LINES, priceCoupon, priceItems, subtotalOf } from "@/lib/pricing";
import { CouponLimitReached, rememberAddress, saveOrder } from "@/lib/orders";
import { createRazorpayOrder, isGenuinePayment, razorpayKeys } from "@/lib/razorpay";
import { getCustomer } from "@/lib/customer-auth";
import type { Coupon } from "@/data/coupons";

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
  // Ordering needs an account; the email always comes from it, never from the form
  const account = await getCustomer();
  if (!account) return { ok: false, error: "Please log in again to place your order." };

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

  const { customer, errors } = validateCustomer({ ...customerInput, email: account.email });
  if (Object.keys(errors).length > 0) {
    return { ok: false, error: "Please check the highlighted details.", fieldErrors: errors };
  }

  const subtotal = subtotalOf(lines);

  // The coupon is checked again here against the database and the rebuilt subtotal
  let discount = 0;
  let couponCode: string | undefined;
  let appliedCoupon: Coupon | undefined;
  if (couponInput) {
    const result = await priceCoupon(String(couponInput), subtotal, account.email);
    if (!result.ok) return { ok: false, error: `Your coupon could not be applied. ${result.error}` };
    discount = result.discount;
    couponCode = result.coupon.code;
    appliedCoupon = result.coupon;
  }
  const total = subtotal - discount;
  const deposit = depositFor(total);
  const ref = `AV-${randomBytes(5).toString("hex").toUpperCase()}`;
  const order = {
    ref,
    userId: account.id,
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

  const keys = razorpayKeys();

  try {
    // Saves typing for next time: remember this address if it isn't saved yet
    // (never blocks the order if it fails)
    await rememberAddress(account.id, customer).catch(() => {});

    if (!keys) {
      // No payment gateway set up yet: keep the order so the team can contact the customer
      await saveOrder({ ...order, status: "received" }, appliedCoupon, account.email);
      return { ok: true, mode: "manual", ref, total, deposit };
    }

    const razorpayOrderId = await createRazorpayOrder(deposit, ref);
    if (!razorpayOrderId) {
      return { ok: false, error: "We could not start the payment. Please try again in a moment." };
    }
    const razorpayOrder = { id: razorpayOrderId };
    const keyId = keys.keyId;

    await saveOrder(
      { ...order, status: "awaiting_payment", razorpayOrderId: razorpayOrder.id },
      appliedCoupon,
      account.email,
    );
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
  } catch (error) {
    if (error instanceof CouponLimitReached) {
      return { ok: false, error: `Your coupon could not be applied. ${error.message}` };
    }
    return { ok: false, error: "We could not place your order right now. Please try again or contact us." };
  }
}

export async function confirmPayment(input: {
  ref: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<ConfirmPaymentResult> {
  if (!razorpayKeys()) return { ok: false, error: "Payments are not configured." };

  try {
    const order = await prisma.order.findUnique({ where: { ref: String(input?.ref ?? "") } });
    if (!order || !order.razorpayOrderId || order.razorpayOrderId !== String(input.razorpay_order_id)) {
      return { ok: false, error: "We could not match this payment to an order." };
    }
    if (order.status === "deposit_paid") return { ok: true, ref: order.ref };

    const valid = isGenuinePayment(
      order.razorpayOrderId,
      String(input.razorpay_payment_id),
      String(input.razorpay_signature),
    );
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

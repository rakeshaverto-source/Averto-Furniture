"use server";

import { randomBytes } from "crypto";
import { GST_PERCENT, depositFor, gstOn, isPaymentMethod, percentFor, type PaymentMethod } from "@/data/store";
import { prisma } from "@/lib/prisma";
import { MAX_CART_LINES, priceCoupon, priceItems, subtotalOf } from "@/lib/pricing";
import { CouponLimitReached, cancelUnpaidAttempts, rememberAddress, saveOrder } from "@/lib/orders";
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
  locality: string;
  landmark: string;
  city: string;
  tehsil: string;
  state: string;
  pincode: string;
  notes: string;
}

export type CreateOrderResult =
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof CheckoutCustomer, string>> }
  | { ok: true; mode: "manual"; ref: string; total: number; deposit: number; paymentMethod: PaymentMethod }
  | {
      ok: true;
      mode: "razorpay";
      ref: string;
      total: number;
      deposit: number;
      paymentMethod: PaymentMethod;
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
    locality: clean(input?.locality, 80),
    landmark: clean(input?.landmark, 80),
    city: clean(input?.city, 60),
    tehsil: clean(input?.tehsil, 60),
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
  paymentInput: PaymentMethod = "advance",
): Promise<CreateOrderResult> {
  if (!isPaymentMethod(paymentInput)) return { ok: false, error: "Please choose how you would like to pay." };
  const paymentMethod = paymentInput;

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
  // GST is added on top of the prices, on the amount after the coupon
  const gst = gstOn(subtotal - discount);
  const total = subtotal - discount + gst;
  // The amount paid online now depends on the payment choice, worked out here, never taken from the browser
  const deposit = depositFor(total, paymentMethod);
  const ref = `AV-${randomBytes(5).toString("hex").toUpperCase()}`;
  const order = {
    ref,
    userId: account.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerEmail: customer.email,
    address: customer.address,
    locality: customer.locality,
    landmark: customer.landmark,
    city: customer.city,
    tehsil: customer.tehsil,
    state: customer.state,
    pincode: customer.pincode,
    notes: customer.notes,
    subtotal,
    couponCode,
    discount,
    gst,
    gstPercent: GST_PERCENT,
    total,
    deposit,
    depositPercent: percentFor(paymentMethod),
    paymentMethod,
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
      await cancelUnpaidAttempts(account.id, ref).catch(() => {});
      return { ok: true, mode: "manual", ref, total, deposit, paymentMethod };
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
    await cancelUnpaidAttempts(account.id, ref).catch(() => {});
    return {
      ok: true,
      mode: "razorpay",
      ref,
      total,
      deposit,
      paymentMethod,
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

    // Only an order still waiting for payment moves on, so a repeated confirmation changes nothing.
    // A payment in full leaves no balance, so it is marked settled at the same time.
    const paidAt = new Date();
    const paidInFull = order.deposit >= order.total;
    await prisma.order.updateMany({
      where: { id: order.id, status: "awaiting_payment" },
      data: {
        status: "deposit_paid",
        razorpayPaymentId: String(input.razorpay_payment_id),
        paidAt,
        ...(paidInFull && { balancePaid: true, balancePaidAt: paidAt }),
        // an attempt cancelled by a newer one can still be paid in another tab: money in means a real order
        ...(order.fulfillment === "cancelled" && { fulfillment: "new" as const }),
      },
    });
    return { ok: true, ref: order.ref };
  } catch {
    return { ok: false, error: "We could not confirm this payment right now." };
  }
}

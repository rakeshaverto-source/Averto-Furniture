"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/data/collections";
import { DEPOSIT_PERCENT } from "@/data/store";
import {
  confirmPayment,
  createOrder,
  type CheckoutCustomer,
  type CreateOrderResult,
} from "@/app/actions/checkout";
import { lookupPincode } from "@/app/actions/pincode";
import { useCart } from "./CartProvider";
import CouponBox from "./CouponBox";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
interface RazorpayInstance {
  open: () => void;
}
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const emptyCustomer: CheckoutCustomer = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  notes: "",
};

const inputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors";

interface Done {
  ref: string;
  paid: boolean;
  deposit: number;
  total: number;
  name: string;
  phone: string;
}

export default function CheckoutClient() {
  const { lines, subtotal, savings, discount, total, coupon, deposit, clear } = useCart();
  const [customer, setCustomer] = useState<CheckoutCustomer>(emptyCustomer);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CheckoutCustomer, string>>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [pinHint, setPinHint] = useState<{ kind: "loading" | "found" | "missing"; text: string } | null>(null);
  const latestPin = useRef("");
  const autoFilled = useRef<{ city: string; state: string } | null>(null);

  const update = (key: keyof CheckoutCustomer) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setCustomer((c) => ({ ...c, [key]: e.target.value }));

  // Typing a full pincode fills in the city and state (still editable afterwards)
  const onPincode = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value.replace(/\D/g, "").slice(0, 6);
    latestPin.current = pin;
    setCustomer((c) => ({ ...c, pincode: pin }));
    if (pin.length < 6) {
      setPinHint(null);
      return;
    }
    setPinHint({ kind: "loading", text: "Looking up your pincode…" });
    const previousAuto = autoFilled.current;
    const result = await lookupPincode(pin);
    if (latestPin.current !== pin) return; // a newer pincode was typed meanwhile
    if (result.ok) {
      autoFilled.current = { city: result.city, state: result.state };
      setCustomer((c) => ({ ...c, city: result.city, state: result.state }));
      setFieldErrors((f) => ({ ...f, city: undefined, state: undefined, pincode: undefined }));
      setPinHint({ kind: "found", text: `Areas for ${pin}: ${result.areas.join(", ")}` });
    } else {
      // Drop what an earlier pincode filled in (but never anything the customer typed themselves)
      setCustomer((c) => ({
        ...c,
        city: previousAuto && c.city === previousAuto.city ? "" : c.city,
        state: previousAuto && c.state === previousAuto.state ? "" : c.state,
      }));
      autoFilled.current = null;
      setPinHint({ kind: "missing", text: result.error });
    }
  };

  const finish = (order: Extract<CreateOrderResult, { ok: true }>, paid: boolean) => {
    setDone({
      ref: order.ref,
      paid,
      deposit: order.deposit,
      total: order.total,
      name: customer.name,
      phone: customer.phone,
    });
    clear();
  };

  const openRazorpay = async (order: Extract<CreateOrderResult, { mode: "razorpay" }>) => {
    if (!(await loadRazorpay()) || !window.Razorpay) {
      setError("We could not load the payment window. Please check your connection and try again.");
      return;
    }
    const checkout = new window.Razorpay({
      key: order.keyId,
      amount: order.amountPaise,
      currency: "INR",
      order_id: order.razorpayOrderId,
      name: "Averto Furniture",
      description: `Advance for order ${order.ref}`,
      prefill: { name: customer.name, email: customer.email, contact: customer.phone },
      theme: { color: "#E08A50" },
      handler: async (response: RazorpayResponse) => {
        const result = await confirmPayment({ ref: order.ref, ...response });
        if (result.ok) finish(order, true);
        else setError(`${result.error} If money was deducted, please contact us with order ${order.ref}.`);
        setBusy(false);
      },
      modal: {
        ondismiss: () => {
          setError("The payment was not completed. You can try again whenever you are ready.");
          setBusy(false);
        },
      },
    });
    checkout.open();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || lines.length === 0) return;
    setBusy(true);
    setError("");
    setFieldErrors({});

    const result = await createOrder(
      lines.map((l) => ({ productId: l.product.id, colorId: l.color?.id, qty: l.qty })),
      customer,
      coupon?.code,
    );

    if (!result.ok) {
      setError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      setBusy(false);
      return;
    }
    if (result.mode === "manual") {
      finish(result, false);
      setBusy(false);
      return;
    }
    await openRazorpay(result); // busy stays on until the payment window reports back
  };

  if (done) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[#A66E38] font-semibold">Order {done.ref}</p>
        <h1 className="mt-4 font-serif text-4xl sm:text-5xl text-[#111110]">Thank you, {done.name.split(" ")[0]}</h1>
        <p className="mt-5 text-stone-700 leading-relaxed">
          {done.paid
            ? `We have received your advance of ${formatPrice(done.deposit)}. Our team will call you on ${done.phone} to confirm the size, finish and delivery of your order.`
            : `We have received your order. Our team will call you on ${done.phone} to confirm the size and finish and to collect the advance of ${formatPrice(done.deposit)}.`}
        </p>
        <p className="mt-2 text-sm text-stone-500">Order total: {formatPrice(done.total)}</p>
        <Link
          href="/collections"
          className="inline-block mt-8 px-8 py-3.5 rounded-xl bg-[#E08A50] hover:bg-[#cf7b43] text-white text-sm font-medium transition-colors"
        >
          Continue browsing
        </Link>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <h1 className="font-serif text-4xl text-[#111110]">Your cart is empty</h1>
        <p className="mt-3 text-stone-600">Add a piece to your cart to check out.</p>
        <Link
          href="/collections"
          className="inline-block mt-8 px-8 py-3.5 rounded-xl bg-[#E08A50] hover:bg-[#cf7b43] text-white text-sm font-medium transition-colors"
        >
          View collections
        </Link>
      </div>
    );
  }

  const field = (key: keyof CheckoutCustomer, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`co-${key}`} className="block text-sm font-medium text-stone-900 mb-2">
        {label}
      </label>
      <input
        id={`co-${key}`}
        value={customer[key]}
        onChange={update(key)}
        className={inputClass}
        aria-invalid={!!fieldErrors[key]}
        {...props}
      />
      {fieldErrors[key] && <p className="mt-1.5 text-xs text-red-700">{fieldErrors[key]}</p>}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
      <form onSubmit={submit} noValidate className="lg:col-span-7 space-y-8">
        <h1 className="font-serif text-4xl sm:text-5xl text-[#111110]">Checkout</h1>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <section className="space-y-5">
          <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-stone-900">Contact</h2>
          {field("name", "Full name", { autoComplete: "name" })}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {field("phone", "Phone", { type: "tel", autoComplete: "tel", inputMode: "tel" })}
            {field("email", "Email", { type: "email", autoComplete: "email" })}
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-stone-900">Delivery address</h2>
          {field("address", "Address", { autoComplete: "street-address" })}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {field("city", "City", { autoComplete: "address-level2" })}
            {field("state", "State", { autoComplete: "address-level1" })}
            <div>
              <label htmlFor="co-pincode" className="block text-sm font-medium text-stone-900 mb-2">
                Pincode
              </label>
              <input
                id="co-pincode"
                value={customer.pincode}
                onChange={onPincode}
                inputMode="numeric"
                maxLength={6}
                autoComplete="postal-code"
                className={inputClass}
                aria-invalid={!!fieldErrors.pincode}
              />
              {fieldErrors.pincode && <p className="mt-1.5 text-xs text-red-700">{fieldErrors.pincode}</p>}
            </div>
          </div>
          {pinHint && (
            <p className={`text-xs ${pinHint.kind === "missing" ? "text-amber-800" : "text-stone-500"}`}>
              {pinHint.text}
            </p>
          )}
        </section>

        <section>
          <label htmlFor="co-notes" className="block text-xs uppercase tracking-[0.2em] font-bold text-stone-900 mb-3">
            Notes <span className="text-stone-400 font-normal normal-case tracking-normal">(size, finish, floor plan)</span>
          </label>
          <textarea
            id="co-notes"
            rows={4}
            maxLength={1000}
            value={customer.notes}
            onChange={update("notes")}
            placeholder="Tell us the size you need or any finish details. We will confirm everything with you before work begins."
            className={`${inputClass} resize-y`}
          />
        </section>

        <button
          type="submit"
          disabled={busy}
          className="w-full sm:w-auto px-10 py-4 rounded-xl bg-[#E08A50] hover:bg-[#cf7b43] disabled:opacity-60 text-white text-sm font-medium cursor-pointer transition-colors"
        >
          {busy ? "Please wait…" : `Pay advance ${formatPrice(deposit)}`}
        </button>
      </form>

      <aside className="lg:col-span-5 lg:sticky lg:top-24 rounded-2xl border border-stone-200 bg-[#FAF8F5] p-6 sm:p-8">
        <h2 className="font-serif text-2xl text-[#111110]">Order summary</h2>
        <ul className="mt-5 divide-y divide-stone-200">
          {lines.map((line) => (
            <li key={line.key} className="py-4 flex gap-4">
              <div className="relative w-16 h-20 shrink-0 rounded-lg overflow-hidden bg-[#ECE8E1]">
                <div className={`absolute inset-0 ${line.product.zoomClass ?? ""}`}>
                  <Image
                    src={line.color?.image ?? line.product.image}
                    alt={line.product.name}
                    fill
                    className="object-cover object-center"
                    sizes="64px"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900">{line.product.name}</p>
                {line.color && <p className="text-xs text-stone-500 mt-0.5">{line.color.name}</p>}
                <p className="text-xs text-stone-500 mt-0.5">Qty {line.qty}</p>
              </div>
              <span className="text-right">
                {line.originalUnit && line.originalUnit > line.unit && (
                  <span className="block text-xs text-stone-400 line-through">
                    {formatPrice(line.originalUnit * line.qty)}
                  </span>
                )}
                <span className="text-sm font-semibold text-stone-950">{formatPrice(line.total)}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-2 pt-4 border-t border-stone-300">
          <CouponBox />
        </div>

        <dl className="mt-4 pt-4 border-t border-stone-300 space-y-2 text-sm">
          {savings > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>You save on original prices</dt>
              <dd>{formatPrice(savings)}</dd>
            </div>
          )}
          {discount > 0 && (
            <>
              <div className="flex justify-between text-stone-600">
                <dt>Subtotal</dt>
                <dd className="text-stone-900">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-emerald-800">
                <dt>Coupon discount</dt>
                <dd>&minus;{formatPrice(discount)}</dd>
              </div>
            </>
          )}
          <div className="flex justify-between text-stone-600">
            <dt>Order total</dt>
            <dd className="text-stone-900">{formatPrice(total)}</dd>
          </div>
          <div className="flex justify-between items-baseline">
            <dt className="font-medium text-stone-900">Advance today ({DEPOSIT_PERCENT}%)</dt>
            <dd className="font-serif text-2xl text-stone-950">{formatPrice(deposit)}</dd>
          </div>
          <div className="flex justify-between text-stone-600">
            <dt>Balance before delivery</dt>
            <dd className="text-stone-900">{formatPrice(total - deposit)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-stone-500 leading-relaxed">
          Every piece is made to order. Our team confirms the size and finish with you before work begins.
        </p>
      </aside>
    </div>
  );
}

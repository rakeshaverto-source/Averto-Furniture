"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/data/collections";
import { PAYMENT_METHODS, depositFor, percentFor, type PaymentMethod } from "@/data/store";
import {
  confirmPayment,
  createOrder,
  type CheckoutCustomer,
  type CreateOrderResult,
} from "@/app/actions/checkout";
import { loadRazorpay, type RazorpayResponse } from "@/lib/razorpay-client";
import { useCart } from "./CartProvider";
import CouponBox from "./CouponBox";
import AddressForm, { type AddressValues } from "@/components/account/AddressForm";
import { addressLines } from "@/lib/address";

const emptyCustomer: CheckoutCustomer = {
  name: "",
  phone: "",
  email: "",
  address: "",
  locality: "",
  landmark: "",
  city: "",
  tehsil: "",
  state: "",
  pincode: "",
  notes: "",
};

const inputClass =
  "w-full rounded-sm border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors";

interface Done {
  ref: string;
  paid: boolean;
  deposit: number;
  total: number;
  paymentMethod: PaymentMethod;
  name: string;
  phone: string;
}

// Filled in from the signed-in account and the customer's last order; the email is the account's
// and can't be changed here
interface SavedAddress {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  locality: string;
  landmark: string;
  city: string;
  tehsil: string;
  state: string;
  pincode: string;
}

export default function CheckoutClient({
  prefill,
  addresses = [],
}: {
  prefill: Partial<CheckoutCustomer> & { email: string };
  addresses?: SavedAddress[];
}) {
  const { lines, subtotal, savings, discount, total, coupon, syncing, clear } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("advance");
  // Shown here only; the server works out the same amount again from its own prices
  const payNow = depositFor(total, paymentMethod);
  const [customer, setCustomer] = useState<CheckoutCustomer>({ ...emptyCustomer, ...prefill, notes: "" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CheckoutCustomer, string>>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  // Saved addresses are picked like cards; a new or edited one is saved first, then selected.
  // With none saved yet, the new-address form is open from the start.
  const [saved, setSaved] = useState<SavedAddress[]>(addresses);
  const [selectedId, setSelectedId] = useState(addresses[0]?.id ?? "");
  const [editing, setEditing] = useState<"new" | string | null>(addresses.length ? null : "new");

  const selectAddress = (a: SavedAddress) => {
    setSelectedId(a.id);
    setCustomer((c) => ({
      ...c,
      name: a.name,
      phone: a.phone,
      address: a.address,
      locality: a.locality,
      landmark: a.landmark,
      city: a.city,
      tehsil: a.tehsil,
      state: a.state,
      pincode: a.pincode,
    }));
    setFieldErrors({});
  };

  const onAddressSaved = (values: AddressValues & { id: string }) => {
    const a: SavedAddress = { ...values, locality: values.locality ?? "", landmark: values.landmark ?? "", tehsil: values.tehsil ?? "" };
    setSaved((list) => (list.some((x) => x.id === a.id) ? list.map((x) => (x.id === a.id ? a : x)) : [...list, a]));
    selectAddress(a);
    setEditing(null);
  };

  const update = (key: keyof CheckoutCustomer) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setCustomer((c) => ({ ...c, [key]: e.target.value }));

  const finish = (order: Extract<CreateOrderResult, { ok: true }>, paid: boolean) => {
    setDone({
      ref: order.ref,
      paid,
      deposit: order.deposit,
      total: order.total,
      paymentMethod: order.paymentMethod,
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
      description:
        order.paymentMethod === "full" ? `Payment for order ${order.ref}` : `Advance for order ${order.ref}`,
      prefill: { name: customer.name, email: customer.email, contact: customer.phone },
      theme: { color: "#1A1A18" },
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
    // wait for the latest cart change to be priced, so the order matches what is on screen
    if (busy || syncing || lines.length === 0) return;
    setBusy(true);
    setError("");
    setFieldErrors({});

    const result = await createOrder(
      lines.map((l) => ({ productId: l.product.id, colorId: l.color?.id, qty: l.qty })),
      customer,
      coupon?.code,
      paymentMethod,
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
          {!done.paid
            ? `We have received your order. Our team will call you on ${done.phone} to confirm the size and finish and to collect the advance of ${formatPrice(done.deposit)}.`
            : `We have received your ${done.paymentMethod === "full" ? "payment" : "advance"} of ${formatPrice(done.deposit)}. Our team will call you on ${done.phone} to confirm the size, finish and delivery of your order.`}
        </p>
        {done.paymentMethod === "cod" && (
          <p className="mt-2 text-sm text-stone-700">
            Please keep {formatPrice(done.total - done.deposit)} ready in cash for the day of delivery.
          </p>
        )}
        <p className="mt-2 text-sm text-stone-500">Order total: {formatPrice(done.total)}</p>
        <Link
          href="/collections"
          className="inline-block mt-8 px-8 py-3.5 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] text-white text-sm font-medium transition-colors"
        >
          Continue browsing
        </Link>
      </div>
    );
  }

  if (lines.length === 0 && syncing) {
    return (
      <p className="text-center py-20 text-stone-500" role="status">
        Loading your cart…
      </p>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <h1 className="font-serif text-4xl text-[#111110]">Your cart is empty</h1>
        <p className="mt-3 text-stone-600">Add a piece to your cart to check out.</p>
        <Link
          href="/collections"
          className="inline-block mt-8 px-8 py-3.5 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] text-white text-sm font-medium transition-colors"
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
        form="checkout-form"
        {...props}
      />
      {fieldErrors[key] && <p className="mt-1.5 text-xs text-red-700">{fieldErrors[key]}</p>}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
      {/* A div, not the form itself, so the address form can sit inside without nesting forms;
          the fields join the order form through form="checkout-form" */}
      <div className="lg:col-span-7 space-y-8">
        <form id="checkout-form" onSubmit={submit} noValidate hidden />
        <h1 className="font-serif text-4xl sm:text-5xl text-[#111110]">Checkout</h1>

        {error && (
          <p role="alert" className="rounded-sm bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <section className="space-y-5">
          <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-stone-900">Contact</h2>
          {field("name", "Full name", { autoComplete: "name" })}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {field("phone", "Phone", { type: "tel", autoComplete: "tel", inputMode: "tel" })}
            {field("email", "Email (your account)", {
              type: "email",
              readOnly: true,
              className: `${inputClass} bg-stone-50 text-stone-600`,
            })}
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-stone-900">Delivery address</h2>
          {saved.length === 0 ? (
            <div className="space-y-3">
              <AddressForm
                address={{
                  label: "Home",
                  name: customer.name,
                  phone: customer.phone,
                  address: customer.address,
                  locality: customer.locality,
                  landmark: customer.landmark,
                  city: customer.city,
                  tehsil: customer.tehsil,
                  state: customer.state,
                  pincode: customer.pincode,
                }}
                onSaved={onAddressSaved}
                submitLabel="Save and deliver here"
              />
              <p className="text-xs text-stone-500">This address is saved to your account for next time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {saved.map((a) =>
                editing === a.id ? (
                  <div key={a.id} className="rounded-sm border border-stone-900 p-4 sm:p-5">
                    <p className="text-sm font-medium text-stone-900 mb-4">Edit address</p>
                    <AddressForm
                      address={a}
                      onSaved={onAddressSaved}
                      onCancel={() => setEditing(null)}
                      submitLabel="Save and deliver here"
                    />
                  </div>
                ) : (
                  <label
                    key={a.id}
                    className={`flex items-start gap-3 rounded-sm border px-4 py-4 cursor-pointer transition-colors ${
                      selectedId === a.id ? "border-stone-900 bg-[#FAF8F5]" : "border-stone-300 hover:border-stone-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="savedAddress"
                      checked={selectedId === a.id}
                      onChange={() => selectAddress(a)}
                      className="mt-1 w-4 h-4 accent-[#1A1A18]"
                    />
                    <span className="flex-1 min-w-0 text-sm">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-stone-900">{a.name}</span>
                        {a.label && (
                          <span className="rounded-sm bg-stone-200 px-2 py-0.5 text-[11px] uppercase tracking-wide text-stone-700">
                            {a.label}
                          </span>
                        )}
                        <span className="text-stone-600">{a.phone}</span>
                      </span>
                      <span className="block mt-1 text-stone-600 leading-relaxed">{addressLines(a).join(", ")}</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setEditing(a.id);
                      }}
                      className="shrink-0 text-sm text-stone-900 underline underline-offset-4 cursor-pointer"
                    >
                      Edit
                    </button>
                  </label>
                ),
              )}

              {editing === "new" ? (
                <div className="rounded-sm border border-stone-900 p-4 sm:p-5">
                  <p className="text-sm font-medium text-stone-900 mb-4">Add a new address</p>
                  <AddressForm
                    address={{ label: "", name: customer.name, phone: customer.phone, address: "", city: "", state: "", pincode: "" }}
                    onSaved={onAddressSaved}
                    onCancel={() => setEditing(null)}
                    submitLabel="Save and deliver here"
                  />
                </div>
              ) : (
                saved.length < 10 && (
                  <button
                    type="button"
                    onClick={() => setEditing("new")}
                    className="w-full rounded-sm border border-dashed border-stone-400 px-4 py-3.5 text-sm font-medium text-stone-900 hover:border-stone-900 cursor-pointer transition-colors"
                  >
                    + Add a new address
                  </button>
                )
              )}
              {editing !== null && (
                <p className="text-xs text-stone-500">Save or cancel the address above to continue to payment.</p>
              )}
            </div>
          )}
          {saved.length > 0 && (fieldErrors.address || fieldErrors.city || fieldErrors.state || fieldErrors.pincode) && (
            <p className="text-xs text-red-700">
              {fieldErrors.address ?? fieldErrors.city ?? fieldErrors.state ?? fieldErrors.pincode} Please edit the selected
              address.
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

        <fieldset className="space-y-3">
          <legend className="text-xs uppercase tracking-[0.2em] font-bold text-stone-900 mb-4">Payment</legend>
          {PAYMENT_METHODS.map((m) => (
            <label
              key={m.id}
              className={`flex items-start gap-3 rounded-sm border px-4 py-3.5 cursor-pointer transition-colors ${
                paymentMethod === m.id ? "border-stone-900 bg-[#FAF8F5]" : "border-stone-300 hover:border-stone-500"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={m.id}
                checked={paymentMethod === m.id}
                onChange={() => setPaymentMethod(m.id)}
                className="mt-1 w-4 h-4 accent-[#1A1A18]"
              />
              <span className="flex-1">
                <span className="flex justify-between gap-3 text-sm font-medium text-stone-900">
                  <span>{m.label}</span>
                  <span className="shrink-0">{formatPrice(depositFor(total, m.id))} now</span>
                </span>
                <span className="block mt-1 text-xs text-stone-500 leading-relaxed">{m.note}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          form="checkout-form"
          disabled={busy || syncing || editing !== null}
          className="w-full sm:w-auto px-10 py-4 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] disabled:opacity-60 text-white text-sm font-medium cursor-pointer transition-colors"
        >
          {busy
            ? "Please wait…"
            : `${paymentMethod === "full" ? "Pay" : "Pay advance"} ${formatPrice(payNow)}`}
        </button>
      </div>

      <aside className="lg:col-span-5 lg:sticky lg:top-24 rounded-sm border border-stone-200 bg-[#FAF8F5] p-6 sm:p-8">
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
            <dt className="font-medium text-stone-900">
              {paymentMethod === "full" ? "To pay today" : `Advance today (${percentFor(paymentMethod)}%)`}
            </dt>
            <dd className="font-serif text-2xl text-stone-950">{formatPrice(payNow)}</dd>
          </div>
          {paymentMethod !== "full" && (
            <div className="flex justify-between text-stone-600">
              <dt>{paymentMethod === "cod" ? "Cash on delivery" : "Balance before delivery"}</dt>
              <dd className="text-stone-900">{formatPrice(total - payNow)}</dd>
            </div>
          )}
        </dl>
        <p className="mt-4 text-xs text-stone-500 leading-relaxed">
          Every piece is made to order. Our team confirms the size and finish with you before work begins.
        </p>
      </aside>
    </div>
  );
}

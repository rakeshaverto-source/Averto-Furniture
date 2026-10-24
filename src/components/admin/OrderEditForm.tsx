"use client";

import { startTransition, useActionState, useState } from "react";
import { updateOrderDetails, type FormState } from "@/app/admin/store-actions";
import { formatPrice } from "@/data/collections";
import { gstOn } from "@/data/store";
import { inputClass, labelClass, primaryButton } from "./ui";

interface EditItem {
  id: string;
  name: string;
  colorName: string | null;
  qty: number;
  unitPrice: number;
}

// Totals update as you type; the server works them out again when saving
export default function OrderEditForm({
  order,
}: {
  order: {
    id: string;
    customerName: string;
    customerPhone: string;
    address: string;
    locality: string;
    landmark: string;
    city: string;
    tehsil: string;
    state: string;
    pincode: string;
    discount: number;
    gstPercent: number; // 0 for orders placed before GST was added
    depositPercent: number;
    advancePaid: boolean;
    deposit: number;
    items: EditItem[];
  };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateOrderDetails, {});
  const [lines, setLines] = useState(order.items.map((i) => ({ id: i.id, qty: i.qty, unitPrice: i.unitPrice })));
  const [discount, setDiscount] = useState(order.discount);

  const setLine = (id: string, key: "qty" | "unitPrice", value: string) =>
    setLines((list) => list.map((l) => (l.id === id ? { ...l, [key]: Math.max(0, Math.floor(Number(value) || 0)) } : l)));

  const subtotal = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
  const gst = gstOn(Math.max(0, subtotal - discount), order.gstPercent);
  const total = Math.max(0, subtotal - discount) + gst;
  const deposit = order.advancePaid ? order.deposit : Math.round((total * order.depositPercent) / 100);

  const field = (name: keyof typeof order, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`e-${name}`} className={labelClass}>
        {label}
      </label>
      <input id={`e-${name}`} name={name} defaultValue={String(order[name])} className={inputClass} {...props} />
    </div>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="space-y-6 text-sm"
    >
      <input type="hidden" name="id" value={order.id} />

      <fieldset className="grid sm:grid-cols-2 gap-4">
        <legend className="text-xs uppercase tracking-wider text-stone-500 mb-3">Customer</legend>
        {field("customerName", "Name", { maxLength: 80 })}
        {field("customerPhone", "Phone", { type: "tel", maxLength: 20 })}
        <div className="sm:col-span-2">{field("address", "House no., building, street", { maxLength: 240 })}</div>
        {field("locality", "Locality / area", { maxLength: 80 })}
        {field("landmark", "Landmark", { maxLength: 80 })}
        {field("city", "City / district", { maxLength: 60 })}
        {field("tehsil", "Tehsil", { maxLength: 60 })}
        {field("state", "State", { maxLength: 60 })}
        {field("pincode", "Pincode", { inputMode: "numeric", maxLength: 6 })}
      </fieldset>

      <fieldset>
        <legend className="text-xs uppercase tracking-wider text-stone-500 mb-3">
          Items <span className="normal-case tracking-normal">(set quantity to 0 to remove)</span>
        </legend>
        <ul className="divide-y divide-stone-100 border-y border-stone-100">
          {order.items.map((item) => {
            const line = lines.find((l) => l.id === item.id)!;
            return (
              <li key={item.id} className={`py-3 grid grid-cols-[1fr_4.5rem_7rem] gap-3 items-center ${line.qty === 0 ? "opacity-50" : ""}`}>
                <span className="text-stone-900">
                  {item.name}
                  {item.colorName && <span className="block text-xs text-stone-500">{item.colorName}</span>}
                  {line.qty === 0 && <span className="block text-xs text-red-700">Will be removed</span>}
                </span>
                <label className="block">
                  <span className="sr-only">Quantity of {item.name}</span>
                  <input
                    type="number"
                    name={`qty_${item.id}`}
                    min={0}
                    max={99}
                    value={line.qty}
                    onChange={(e) => setLine(item.id, "qty", e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="sr-only">Price each of {item.name}</span>
                  <input
                    type="number"
                    name={`price_${item.id}`}
                    min={0}
                    value={line.unitPrice}
                    onChange={(e) => setLine(item.id, "unitPrice", e.target.value)}
                    className={inputClass}
                  />
                </label>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-stone-500">Quantity · price each (₹)</p>
      </fieldset>

      <div className="grid sm:grid-cols-2 gap-4 items-end">
        <div>
          <label htmlFor="e-discount" className={labelClass}>
            Discount (₹)
          </label>
          <input
            id="e-discount"
            name="discount"
            type="number"
            min={0}
            value={discount}
            onChange={(e) => setDiscount(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
            className={inputClass}
          />
        </div>
        <dl className="space-y-1 text-stone-600">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
          </div>
          {order.gstPercent > 0 && (
            <div className="flex justify-between">
              <dt>GST ({order.gstPercent}%)</dt>
              <dd className="tabular-nums">{formatPrice(gst)}</dd>
            </div>
          )}
          <div className="flex justify-between font-semibold text-stone-900">
            <dt>New total</dt>
            <dd className="tabular-nums">{formatPrice(total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{order.advancePaid ? "Advance (already paid)" : `Advance (${order.depositPercent}%)`}</dt>
            <dd className="tabular-nums">{formatPrice(deposit)}</dd>
          </div>
        </dl>
      </div>
      {discount > subtotal && <p className="text-xs text-red-700">The discount is more than the subtotal.</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : "Save changes"}
        </button>
        <p role="status" className={`text-sm ${state.error ? "text-red-700" : "text-emerald-800"}`}>
          {!pending && (state.error ?? state.ok)}
        </p>
      </div>
    </form>
  );
}

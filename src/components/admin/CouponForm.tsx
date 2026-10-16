"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { saveCoupon, type FormState } from "@/app/admin/store-actions";
import { inputClass, labelClass, primaryButton } from "./ui";

export interface CouponValues {
  code: string;
  description: string;
  type: "percent" | "flat";
  value: number;
  minOrder: number | null;
  maxDiscount: number | null;
  expiresAt: string; // yyyy-mm-dd in India time, or ""
  isActive: boolean;
  allowedEmails: string[];
  maxUses: number | null;
  maxUsesPerCustomer: number | null;
}

export default function CouponForm({ coupon }: { coupon?: CouponValues }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCoupon, {});
  const [type, setType] = useState(coupon?.type ?? "percent");
  const formRef = useRef<HTMLFormElement>(null);

  // A new coupon was created: empty the form for the next one
  useEffect(() => {
    if (state.ok && !coupon) formRef.current?.reset();
  }, [state, coupon]);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="grid sm:grid-cols-2 gap-4"
    >
      {coupon && <input type="hidden" name="existingCode" value={coupon.code} />}
      <div>
        <label className={labelClass}>
          Code
          <input
            name="code"
            defaultValue={coupon?.code}
            readOnly={!!coupon}
            required
            maxLength={20}
            placeholder="e.g. DIWALI10"
            className={`${inputClass} mt-1.5 uppercase read-only:bg-stone-50 read-only:text-stone-500`}
          />
        </label>
      </div>
      <div>
        <label className={labelClass}>
          What customers see
          <input
            name="description"
            defaultValue={coupon?.description}
            required
            maxLength={120}
            placeholder="e.g. 10% off your order"
            className={`${inputClass} mt-1.5`}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Type
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as "percent" | "flat")}
            className={`${inputClass} mt-1.5`}
          >
            <option value="percent">% off</option>
            <option value="flat">₹ off</option>
          </select>
        </label>
        <label className={labelClass}>
          {type === "percent" ? "Percent" : "Rupees off"}
          <input
            name="value"
            type="number"
            min={1}
            max={type === "percent" ? 90 : undefined}
            step={1}
            defaultValue={coupon?.value}
            required
            className={`${inputClass} mt-1.5`}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Min. order ₹ <span className="font-normal text-stone-400">(opt.)</span>
          <input name="minOrder" type="number" min={1} step={1} defaultValue={coupon?.minOrder ?? ""} className={`${inputClass} mt-1.5`} />
        </label>
        {type === "percent" ? (
          <label className={labelClass}>
            Max discount ₹ <span className="font-normal text-stone-400">(opt.)</span>
            <input
              name="maxDiscount"
              type="number"
              min={1}
              step={1}
              defaultValue={coupon?.maxDiscount ?? ""}
              className={`${inputClass} mt-1.5`}
            />
          </label>
        ) : (
          <span />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:col-span-2">
        <label className={labelClass}>
          Uses per customer <span className="font-normal text-stone-400">(opt.)</span>
          <input
            name="maxUsesPerCustomer"
            type="number"
            min={1}
            step={1}
            defaultValue={coupon?.maxUsesPerCustomer ?? ""}
            placeholder="e.g. 1 = once each"
            className={`${inputClass} mt-1.5`}
          />
        </label>
        <label className={labelClass}>
          Total uses <span className="font-normal text-stone-400">(opt.)</span>
          <input
            name="maxUses"
            type="number"
            min={1}
            step={1}
            defaultValue={coupon?.maxUses ?? ""}
            placeholder="e.g. first 100 orders"
            className={`${inputClass} mt-1.5`}
          />
        </label>
        <span className="col-span-2 -mt-1 text-xs text-stone-500">
          Counted per customer account email. Cancelled orders give the use back. Leave empty for no limit.
        </span>
      </div>
      <label className={`${labelClass} sm:col-span-2`}>
        Only for these customers <span className="font-normal text-stone-400">(optional)</span>
        <textarea
          name="allowedEmails"
          defaultValue={coupon?.allowedEmails.join("\n")}
          rows={2}
          placeholder={"rahul@gmail.com\npriya@example.com"}
          className={`${inputClass} mt-1.5 font-mono text-xs`}
        />
        <span className="mt-1 block text-xs font-normal text-stone-500">
          One email per line (or separated by commas). Only checkouts with one of these emails get the discount. Leave
          empty so anyone with the code can use it.
        </span>
      </label>
      <label className={labelClass}>
        Last day <span className="font-normal text-stone-400">(optional)</span>
        <input name="expiresAt" type="date" defaultValue={coupon?.expiresAt} className={`${inputClass} mt-1.5`} />
      </label>
      <label className="flex items-center gap-3 cursor-pointer self-end pb-2.5">
        <input type="checkbox" name="isActive" defaultChecked={coupon?.isActive ?? true} className="w-4 h-4 accent-[#E08A50]" />
        <span className="text-sm text-stone-900">Active</span>
      </label>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : coupon ? "Save" : "Create coupon"}
        </button>
        <p role="status" className={`text-sm ${state.error ? "text-red-700" : "text-emerald-800"}`}>
          {!pending && (state.error ?? state.ok)}
        </p>
      </div>
    </form>
  );
}

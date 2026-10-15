"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";
import { useCart } from "./CartProvider";

// Coupon entry used in the cart drawer and on the checkout page
export default function CouponBox() {
  const { coupon, couponNotice, applyCoupon, removeCoupon } = useCart();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = applyCoupon(code);
    if (result.ok) {
      setCode("");
      setError("");
      setOpen(false);
    } else {
      setError(result.error);
    }
  };

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Tag className="w-4 h-4 text-emerald-700 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-900">{coupon.code}</p>
            <p className="text-xs text-emerald-800 truncate">{coupon.description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={removeCoupon}
          aria-label={`Remove coupon ${coupon.code}`}
          className="text-emerald-800 hover:text-emerald-950 cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      {couponNotice && (
        <p role="status" className="mb-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-900">
          {couponNotice}
        </p>
      )}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 text-sm text-stone-700 hover:text-stone-950 underline underline-offset-4 cursor-pointer"
        >
          <Tag className="w-4 h-4" />
          Have a coupon code?
        </button>
      ) : (
        <form onSubmit={submit} noValidate>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              aria-label="Coupon code"
              aria-invalid={!!error}
              placeholder="Enter coupon code"
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={30}
              autoFocus
              className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm uppercase placeholder:normal-case placeholder:text-stone-400 focus:outline-none focus:border-stone-900"
            />
            <button
              type="submit"
              className="shrink-0 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium cursor-pointer transition-colors"
            >
              Apply
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
        </form>
      )}
    </div>
  );
}

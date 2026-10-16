"use client";

import { startTransition, useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitAccountReview, type FormResult } from "@/app/actions/account-data";

const inputClass =
  "w-full rounded-sm border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors";

// "Write a review" for a delivered piece; opens in place under the order line
export default function AccountReviewForm({ productId, productName }: { productId: string; productName: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, action, pending] = useActionState<FormResult, FormData>(submitAccountReview, {});
  const errors = state.fieldErrors ?? {};

  if (state.ok) return <p className="mt-2 text-sm text-emerald-800">{state.ok}</p>;
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#a85a26] hover:text-[#8a4a1f] cursor-pointer"
      >
        <Star className="w-4 h-4" /> Write a review
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="mt-3 space-y-3 rounded-sm bg-stone-50 p-4"
    >
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating || ""} />
      <fieldset>
        <legend className="text-sm font-medium text-stone-900">Your rating for {productName}</legend>
        <div className="mt-1.5 flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              aria-pressed={rating === n}
              className="cursor-pointer text-[#E08A50]"
            >
              <Star className={`w-7 h-7 ${n <= (hover || rating) ? "fill-current" : "text-stone-300"}`} />
            </button>
          ))}
        </div>
        {errors.rating && <p className="mt-1 text-xs text-red-700">{errors.rating}</p>}
      </fieldset>
      <div>
        <input name="title" placeholder="Title, e.g. Beautiful finish" maxLength={80} aria-label="Review title" className={inputClass} />
        {errors.title && <p className="mt-1 text-xs text-red-700">{errors.title}</p>}
      </div>
      <div>
        <textarea name="text" rows={4} maxLength={1000} placeholder="How is it in your home?" aria-label="Your review" className={inputClass} />
        {errors.text && <p className="mt-1 text-xs text-red-700">{errors.text}</p>}
      </div>
      <input name="location" placeholder="Your city (optional)" maxLength={60} aria-label="Your city" className={inputClass} />
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 rounded-sm bg-[#111110] hover:bg-stone-800 disabled:opacity-60 text-white text-sm font-medium cursor-pointer"
        >
          {pending ? "Sending…" : "Submit review"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 text-sm text-stone-600 cursor-pointer">
          Cancel
        </button>
      </div>
    </form>
  );
}

"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { addOfflineReview, type FormState } from "@/app/admin/store-actions";
import { inputClass, labelClass, primaryButton } from "./ui";

// Adds a review from a customer who bought in person; it goes straight on the shop
export default function OfflineReviewForm({ products }: { products: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addOfflineReview, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Saved: empty the form for the next one
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

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
      <label className={labelClass}>
        Product they bought
        <select name="productId" required defaultValue="" className={`${inputClass} mt-1.5`}>
          <option value="" disabled>
            Choose…
          </option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Rating
        <select name="rating" required defaultValue="5" className={`${inputClass} mt-1.5`}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {"★".repeat(n)} ({n})
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Customer name
        <input name="name" required maxLength={60} placeholder="e.g. Gurpreet S." className={`${inputClass} mt-1.5`} />
      </label>
      <label className={labelClass}>
        City
        <input name="location" required maxLength={60} placeholder="e.g. Ludhiana" className={`${inputClass} mt-1.5`} />
      </label>
      <label className={`${labelClass} sm:col-span-2`}>
        Title
        <input name="title" required maxLength={100} placeholder="e.g. Solid and beautifully finished" className={`${inputClass} mt-1.5`} />
      </label>
      <label className={`${labelClass} sm:col-span-2`}>
        What they said
        <textarea name="text" required minLength={10} maxLength={1500} rows={3} className={`${inputClass} mt-1.5`} />
      </label>
      <label className={labelClass}>
        When <span className="font-normal text-stone-400">(optional)</span>
        <input name="date" type="date" className={`${inputClass} mt-1.5`} />
        <span className="mt-1 block text-xs font-normal text-stone-500">When they bought or gave the review. Empty means today.</span>
      </label>
      <label className="sm:col-span-2 flex items-start gap-2.5 text-sm text-stone-900 cursor-pointer">
        <input type="checkbox" name="genuine" required className="mt-0.5 h-4 w-4 accent-[#1A1A18] cursor-pointer" />
        <span>
          This is a real customer who bought from us, and they agreed to us sharing their review.
          <span className="block text-xs text-stone-500">Shown on the product page and in the reviews popup, marked &ldquo;Bought in store&rdquo;.</span>
        </span>
      </label>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : "Add review"}
        </button>
        <p role="status" className={`text-sm ${state.error ? "text-red-700" : "text-emerald-800"}`}>
          {!pending && (state.error ?? state.ok)}
        </p>
      </div>
    </form>
  );
}

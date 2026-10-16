"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { saveCategory, type FormState } from "@/app/admin/store-actions";
import { inputClass, labelClass, primaryButton } from "./ui";

export default function CategoryForm({
  category,
}: {
  category?: { id: string; name: string; blurb: string; sortOrder: number };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCategory, {});
  const formRef = useRef<HTMLFormElement>(null);

  // A new category was added: empty the form for the next one
  useEffect(() => {
    if (state.ok && !category) formRef.current?.reset();
  }, [state, category]);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="grid sm:grid-cols-[1fr_2fr_6rem] gap-3 items-end"
    >
      {category && <input type="hidden" name="existingId" value={category.id} />}
      <label className={labelClass}>
        Name
        <input name="name" defaultValue={category?.name} required maxLength={40} placeholder="e.g. Outdoor" className={`${inputClass} mt-1.5`} />
      </label>
      <label className={labelClass}>
        Short description
        <input
          name="blurb"
          defaultValue={category?.blurb}
          maxLength={160}
          placeholder="Shown on the collections page"
          className={`${inputClass} mt-1.5`}
        />
      </label>
      <label className={labelClass}>
        Position
        <input name="sortOrder" type="number" step={1} defaultValue={category?.sortOrder ?? 0} className={`${inputClass} mt-1.5`} />
      </label>
      <div className="sm:col-span-3 flex items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : category ? "Save" : "Add category"}
        </button>
        <p role="status" className={`text-sm ${state.error ? "text-red-700" : "text-emerald-800"}`}>
          {!pending && (state.error ?? state.ok)}
        </p>
      </div>
    </form>
  );
}

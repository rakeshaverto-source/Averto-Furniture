"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { saveCategory, type FormState } from "@/app/admin/store-actions";
import ImageUpload from "./ImageUpload";
import { inputClass, labelClass, primaryButton } from "./ui";

export default function CategoryForm({
  category,
}: {
  category?: {
    id: string;
    name: string;
    blurb: string;
    sortOrder: number;
    onHomePage: boolean;
    image?: { path: string; url: string };
  };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCategory, {});
  const formRef = useRef<HTMLFormElement>(null);
  // Bumped after adding a category, so the photo picker starts empty for the next one
  const [round, setRound] = useState(0);

  // A new category was added: empty the form for the next one
  useEffect(() => {
    if (state.ok && !category) {
      formRef.current?.reset();
      setRound((r) => r + 1); // eslint-disable-line react-hooks/set-state-in-effect -- reset after a save
    }
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
      <div className="sm:col-span-3 grid sm:grid-cols-[2fr_1fr] gap-4 items-start">
        <ImageUpload
          key={round}
          name="image"
          folder="categories"
          initial={category?.image}
          label="Photo for the home page"
          help="Shown in a rounded square under “Shop By Category”. A clear photo of one piece works best, ideally square."
        />
        <label className="flex items-start gap-2.5 text-sm text-stone-900 cursor-pointer sm:mt-7">
          <input
            type="checkbox"
            name="onHomePage"
            defaultChecked={category?.onHomePage ?? true}
            className="mt-0.5 h-4 w-4 accent-[#1A1A18] cursor-pointer"
          />
          <span>
            Show on the home page
            <span className="block text-xs text-stone-500">Needs a photo to appear.</span>
          </span>
        </label>
      </div>
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

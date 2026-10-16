"use client";

import { startTransition, useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveProduct, type ProductFormState } from "@/app/admin/actions";
import { formatPrice } from "@/data/collections";
import { slugify } from "@/lib/slug";
import { inputClass, labelClass, primaryButton, secondaryButton } from "./ui";

export interface ProductFormValues {
  id: string;
  name: string;
  categoryId: string;
  badge: string;
  description: string;
  specs: string;
  priceInr: number;
  originalPriceInr: number | null;
  sortOrder: number;
  isActive: boolean;
  colors: { id?: string; name: string; hex: string; priceDelta: number }[];
}

interface ColorRow {
  key: number;
  id?: string;
  name: string;
  hex: string;
  priceDelta: string;
}

let nextKey = 0;

export default function ProductForm({
  categories,
  product,
}: {
  categories: { id: string; name: string }[];
  product?: ProductFormValues; // missing when adding a new product
}) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProduct, {});
  const errors = state.fieldErrors ?? {};

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [price, setPrice] = useState(product ? String(product.priceInr) : "");
  const [colors, setColors] = useState<ColorRow[]>(() =>
    (product?.colors ?? []).map((c) => ({ ...c, key: nextKey++, priceDelta: String(c.priceDelta) })),
  );

  const shownSlug = product ? product.id : slugEdited ? slug : slugify(name);
  const updateColor = (key: number, patch: Partial<ColorRow>) =>
    setColors((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const colorsJson = JSON.stringify(
    colors.map((c) => ({ id: c.id, name: c.name, hex: c.hex, priceDelta: Number(c.priceDelta || 0) })),
  );

  const fieldError = (key: string) =>
    errors[key] ? <p className="mt-1.5 text-xs text-red-700">{errors[key]}</p> : null;

  return (
    <form
      // Submitting through onSubmit instead of action={} stops React from clearing the fields
      // afterwards, so nothing typed is lost when a field needs fixing
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="space-y-8"
    >
      {product && <input type="hidden" name="existingId" value={product.id} />}
      <input type="hidden" name="colors" value={colorsJson} />

      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 space-y-5">
        <h2 className="font-medium text-stone-900">Details</h2>
        <div>
          <label htmlFor="p-name" className={labelClass}>
            Name
          </label>
          <input
            id="p-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
            className={inputClass}
          />
          {fieldError("name")}
        </div>

        <div>
          <label htmlFor="p-slug" className={labelClass}>
            Web address
          </label>
          <div className="flex items-center rounded-xl border border-stone-300 bg-stone-50 text-sm overflow-hidden focus-within:border-stone-900">
            <span className="pl-4 pr-1 text-stone-500 whitespace-nowrap">/products/</span>
            <input
              id="p-slug"
              name="slug"
              value={shownSlug}
              readOnly={!!product}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(e.target.value);
              }}
              className="min-w-0 flex-1 bg-transparent py-2.5 pr-4 text-stone-900 focus:outline-none read-only:text-stone-500"
            />
          </div>
          <p className="mt-1.5 text-xs text-stone-500">
            {product
              ? "Fixed once a product is created, so shared links and saved carts keep working."
              : "Filled in from the name. It can't be changed after saving."}
          </p>
          {fieldError("slug")}
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="p-category" className={labelClass}>
              Category
            </label>
            <select
              id="p-category"
              name="categoryId"
              defaultValue={product?.categoryId ?? ""}
              required
              className={inputClass}
            >
              <option value="" disabled>
                Choose…
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {fieldError("categoryId")}
          </div>
          <div>
            <label htmlFor="p-badge" className={labelClass}>
              Badge <span className="font-normal text-stone-400">(optional, e.g. New Arrival)</span>
            </label>
            <input id="p-badge" name="badge" defaultValue={product?.badge} maxLength={40} className={inputClass} />
            {fieldError("badge")}
          </div>
        </div>

        <div>
          <label htmlFor="p-description" className={labelClass}>
            Description
          </label>
          <textarea
            id="p-description"
            name="description"
            defaultValue={product?.description}
            required
            rows={5}
            maxLength={3000}
            className={inputClass}
          />
          {fieldError("description")}
        </div>

        <div>
          <label htmlFor="p-specs" className={labelClass}>
            Specs line <span className="font-normal text-stone-400">(e.g. 20mm Flame Slate · Fluted Oak)</span>
          </label>
          <input id="p-specs" name="specs" defaultValue={product?.specs} maxLength={200} className={inputClass} />
          {fieldError("specs")}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 space-y-5">
        <h2 className="font-medium text-stone-900">Price</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="p-price" className={labelClass}>
              Price (₹)
            </label>
            <input
              id="p-price"
              name="priceInr"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className={inputClass}
            />
            {Number(price) > 0 && <p className="mt-1.5 text-xs text-stone-500">{formatPrice(Number(price))}</p>}
            {fieldError("priceInr")}
          </div>
          <div>
            <label htmlFor="p-original" className={labelClass}>
              Original price (₹) <span className="font-normal text-stone-400">(optional, shown crossed out)</span>
            </label>
            <input
              id="p-original"
              name="originalPriceInr"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              defaultValue={product?.originalPriceInr ?? ""}
              className={inputClass}
            />
            {fieldError("originalPriceInr")}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-medium text-stone-900">Colours / finishes</h2>
            <p className="mt-0.5 text-xs text-stone-500">The first one is the default. Leave empty if there is only one finish.</p>
          </div>
          <button
            type="button"
            onClick={() => setColors((rows) => [...rows, { key: nextKey++, name: "", hex: "#C9A36A", priceDelta: "0" }])}
            className={secondaryButton}
          >
            <Plus className="w-4 h-4" /> Add colour
          </button>
        </div>

        {colors.length > 0 && (
          <div className="mt-5 space-y-3">
            {colors.map((c, i) => (
              <div key={c.key} className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_8rem_9rem_auto] items-end gap-3">
                <input
                  type="color"
                  value={/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : "#000000"}
                  onChange={(e) => updateColor(c.key, { hex: e.target.value.toUpperCase() })}
                  aria-label={`Colour ${i + 1} swatch`}
                  className="h-10 w-12 rounded-lg border border-stone-300 bg-white p-1 cursor-pointer"
                />
                <div>
                  {i === 0 && <span className="block text-xs text-stone-500 mb-1">Name</span>}
                  <input
                    value={c.name}
                    onChange={(e) => updateColor(c.key, { name: e.target.value })}
                    placeholder="e.g. Smoked Oak"
                    aria-label={`Colour ${i + 1} name`}
                    maxLength={40}
                    className={inputClass}
                  />
                </div>
                <div className="hidden sm:block">
                  {i === 0 && <span className="block text-xs text-stone-500 mb-1">Code</span>}
                  <input
                    value={c.hex}
                    onChange={(e) => updateColor(c.key, { hex: e.target.value })}
                    aria-label={`Colour ${i + 1} code`}
                    maxLength={7}
                    className={`${inputClass} font-mono uppercase`}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 row-start-2 sm:row-start-auto">
                  {i === 0 && <span className="hidden sm:block text-xs text-stone-500 mb-1">Extra price (₹)</span>}
                  <input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={c.priceDelta}
                    onChange={(e) => updateColor(c.key, { priceDelta: e.target.value })}
                    aria-label={`Colour ${i + 1} extra price in rupees`}
                    placeholder="Extra ₹"
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setColors((rows) => rows.filter((r) => r.key !== c.key))}
                  aria-label={`Remove colour ${c.name || i + 1}`}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-lg text-stone-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        {fieldError("colors")}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 grid sm:grid-cols-2 gap-5 items-end">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={product?.isActive ?? true}
            className="w-4 h-4 accent-[#E08A50]"
          />
          <span className="text-sm text-stone-900">
            Show on the shop
            <span className="block text-xs text-stone-500">A product appears only once it has at least one photo.</span>
          </span>
        </label>
        <div>
          <label htmlFor="p-sort" className={labelClass}>
            Position <span className="font-normal text-stone-400">(lower comes first)</span>
          </label>
          <input
            id="p-sort"
            name="sortOrder"
            type="number"
            step={1}
            defaultValue={product?.sortOrder ?? 0}
            className={inputClass}
          />
          {fieldError("sortOrder")}
        </div>
      </section>

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}

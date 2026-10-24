"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { saveProduct, type ProductFormState } from "@/app/admin/actions";
import { discountPercent, formatPrice } from "@/data/collections";
import { slugify } from "@/lib/slug";
import { GST_PERCENT } from "@/data/store";
import { DELIVERY_PRESETS, MAX_DELIVERY_DAYS, estimatedDeliveryRange, leadTimeLabel } from "@/data/delivery";
import { inputClass, labelClass, primaryButton } from "./ui";
import Step from "./Step";

export interface ProductFormValues {
  id: string;
  name: string;
  categoryId: string;
  badge: string;
  description: string;
  specs: string;
  priceInr: number;
  originalPriceInr: number | null;
  deliveryMinDays: number | null;
  deliveryMaxDays: number | null;
  sortOrder: number;
  isActive: boolean;
  onHomePage: boolean;
  colors: { id?: string; name: string; hex: string; priceDelta: number }[];
}

interface ColorRow {
  key: number;
  id?: string;
  name: string;
  hex: string;
  priceDelta: string;
}

// One click adds a common finish; the name and colour can still be changed
const QUICK_COLOURS: [string, string][] = [
  ["Natural Oak", "#C9A36A"],
  ["Walnut", "#5C4033"],
  ["Teak", "#9C6B3C"],
  ["White", "#F2EFEA"],
  ["Black", "#1E1E1E"],
  ["Grey", "#8A8A86"],
];
const BADGES = ["New Arrival", "Bestseller", "Limited Edition", "Handmade"];
const FORM_ID = "product-form";

let nextKey = 0;

export default function ProductForm({
  categories,
  product,
  photos,
  mainPhoto,
}: {
  categories: { id: string; name: string }[];
  product?: ProductFormValues; // missing when adding a new product
  photos?: React.ReactNode; // the photo manager, shown as step 4 (saves on its own)
  mainPhoto?: { url: string; fit: "cover" | "contain" };
}) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProduct, {});
  const errors = state.fieldErrors ?? {};
  const [dirty, setDirty] = useState(false);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [badge, setBadge] = useState(product?.badge ?? "");
  const [price, setPrice] = useState(product ? String(product.priceInr) : "");
  const [original, setOriginal] = useState(product?.originalPriceInr ? String(product.originalPriceInr) : "");
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [minDays, setMinDays] = useState(product?.deliveryMinDays ? String(product.deliveryMinDays) : "");
  const [maxDays, setMaxDays] = useState(product?.deliveryMaxDays ? String(product.deliveryMaxDays) : "");
  const [colors, setColors] = useState<ColorRow[]>(() =>
    (product?.colors ?? []).map((c) => ({ ...c, key: nextKey++, priceDelta: String(c.priceDelta) })),
  );

  // Warn before leaving the page with changes that were not saved
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const shownSlug = product ? product.id : slugEdited ? slug : slugify(name);
  const setColorList = (update: (rows: ColorRow[]) => ColorRow[]) => {
    setColors(update);
    setDirty(true);
  };
  const updateColor = (key: number, patch: Partial<ColorRow>) =>
    setColorList((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const addColor = (colorName = "", hex = "#C9A36A") =>
    setColorList((rows) => [...rows, { key: nextKey++, name: colorName, hex, priceDelta: "0" }]);
  const colorsJson = JSON.stringify(
    colors.map((c) => ({ id: c.id, name: c.name, hex: c.hex, priceDelta: Number(c.priceDelta || 0) })),
  );

  const priceNum = Number(price) || 0;
  const originalNum = Number(original) || 0;
  const off = discountPercent(originalNum || undefined, priceNum);
  const originalTooLow = originalNum > 0 && priceNum > 0 && originalNum <= priceNum;
  // Delivery preview: one number filled means exactly that many days
  const minNum = Number(minDays || maxDays) || 0;
  const maxNum = Number(maxDays || minDays) || 0;
  const daysOk = minNum >= 1 && maxNum >= minNum && maxNum <= MAX_DELIVERY_DAYS;
  const setDays = (min: string, max: string) => {
    setMinDays(min);
    setMaxDays(max);
    setDirty(true);
  };
  const categoryName = categories.find((c) => c.id === categoryId)?.name;
  const shopStatus = !isActive ? "hidden" : !mainPhoto ? "nophoto" : "live";
  const moreOptionsError = !!(errors.slug || errors.sortOrder);

  const fieldError = (key: string) =>
    errors[key] ? <p className="mt-1.5 text-xs text-red-700">{errors[key]}</p> : null;
  const hint = (text: React.ReactNode) => <p className="mt-1.5 text-xs text-stone-500">{text}</p>;

  return (
    // A div, not the form itself, so the photo step (which has its own buttons) can sit in the middle;
    // the fields join the form through form="product-form"
    <div
      className="space-y-6"
      onChange={(e) => {
        if ((e.target as HTMLInputElement).form?.id === FORM_ID) setDirty(true);
      }}
    >
      <form
        id={FORM_ID}
        hidden
        // Submitting through onSubmit instead of action={} stops React from clearing the fields
        // afterwards, so nothing typed is lost when a field needs fixing
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          startTransition(() => action(formData));
        }}
      />
      {product && <input type="hidden" form={FORM_ID} name="existingId" value={product.id} />}
      <input type="hidden" form={FORM_ID} name="colors" value={colorsJson} />

      {/* How the product looks on the shop, updated while typing */}
      <section aria-label="Preview" className="rounded-2xl border border-stone-200 bg-white p-4 flex gap-4 items-center">
        <div className="relative w-20 h-24 shrink-0 overflow-hidden rounded-lg bg-stone-100">
          {mainPhoto ? (
            <Image
              src={mainPhoto.url}
              alt=""
              fill
              sizes="80px"
              className={mainPhoto.fit === "contain" ? "object-contain" : "object-cover"}
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-[11px] text-stone-400 text-center px-1">
              No photo yet
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wider text-stone-500">
            {categoryName ?? "No category"}
            {badge ? ` · ${badge}` : ""}
          </p>
          <p className="mt-0.5 font-serif text-xl text-stone-900 truncate">{name || "Product name"}</p>
          <p className="mt-0.5 text-sm">
            <span className="font-medium text-stone-900">{priceNum > 0 ? formatPrice(priceNum) : "₹ —"}</span>
            {off > 0 && (
              <>
                <s className="ml-2 text-stone-400">{formatPrice(originalNum)}</s>
                <span className="ml-2 text-emerald-700">{off}% off</span>
              </>
            )}
          </p>
        </div>
        <span
          className={`shrink-0 self-start rounded-full px-2.5 py-1 text-xs font-medium ${
            shopStatus === "live"
              ? "bg-emerald-50 text-emerald-800"
              : shopStatus === "nophoto"
                ? "bg-amber-50 text-amber-800"
                : "bg-stone-100 text-stone-600"
          }`}
        >
          {shopStatus === "live" ? "On shop" : shopStatus === "nophoto" ? "Needs a photo" : "Hidden"}
        </span>
      </section>

      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      )}

      <Step n={1} title="Basic details" help="What the customer reads about this piece.">
        <div className="space-y-5">
          <div>
            <label htmlFor="p-name" className={labelClass}>
              Name
            </label>
            <input
              id="p-name"
              form={FORM_ID}
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
              placeholder="e.g. Monolith Slate Dining Table"
              className={inputClass}
            />
            {fieldError("name")}
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="p-category" className={labelClass}>
                Category
              </label>
              <select
                id="p-category"
                form={FORM_ID}
                name="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
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
                Badge <span className="font-normal text-stone-400">(optional)</span>
              </label>
              <input
                id="p-badge"
                form={FORM_ID}
                name="badge"
                list="p-badges"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                maxLength={40}
                placeholder="e.g. New Arrival"
                className={inputClass}
              />
              <datalist id="p-badges">
                {BADGES.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
              {errors.badge ? fieldError("badge") : hint("A small tag on the product photo. Leave empty for none.")}
            </div>
          </div>

          <div>
            <label htmlFor="p-description" className={labelClass}>
              Description
            </label>
            <textarea
              id="p-description"
              form={FORM_ID}
              name="description"
              defaultValue={product?.description}
              required
              rows={5}
              maxLength={3000}
              placeholder="The wood, the finish, how it is made, how big it is…"
              className={inputClass}
            />
            {errors.description ? fieldError("description") : hint("Shown on the product page. At least 10 characters.")}
          </div>

          <div>
            <label htmlFor="p-specs" className={labelClass}>
              Short specs <span className="font-normal text-stone-400">(optional)</span>
            </label>
            <input
              id="p-specs"
              form={FORM_ID}
              name="specs"
              defaultValue={product?.specs}
              maxLength={200}
              placeholder="e.g. 20mm Flame Slate · Fluted Oak"
              className={inputClass}
            />
            {errors.specs ? fieldError("specs") : hint("One line under the name. Separate parts with ·")}
          </div>
        </div>
      </Step>

      <Step n={2} title="Price and delivery" help={`In whole rupees, before GST. ${GST_PERCENT}% GST is added on top at checkout.`}>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="p-price" className={labelClass}>
              Selling price (₹)
            </label>
            <input
              id="p-price"
              form={FORM_ID}
              name="priceInr"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              placeholder="e.g. 45000"
              className={inputClass}
            />
            {errors.priceInr ? fieldError("priceInr") : hint("What the customer pays.")}
          </div>
          <div>
            <label htmlFor="p-original" className={labelClass}>
              Price before discount (₹) <span className="font-normal text-stone-400">(optional)</span>
            </label>
            <input
              id="p-original"
              form={FORM_ID}
              name="originalPriceInr"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              placeholder="Leave empty if there is no discount"
              className={inputClass}
            />
            {errors.originalPriceInr
              ? fieldError("originalPriceInr")
              : originalTooLow
                ? <p className="mt-1.5 text-xs text-amber-800">This should be higher than the selling price.</p>
                : hint("Shown crossed out next to the price.")}
          </div>
        </div>
        {priceNum > 0 && (
          <p className="mt-4 rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-700">
            The customer sees <strong className="font-semibold text-stone-900">{formatPrice(priceNum)}</strong>
            {off > 0 && (
              <>
                {" "}
                with <s>{formatPrice(originalNum)}</s> crossed out ({off}% off, saves {formatPrice(originalNum - priceNum)})
              </>
            )}
            .
          </p>
        )}

        <div className="mt-6 border-t border-stone-200 pt-5">
          <p className={labelClass}>
            Delivery time <span className="font-normal text-stone-400">(optional)</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DELIVERY_PRESETS.map((p) => {
              const on = minNum === p.min && maxNum === p.max;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setDays(String(p.min), String(p.max))}
                  aria-pressed={on}
                  className={`rounded-full border px-3 py-1.5 text-xs cursor-pointer ${
                    on ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 text-stone-700 hover:border-stone-700"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-stone-700">
            <span>From</span>
            <input
              form={FORM_ID}
              name="deliveryMinDays"
              type="number"
              min={1}
              max={MAX_DELIVERY_DAYS}
              step={1}
              inputMode="numeric"
              value={minDays}
              onChange={(e) => setDays(e.target.value, maxDays)}
              aria-label="Fewest days to deliver"
              className={`${inputClass} !w-20`}
            />
            <span>to</span>
            <input
              form={FORM_ID}
              name="deliveryMaxDays"
              type="number"
              min={1}
              max={MAX_DELIVERY_DAYS}
              step={1}
              inputMode="numeric"
              value={maxDays}
              onChange={(e) => setDays(minDays, e.target.value)}
              aria-label="Most days to deliver"
              className={`${inputClass} !w-20`}
            />
            <span>days after the order</span>
            {(minDays || maxDays) && (
              <button
                type="button"
                onClick={() => setDays("", "")}
                className="text-xs text-stone-500 underline underline-offset-4 hover:text-stone-900 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          {errors.deliveryDays
            ? fieldError("deliveryDays")
            : daysOk
              ? (
                <p className="mt-3 rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-700">
                  The product page shows{" "}
                  <strong className="font-semibold text-stone-900" suppressHydrationWarning>
                    Estimated delivery {estimatedDeliveryRange(minNum, maxNum)}
                  </strong>{" "}
                  for an order placed today ({leadTimeLabel(minNum, maxNum)}).
                </p>
              )
              : hint("How long it usually takes to make and deliver. Leave empty to not show a date.")}
        </div>
      </Step>

      <Step
        n={3}
        title="Colours and finishes"
        help="Skip this if the piece comes in one finish. The first colour is the one shown first."
        aside={
          <button
            type="button"
            onClick={() => addColor()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-300 bg-white hover:border-stone-900 text-stone-900 text-sm font-medium cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add colour
          </button>
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs text-stone-500">Quick add:</span>
          {QUICK_COLOURS.filter(([n]) => !colors.some((c) => c.name.toLowerCase() === n.toLowerCase())).map(([n, hex]) => (
            <button
              key={n}
              type="button"
              onClick={() => addColor(n, hex)}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-2.5 py-1 text-xs text-stone-700 hover:border-stone-700 cursor-pointer"
            >
              <span className="h-3 w-3 rounded-full ring-1 ring-inset ring-black/10" style={{ background: hex }} aria-hidden />
              {n}
            </button>
          ))}
        </div>

        {colors.length > 0 && (
          <ul className="mt-5 space-y-3">
            {colors.map((c, i) => {
              const extra = Math.max(0, Math.round(Number(c.priceDelta) || 0));
              return (
                <li
                  key={c.key}
                  className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_8rem_auto_auto] items-center gap-3 rounded-xl border border-stone-200 p-3"
                >
                  <input
                    type="color"
                    value={/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : "#000000"}
                    onChange={(e) => updateColor(c.key, { hex: e.target.value.toUpperCase() })}
                    aria-label={`Pick the colour for ${c.name || `colour ${i + 1}`}`}
                    title="Click to pick the colour"
                    className="h-10 w-12 rounded-lg border border-stone-300 bg-white p-1 cursor-pointer"
                  />
                  <div className="min-w-0">
                    <input
                      value={c.name}
                      onChange={(e) => updateColor(c.key, { name: e.target.value })}
                      placeholder="Colour name, e.g. Smoked Oak"
                      aria-label={`Colour ${i + 1} name`}
                      maxLength={40}
                      className={inputClass}
                    />
                    <p className="mt-1 text-xs text-stone-500">
                      {i === 0 ? (
                        <span className="font-medium text-stone-700">Shown first</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setColorList((rows) => [c, ...rows.filter((r) => r.key !== c.key)])}
                          className="underline underline-offset-2 hover:text-stone-900 cursor-pointer"
                        >
                          Show this first
                        </button>
                      )}
                    </p>
                  </div>
                  <label className="col-start-2 sm:col-start-auto block">
                    <span className="block text-xs text-stone-500 mb-1">Extra price (₹)</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={c.priceDelta}
                      onChange={(e) => updateColor(c.key, { priceDelta: e.target.value })}
                      className={inputClass}
                    />
                  </label>
                  <p className="col-start-2 sm:col-start-auto text-xs text-stone-600 whitespace-nowrap sm:pt-4">
                    {priceNum > 0 ? `= ${formatPrice(priceNum + extra)}` : extra > 0 ? `+ ${formatPrice(extra)}` : "Same price"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setColorList((rows) => rows.filter((r) => r.key !== c.key))}
                    aria-label={`Remove colour ${c.name || i + 1}`}
                    title="Remove"
                    className="row-start-1 col-start-3 sm:row-start-auto sm:col-start-auto h-10 w-10 inline-flex items-center justify-center rounded-lg text-stone-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {fieldError("colors")}
      </Step>

      <Step
        n={4}
        title="Photos"
        help={
          photos
            ? "These save by themselves, no need to press Save. The main photo is the one shown in the shop."
            : undefined
        }
      >
        {photos ?? (
          <p className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-500">
            Press &ldquo;Create product&rdquo; below first. Then you can add photos right here.
          </p>
        )}
      </Step>

      <Step n={5} title="Show on the shop">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            form={FORM_ID}
            name="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="mt-0.5 w-5 h-5 accent-[#E08A50] cursor-pointer"
          />
          <span className="text-sm text-stone-900">
            Customers can see and buy this product
            <span className="block text-xs text-stone-500">
              {isActive
                ? mainPhoto
                  ? "It is on the shop."
                  : "It will appear as soon as it has a photo."
                : "Hidden: nothing is deleted, untick to hide and tick to show again."}
            </span>
          </span>
        </label>

        <label className="mt-4 flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            form={FORM_ID}
            name="onHomePage"
            defaultChecked={product?.onHomePage ?? false}
            className="mt-0.5 w-5 h-5 accent-[#E08A50] cursor-pointer"
          />
          <span className="text-sm text-stone-900">
            Show on the home page
            <span className="block text-xs text-stone-500">
              In the &ldquo;Selected pieces&rdquo; section. &ldquo;Place in the shop&rdquo; below sets its order there too.
            </span>
          </span>
        </label>
        <details className="mt-5 border-t border-stone-200 pt-4 group" open={moreOptionsError || undefined}>
          <summary className="cursor-pointer list-none text-sm text-stone-700 hover:text-stone-900">
            <span className="group-open:hidden">+ More options</span>
            <span className="hidden group-open:inline">− More options</span>
            <span className="ml-2 text-xs text-stone-500">(web address, place in the shop)</span>
          </summary>
          <div className="mt-4 grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="p-slug" className={labelClass}>
                Web address
              </label>
              <div className="flex items-center rounded-xl border border-stone-300 bg-stone-50 text-sm overflow-hidden focus-within:border-stone-900">
                <span className="pl-4 pr-1 text-stone-500 whitespace-nowrap">/products/</span>
                <input
                  id="p-slug"
                  form={FORM_ID}
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
              {errors.slug
                ? fieldError("slug")
                : hint(
                    product
                      ? "Stays the same, so shared links keep working."
                      : "Made from the name. It can't be changed later.",
                  )}
            </div>
            <div>
              <label htmlFor="p-sort" className={labelClass}>
                Place in the shop
              </label>
              <input
                id="p-sort"
                form={FORM_ID}
                name="sortOrder"
                type="number"
                step={1}
                defaultValue={product?.sortOrder ?? 0}
                className={inputClass}
              />
              {errors.sortOrder
                ? fieldError("sortOrder")
                : hint("Smaller numbers come first. Products with the same number go A to Z.")}
            </div>
          </div>
        </details>
      </Step>

      {/* Always in reach while scrolling */}
      <div className="sticky bottom-0 z-10 rounded-2xl border border-stone-200 bg-white/95 backdrop-blur px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <p className="text-sm" role="status">
          {pending ? (
            <span className="text-stone-500">Saving…</span>
          ) : state.error && !dirty ? (
            <span className="text-red-700">Please fix the fields marked in red.</span>
          ) : dirty ? (
            <span className="text-amber-800">● You have changes that are not saved</span>
          ) : product ? (
            <span className="text-stone-500">All changes saved</span>
          ) : (
            <span className="text-stone-500">Fill in the steps, then create the product.</span>
          )}
        </p>
        <button
          type="submit"
          form={FORM_ID}
          disabled={pending}
          onClick={() => setDirty(false)}
          className={primaryButton}
        >
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { inputClass } from "./ui";

// Search, category and sort for the admin product list. Each applies on its own: picking a category or
// sort straight away, the search once typing pauses. The status tab is kept.
export default function ProductFilters({
  q,
  category,
  sort,
  status,
  categories,
  sorts,
}: {
  q: string;
  category: string;
  sort: string;
  status: string;
  categories: { id: string; name: string }[];
  sorts: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function apply(next: { q?: string; category?: string; sort?: string }) {
    const values = { q: text.trim(), category, sort, ...next };
    const sp = new URLSearchParams();
    if (status !== "all") sp.set("status", status);
    if (values.q) sp.set("q", values.q);
    if (values.category) sp.set("category", values.category);
    if (values.sort && values.sort !== sorts[0]?.value) sp.set("sort", values.sort);
    const query = sp.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  // Search a moment after the last key press, not on every letter
  function type(value: string) {
    setText(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => apply({ q: value.trim() }), 400);
  }
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <div role="search" aria-busy={pending} className={`flex flex-wrap gap-2 w-full lg:w-auto lg:ml-auto transition-opacity ${pending ? "opacity-60" : ""}`}>
      <div className="relative flex-1 lg:w-52">
        <input
          type="search"
          value={text}
          onChange={(e) => type(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            if (timer.current) clearTimeout(timer.current);
            apply({ q: text.trim() });
          }}
          placeholder="Search name or specs"
          aria-label="Search products"
          className={`${inputClass} pr-8 [&::-webkit-search-cancel-button]:hidden`}
        />
        {text && (
          <button
            type="button"
            onClick={() => type("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-full text-stone-400 hover:text-stone-900 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <select value={category} onChange={(e) => apply({ category: e.target.value })} aria-label="Category" className={`${inputClass} w-auto`}>
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select value={sort} onChange={(e) => apply({ sort: e.target.value })} aria-label="Sort" className={`${inputClass} w-auto`}>
        {sorts.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

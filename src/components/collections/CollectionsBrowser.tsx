"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PriceTag from "@/components/products/PriceTag";
import WishlistButton from "@/components/account/WishlistButton";
import { ArrowUpRight, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WHATSAPP_NUMBER, type CollectionCategory, type CollectionProduct } from "@/data/collections";

type SortKey = "featured" | "price-asc" | "price-desc";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
];

// Half-open ranges: min <= price < max
const priceRanges = [
  { id: "under-1", label: "Under ₹1,00,000", min: 0, max: 100000 },
  { id: "1-2", label: "₹1,00,000 – ₹2,00,000", min: 100000, max: 200000 },
  { id: "2-3", label: "₹2,00,000 – ₹3,00,000", min: 200000, max: 300000 },
  { id: "3-plus", label: "₹3,00,000 & above", min: 300000, max: Infinity },
];

const materialOptions = [
  "Slate",
  "Oak",
  "Leather",
  "Bouclé",
  "Marble",
  "Travertine",
  "Walnut",
  "Brass",
  "Alabaster",
  "Ash",
];

const EASE = [0.22, 1, 0.36, 1] as const;

function hasMaterial(product: CollectionProduct, material: string) {
  const words = product.specs.toLowerCase().split(/[^a-zà-ÿ]+/);
  return words.includes(material.toLowerCase());
}

function enquiryHref(product: CollectionProduct) {
  const text = `Hello Averto, I would like to enquire about ${/^the /i.test(product.name) ? "" : "the "}${product.name}.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-stone-200/80 py-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between text-left cursor-pointer"
      >
        <span className="text-xs uppercase tracking-[0.18em] font-bold text-stone-900">{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-stone-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FilterPanelProps {
  allCategories: CollectionCategory[];
  categories: string[];
  prices: string[];
  materials: string[];
  counts: Record<string, number>;
  activeCount: number;
  onCategory: (id: string) => void;
  onPrice: (id: string) => void;
  onMaterial: (id: string) => void;
  onClear: () => void;
}

function FilterPanel({
  allCategories,
  categories,
  prices,
  materials,
  counts,
  activeCount,
  onCategory,
  onPrice,
  onMaterial,
  onClear,
}: FilterPanelProps) {
  const categoryRows = allCategories.map((c) => ({
    id: c.id,
    name: c.name,
    count: counts[c.id] ?? 0,
  }));

  return (
    <div>
      <div className="flex items-center justify-between pb-4 border-b border-stone-300/80">
        <h2 className="text-sm uppercase tracking-[0.18em] font-bold text-stone-900">Filters</h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-stone-600 hover:text-stone-900 underline underline-offset-4 cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      <FilterSection title="Category">
        <ul className="space-y-1">
          {categoryRows.map((row) => (
            <li key={row.id}>
              <label className="flex items-center justify-between gap-3 py-1.5 cursor-pointer text-sm text-stone-700 hover:text-stone-950">
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={categories.includes(row.id)}
                    onChange={() => onCategory(row.id)}
                    className="w-4 h-4 accent-stone-900 cursor-pointer"
                  />
                  <span>{row.name}</span>
                </span>
                <span className="text-xs tabular-nums text-stone-400">{row.count}</span>
              </label>
            </li>
          ))}
        </ul>
      </FilterSection>

      <FilterSection title="Price">
        <ul className="space-y-1">
          {priceRanges.map((range) => (
            <li key={range.id}>
              <label className="flex items-center gap-3 py-1.5 cursor-pointer text-sm text-stone-700 hover:text-stone-950">
                <input
                  type="checkbox"
                  checked={prices.includes(range.id)}
                  onChange={() => onPrice(range.id)}
                  className="w-4 h-4 accent-stone-900 cursor-pointer"
                />
                <span>{range.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </FilterSection>

      <FilterSection title="Material">
        <ul className="space-y-1">
          {materialOptions.map((m) => (
            <li key={m}>
              <label className="flex items-center gap-3 py-1.5 cursor-pointer text-sm text-stone-700 hover:text-stone-950">
                <input
                  type="checkbox"
                  checked={materials.includes(m)}
                  onChange={() => onMaterial(m)}
                  className="w-4 h-4 accent-stone-900 cursor-pointer"
                />
                <span>{m}</span>
              </label>
            </li>
          ))}
        </ul>
      </FilterSection>
    </div>
  );
}

export default function CollectionsBrowser({
  initialCategories,
  categories: allCategories,
  products,
}: {
  initialCategories: string[];
  categories: CollectionCategory[];
  products: CollectionProduct[];
}) {
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [prices, setPrices] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("featured");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) map[p.category] = (map[p.category] ?? 0) + 1;
    return map;
  }, [products]);

  const visible = useMemo(() => {
    const activeRanges = priceRanges.filter((r) => prices.includes(r.id));
    const list = products.filter((p) => {
      if (categories.length && !categories.includes(p.category)) return false;
      if (activeRanges.length && !activeRanges.some((r) => p.priceInr >= r.min && p.priceInr < r.max)) {
        return false;
      }
      if (materials.length && !materials.some((m) => hasMaterial(p, m))) return false;
      return true;
    });
    if (sort === "price-asc") list.sort((a, b) => a.priceInr - b.priceInr);
    if (sort === "price-desc") list.sort((a, b) => b.priceInr - a.priceInr);
    return list;
  }, [products, categories, prices, materials, sort]);

  // A single ticked category gets its own title and blurb; otherwise show the general heading
  const activeCategory =
    categories.length === 1 ? allCategories.find((c) => c.id === categories[0]) : undefined;
  const activeCount = categories.length + prices.length + materials.length;

  // Keep the ticked categories shareable (/collections?category=dining,sofas) without a navigation
  const syncUrl = (next: string[]) => {
    const url = next.length ? `/collections?category=${next.join(",")}` : "/collections";
    window.history.replaceState(null, "", url);
  };

  const toggleCategory = (id: string) => {
    const next = toggle(categories, id);
    setCategories(next);
    syncUrl(next);
  };

  const clearAll = () => {
    setCategories([]);
    syncUrl([]);
    setPrices([]);
    setMaterials([]);
  };

  // Lock page scroll and allow Esc while the mobile filter drawer is open
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const panelProps: FilterPanelProps = {
    allCategories,
    categories,
    prices,
    materials,
    counts,
    activeCount,
    onCategory: toggleCategory,
    onPrice: (id) => setPrices((p) => toggle(p, id)),
    onMaterial: (id) => setMaterials((m) => toggle(m, id)),
    onClear: clearAll,
  };

  return (
    <section className="w-full bg-[#FAF8F5] py-10 sm:py-14 px-6 sm:px-10 lg:px-16">
      <div className="max-w-[88rem] mx-auto lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-12 xl:gap-14 lg:items-start">
        {/* Desktop filter sidebar */}
        <aside
          aria-label="Filters"
          className="hidden lg:block lg:sticky lg:top-24 max-h-[calc(100vh-7rem)] overflow-y-auto [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <FilterPanel {...panelProps} />
        </aside>

        <div className="min-w-0">
          {/* Title */}
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#111110]">
              {activeCategory ? activeCategory.name : "All Pieces"}
            </h2>
            <p className="text-sm text-stone-500 mt-1.5">
              {activeCategory
                ? activeCategory.blurb
                : "Every piece is made to order in our ateliers and can be resized to your space."}
            </p>
          </div>

          {/* Toolbar: count + sort tabs (+ filters button on small screens) */}
          <div className="mt-6 mb-8 py-3 border-y border-stone-300/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-4">
              <p className="text-sm text-stone-600">
                Showing{" "}
                <span className="font-bold text-stone-900">
                  {visible.length === 0 ? 0 : `1 – ${visible.length}`}
                </span>{" "}
                of <span className="font-bold text-stone-900">{visible.length}</span>{" "}
                {visible.length === 1 ? "piece" : "pieces"}
              </p>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2 rounded-full border border-stone-300 text-sm font-semibold text-stone-900 cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeCount > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#1A1A18] text-white text-[11px] flex items-center justify-center">
                    {activeCount}
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto" role="group" aria-label="Sort by">
              <span className="text-xs uppercase tracking-wider font-bold text-stone-900 mr-2 shrink-0">
                Sort By
              </span>
              {sortOptions.map((o) => {
                const isActive = o.key === sort;
                return (
                  <button
                    key={o.key}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setSort(o.key)}
                    className={`shrink-0 px-3 py-1.5 text-sm cursor-pointer border-b-2 transition-colors ${
                      isActive
                        ? "border-stone-900 text-stone-900"
                        : "border-transparent text-stone-600 hover:text-stone-900 font-medium"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product grid: cards stay at least 320px wide */}
          {visible.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-serif text-2xl text-stone-900">No pieces match these filters</p>
              <p className="text-sm text-stone-500 mt-2">Try removing a filter, or commission something made for you.</p>
              <button
                type="button"
                onClick={clearAll}
                className="mt-6 px-6 py-3 rounded-full bg-stone-900 text-white text-sm font-semibold cursor-pointer hover:bg-stone-800 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-x-6 gap-y-12 lg:gap-x-8 lg:gap-y-14"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {visible.map((product) => (
                  <motion.article
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="group flex flex-col"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-[#ECE8E1]">
                      <div className={`absolute inset-0 ${product.zoomClass ?? ""}`}>
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 45vw, 30vw"
                        />
                      </div>
                      {/* Whole photo opens the product page; badge and enquiry button sit above it */}
                      <Link
                        href={`/products/${product.id}`}
                        aria-label={`View ${product.name}`}
                        className="absolute inset-0"
                      />
                      <span className="absolute top-4 left-4 px-3.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-stone-900 text-[10px] font-sans font-bold uppercase tracking-wider">
                        {product.badge}
                      </span>
                      <WishlistButton productId={product.id} variant="overlay" className="absolute top-3 right-3" />
                      <a
                        href={enquiryHref(product)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Enquire about ${product.name} on WhatsApp`}
                        className="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-white text-stone-900 hover:bg-stone-900 hover:text-white flex items-center justify-center shadow-lg transition-all duration-300 sm:opacity-0 sm:translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 focus-visible:opacity-100 focus-visible:translate-y-0"
                      >
                        <ArrowUpRight className="w-5 h-5" />
                      </a>
                    </div>

                    <div className="pt-5">
                      <span className="text-[11px] uppercase tracking-[0.18em] text-[#A66E38] font-semibold">
                        {allCategories.find((c) => c.id === product.category)?.name}
                      </span>
                      <h3 className="font-serif text-xl sm:text-2xl text-stone-900 leading-snug mt-1.5">
                        <Link
                          href={`/products/${product.id}`}
                          className="hover:text-[#A66E38] transition-colors"
                        >
                          {product.name}
                        </Link>
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-500 mt-1.5">{product.specs}</p>
                      <div className="mt-4 flex items-center justify-between gap-4">
                        <PriceTag price={product.priceInr} original={product.originalPriceInr} />
                        <a
                          href={enquiryHref(product)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold uppercase tracking-wider text-stone-900 border-b border-stone-900 pb-0.5 hover:text-[#A66E38] hover:border-[#A66E38] transition-colors"
                        >
                          Enquire
                        </a>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile / tablet filter drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="lg:hidden fixed inset-0 z-[150]" role="dialog" aria-modal="true" aria-label="Filters">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-black/50"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: EASE }}
              className="absolute left-0 top-0 bottom-0 w-[88%] max-w-sm bg-[#FAF8F5] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
                <span className="font-serif text-xl text-stone-900">Refine</span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close filters"
                  className="w-9 h-9 rounded-full hover:bg-stone-200/70 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div
                className="flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                <FilterPanel {...panelProps} />
              </div>
              <div className="px-6 py-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="w-full py-3.5 rounded-full bg-stone-900 text-white text-sm font-semibold cursor-pointer"
                >
                  Show {visible.length} {visible.length === 1 ? "piece" : "pieces"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

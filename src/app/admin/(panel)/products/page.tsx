import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, ExternalLink, House, Pencil, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { imageUrl } from "@/lib/catalog";
import { discountPercent, formatPrice } from "@/data/collections";
import { formatDate } from "@/lib/admin-format";
import { setProductActive, setProductOnHomePage } from "@/app/admin/actions";
import { primaryButton } from "@/components/admin/ui";
import ProductFilters from "@/components/admin/ProductFilters";

type StatusFilter = "all" | "live" | "hidden" | "nophoto" | "home";
type SortKey = "position" | "name" | "price-asc" | "price-desc" | "best" | "newest";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "live", label: "On shop" },
  { value: "hidden", label: "Hidden" },
  { value: "nophoto", label: "No photo" },
  { value: "home", label: "Home page" },
];

const SORTS: { value: SortKey; label: string }[] = [
  { value: "position", label: "Shop order" },
  { value: "best", label: "Best selling" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name A–Z" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; q?: string; category?: string; status?: string; sort?: string }>;
}) {
  await requireAdmin("products");
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase().slice(0, 60);
  const status = (STATUS_TABS.find((t) => t.value === params.status)?.value ?? "all") as StatusFilter;
  const sort = (SORTS.find((s) => s.value === params.sort)?.value ?? "position") as SortKey;

  // Straight from the database (not the shop cache), including hidden products
  const [products, categories, soldLines, ratings] = await Promise.all([
    prisma.product.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        category: { select: { name: true } },
        colors: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true, hex: true } },
        images: { where: { colorId: null }, orderBy: { sortOrder: "asc" }, take: 1 },
        _count: { select: { images: true } },
      },
    }),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    // every line ever sold, cancelled orders left out (summed below: groupBy can't multiply qty × price)
    prisma.orderItem.findMany({
      where: { productId: { not: null }, order: { fulfillment: { not: "cancelled" } } },
      select: { productId: true, qty: true, unitPrice: true },
    }),
    prisma.review.groupBy({
      by: ["productId"],
      where: { status: "approved" },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);
  const revenue = new Map<string, number>();
  const sold = new Map<string, number>();
  for (const line of soldLines) {
    const id = line.productId!;
    revenue.set(id, (revenue.get(id) ?? 0) + line.qty * line.unitPrice);
    sold.set(id, (sold.get(id) ?? 0) + line.qty);
  }
  const rating = new Map(ratings.map((r) => [r.productId, { avg: r._avg.rating ?? 0, count: r._count._all }]));

  const statusOf = (p: (typeof products)[number]): Exclude<StatusFilter, "all" | "home"> =>
    !p.isActive ? "hidden" : p._count.images === 0 ? "nophoto" : "live";
  const counts = {
    all: products.length,
    live: products.filter((p) => statusOf(p) === "live").length,
    hidden: products.filter((p) => statusOf(p) === "hidden").length,
    nophoto: products.filter((p) => statusOf(p) === "nophoto").length,
    home: products.filter((p) => p.onHomePage).length,
  };

  const category = categories.some((c) => c.id === params.category) ? params.category : undefined;
  const list = products.filter(
    (p) =>
      (status === "all" || (status === "home" ? p.onHomePage : statusOf(p) === status)) &&
      (!category || p.categoryId === category) &&
      (!q || p.name.toLowerCase().includes(q) || p.id.includes(q) || p.specs.toLowerCase().includes(q)),
  );
  if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "price-asc") list.sort((a, b) => a.priceInr - b.priceInr);
  if (sort === "price-desc") list.sort((a, b) => b.priceInr - a.priceInr);
  if (sort === "best") list.sort((a, b) => (revenue.get(b.id) ?? 0) - (revenue.get(a.id) ?? 0));
  if (sort === "newest") list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const href = (next: Partial<{ status: string; category: string; sort: string; q: string }>) => {
    const merged = { status, category: category ?? "", sort, q, ...next };
    const sp = new URLSearchParams();
    if (merged.status !== "all") sp.set("status", merged.status);
    if (merged.category) sp.set("category", merged.category);
    if (merged.sort !== "position") sp.set("sort", merged.sort);
    if (merged.q) sp.set("q", merged.q);
    const query = sp.toString();
    return `/admin/products${query ? `?${query}` : ""}`;
  };

  const tiles = [
    { label: "Products", value: counts.all },
    { label: "On the shop", value: counts.live },
    { label: "Hidden", value: counts.hidden },
    { label: "Need a photo", value: counts.nophoto, warn: counts.nophoto > 0 },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-[#111110]">Products</h1>
          <p className="mt-1 text-sm text-stone-500">
            Everything in your shop. Click a product to change anything about it.
          </p>
        </div>
        <Link href="/admin/products/new" className={primaryButton}>
          + Add product
        </Link>
      </div>

      <details className="mt-4 rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm group">
        <summary className="cursor-pointer list-none font-medium text-stone-900 flex items-center justify-between">
          How this page works
          <span className="text-xs font-normal text-stone-500 group-open:hidden">Show</span>
          <span className="text-xs font-normal text-stone-500 hidden group-open:inline">Hide</span>
        </summary>
        <ul className="mt-3 mb-1 space-y-2.5 text-stone-700 leading-relaxed">
          <li className="flex gap-2.5">
            <Pencil className="w-4 h-4 mt-0.5 shrink-0 text-stone-500" aria-hidden />
            <span>
              <strong className="font-medium text-stone-900">Edit:</strong> click the product&apos;s name or the pencil.
              There you change the name, price, description, size and specs, colours and photos.
            </span>
          </li>
          <li className="flex gap-2.5">
            <EyeOff className="w-4 h-4 mt-0.5 shrink-0 text-stone-500" aria-hidden />
            <span>
              <strong className="font-medium text-stone-900">Hide from the shop:</strong> the eye button. Nothing is
              deleted, customers just stop seeing it. Press it again to bring it back.
            </span>
          </li>
          <li className="flex gap-2.5">
            <House className="w-4 h-4 mt-0.5 shrink-0 text-stone-500" aria-hidden />
            <span>
              <strong className="font-medium text-stone-900">Home page:</strong> the house button puts a product in the
              &ldquo;Selected pieces&rdquo; section of the home page; press it again to take it off. The &ldquo;Home
              page&rdquo; tab lists the ones there now. A hidden product or one without a photo is not shown.
            </span>
          </li>
          <li className="flex gap-2.5">
            <ExternalLink className="w-4 h-4 mt-0.5 shrink-0 text-stone-500" aria-hidden />
            <span>
              <strong className="font-medium text-stone-900">See it on the shop:</strong> opens the product the way a
              customer sees it.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="w-4 mt-0.5 shrink-0 text-center font-semibold text-stone-500" aria-hidden>
              +
            </span>
            <span>
              <strong className="font-medium text-stone-900">New product:</strong> &ldquo;+ Add product&rdquo; at the top.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="w-4 mt-1.5 shrink-0 flex justify-center" aria-hidden>
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
            </span>
            <span>
              <strong className="font-medium text-stone-900">Status:</strong>{" "}
              <span className="text-emerald-800">On shop</span> means customers can see it.{" "}
              <span className="text-amber-800">No photo</span> means it still needs a photo; it stays off the shop
              until it has one. <span className="text-stone-600">Hidden</span> means you hid it.
            </span>
          </li>
          <li className="flex gap-2.5">
            <Star className="w-4 h-4 mt-0.5 shrink-0 text-stone-500" aria-hidden />
            <span>
              <strong className="font-medium text-stone-900">Sold and Rating:</strong> Sold shows how many pieces were
              ordered and the money they brought in (cancelled orders are not counted). Rating is the average of the
              approved reviews.
            </span>
          </li>
        </ul>
      </details>

      {params.deleted && (
        <p role="status" className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900">
          Product deleted.
        </p>
      )}

      <section aria-label="Summary" className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
            <p className="text-xs text-stone-500">{t.label}</p>
            <p className={`mt-0.5 text-2xl font-semibold ${t.warn ? "text-amber-700" : "text-stone-900"}`}>{t.value}</p>
          </div>
        ))}
      </section>

      {/* Filters: one row above the list they scope */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <nav aria-label="Filter by status" className="flex flex-wrap gap-1.5 text-sm">
          {STATUS_TABS.map((tab) => {
            const active = tab.value === status;
            return (
              <Link
                key={tab.value}
                href={href({ status: tab.value })}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-1.5 rounded-full border transition-colors ${
                  active ? "bg-stone-900 border-stone-900 text-white" : "bg-white border-stone-200 text-stone-700 hover:border-stone-400"
                }`}
              >
                {tab.label} <span className={active ? "text-white/70" : "text-stone-400"}>{counts[tab.value]}</span>
              </Link>
            );
          })}
        </nav>
        <ProductFilters
          q={(params.q ?? "").trim().slice(0, 60)}
          category={category ?? ""}
          sort={sort}
          status={status}
          categories={categories}
          sorts={SORTS}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-stone-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium text-right">Price</th>
              <th className="px-4 py-3 font-medium">Colours</th>
              <th className="px-4 py-3 font-medium text-right">Sold</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium sr-only">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {list.map((p) => {
              const photo = p.images[0];
              const state = statusOf(p);
              const off = discountPercent(p.originalPriceInr ?? undefined, p.priceInr);
              const r = rating.get(p.id);
              const units = sold.get(p.id) ?? 0;
              return (
                <tr key={p.id} className="hover:bg-stone-50 align-middle">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 min-w-56 group">
                      <span className="relative w-12 h-[60px] shrink-0 rounded-lg overflow-hidden bg-stone-100">
                        {photo && <Image src={imageUrl(photo.path)} alt="" fill sizes="48px" className="object-cover" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium text-stone-900 group-hover:underline underline-offset-4">{p.name}</span>
                        <span className="block text-xs text-stone-500">
                          {p.category.name}
                          {p.badge ? ` · ${p.badge}` : ""} · {p._count.images} photo{p._count.images === 1 ? "" : "s"}
                        </span>
                        <span className="block text-[11px] text-stone-400">Updated {formatDate(p.updatedAt)}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">
                    <span className="text-stone-900">{formatPrice(p.priceInr)}</span>
                    {p.originalPriceInr && (
                      <span className="block text-xs text-stone-400">
                        <s>{formatPrice(p.originalPriceInr)}</s>
                        {off > 0 && <span className="ml-1 text-emerald-700">−{off}%</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.colors.length ? (
                      <span className="flex items-center gap-1" title={p.colors.map((c) => c.name).join(", ")}>
                        {p.colors.slice(0, 5).map((c) => (
                          <span
                            key={c.id}
                            className="h-4 w-4 rounded-full ring-1 ring-inset ring-black/10"
                            style={{ background: c.hex }}
                            aria-hidden
                          />
                        ))}
                        {p.colors.length > 5 && <span className="text-xs text-stone-500">+{p.colors.length - 5}</span>}
                        <span className="sr-only">{p.colors.map((c) => c.name).join(", ")}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400">One finish</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">
                    {units > 0 ? (
                      <>
                        <span className="text-stone-900">{units}</span>
                        <span className="block text-xs text-stone-500">{formatPrice(revenue.get(p.id) ?? 0)}</span>
                      </>
                    ) : (
                      <span className="text-xs text-stone-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r ? (
                      <span className="inline-flex items-center gap-1 text-stone-900">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" aria-hidden />
                        {r.avg.toFixed(1)}
                        <span className="text-xs text-stone-500">({r.count})</span>
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400">No reviews</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                        state === "live"
                          ? "bg-emerald-50 text-emerald-800"
                          : state === "nophoto"
                            ? "bg-amber-50 text-amber-800"
                            : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {state === "live" ? "On shop" : state === "nophoto" ? "No photo" : "Hidden"}
                    </span>
                    {p.onHomePage && (
                      <span className="mt-1 flex items-center gap-1 whitespace-nowrap text-xs text-[#B5652B]">
                        <House className="w-3 h-3" aria-hidden /> Home page
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <form action={setProductActive}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="active" value={String(!p.isActive)} />
                        <button
                          type="submit"
                          title={p.isActive ? "Hide from shop" : "Show on shop"}
                          aria-label={`${p.isActive ? "Hide" : "Show"} ${p.name}`}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
                        >
                          {p.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </form>
                      <form action={setProductOnHomePage}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="onHomePage" value={String(!p.onHomePage)} />
                        <button
                          type="submit"
                          title={p.onHomePage ? "Take off the home page" : "Show on the home page"}
                          aria-label={`${p.onHomePage ? "Take" : "Put"} ${p.name} ${p.onHomePage ? "off" : "on"} the home page`}
                          aria-pressed={p.onHomePage}
                          className={`h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-stone-100 cursor-pointer ${
                            p.onHomePage ? "text-[#E08A50] hover:text-[#B5652B]" : "text-stone-400 hover:text-stone-900"
                          }`}
                        >
                          <House className="w-4 h-4" fill={p.onHomePage ? "currentColor" : "none"} fillOpacity={0.2} />
                        </button>
                      </form>
                      {state === "live" && (
                        <Link
                          href={`/products/${p.id}`}
                          target="_blank"
                          title="View on shop"
                          aria-label={`View ${p.name} on the shop`}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                      <Link
                        href={`/admin/products/${p.id}`}
                        title="Edit"
                        aria-label={`Edit ${p.name}`}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-stone-500">
                  {products.length === 0 ? "No products yet." : "No products match these filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-stone-500">
        Showing {list.length} of {products.length}. “Sold” counts every order except cancelled ones.
      </p>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { formatPrice } from "@/data/collections";
import { FULFILLMENT, fulfillmentInfo, formatDateTime } from "@/lib/admin-format";
import { inputClass, secondaryButton } from "@/components/admin/ui";
import type { FulfillmentStatus, Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 25;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const status = FULFILLMENT.some((f) => f.value === params.status) ? (params.status as FulfillmentStatus) : undefined;
  const q = (params.q ?? "").trim().slice(0, 60);
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(status ? { fulfillment: status } : {}),
    ...(q
      ? {
          OR: [
            { ref: { contains: q, mode: "insensitive" } },
            { customerName: { contains: q, mode: "insensitive" } },
            { customerPhone: { contains: q } },
            { customerEmail: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [orders, total, counts] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { items: true } } },
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ["fulfillment"], _count: { _all: true } }),
  ]);
  const countOf = (value: FulfillmentStatus) => counts.find((c) => c.fulfillment === value)?._count._all ?? 0;
  const allCount = counts.reduce((sum, c) => sum + c._count._all, 0);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (next: { status?: string; page?: number }) => {
    const sp = new URLSearchParams();
    const s = "status" in next ? next.status : status;
    if (s) sp.set("status", s);
    if (q) sp.set("q", q);
    if (next.page && next.page > 1) sp.set("page", String(next.page));
    const query = sp.toString();
    return `/admin/orders${query ? `?${query}` : ""}`;
  };

  return (
    <div>
      <h1 className="font-serif text-3xl text-[#111110]">Orders</h1>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <nav aria-label="Filter by status" className="flex flex-wrap gap-1.5 text-sm">
          {[{ value: undefined, label: "All", count: allCount }, ...FULFILLMENT.map((f) => ({ ...f, count: countOf(f.value) }))].map(
            (tab) => {
              const active = tab.value === status;
              return (
                <Link
                  key={tab.label}
                  href={href({ status: tab.value })}
                  aria-current={active ? "page" : undefined}
                  className={`px-3 py-1.5 rounded-full border transition-colors ${
                    active ? "bg-stone-900 border-stone-900 text-white" : "bg-white border-stone-200 text-stone-700 hover:border-stone-400"
                  }`}
                >
                  {tab.label} <span className={active ? "text-white/70" : "text-stone-400"}>{tab.count}</span>
                </Link>
              );
            },
          )}
        </nav>
        <form className="ml-auto flex gap-2 w-full sm:w-auto" role="search">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Order no., name, phone, city"
            aria-label="Search orders"
            className={`${inputClass} sm:w-64`}
          />
          <button type="submit" className={secondaryButton}>
            Search
          </button>
        </form>
      </div>

      <div className="mt-5 rounded-2xl border border-stone-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium">Advance</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {orders.map((o) => {
              const info = fulfillmentInfo(o.fulfillment);
              return (
                <tr key={o.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium text-stone-900 underline-offset-4 hover:underline">
                      {o.ref}
                    </Link>
                    <p className="text-xs text-stone-500">{formatDateTime(o.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-stone-900">{o.customerName}</p>
                    <p className="text-xs text-stone-500">
                      {o.city} · {o._count.items} item{o._count.items === 1 ? "" : "s"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">{formatPrice(o.total)}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {o.status === "deposit_paid" ? (
                      <span className="text-emerald-800">✓ Paid online</span>
                    ) : o.status === "awaiting_payment" ? (
                      <span className="text-amber-800">Not paid yet</span>
                    ) : (
                      <span className="text-stone-500">Offline</span>
                    )}
                    {o.balancePaid && <span className="block text-emerald-800">✓ Balance paid</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${info.tone}`}>
                      {info.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-stone-500">
                  {q || status ? "No orders match." : "No orders yet. They appear here as soon as a customer checks out."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-stone-600">
          <span>
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={href({ page: page - 1 })} className={secondaryButton}>
                ← Newer
              </Link>
            )}
            {page < pages && (
              <Link href={href({ page: page + 1 })} className={secondaryButton}>
                Older →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

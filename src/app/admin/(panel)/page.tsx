import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { RANGES, getDashboard, type RangeDays } from "@/lib/sales";
import { formatPrice } from "@/data/collections";
import { formatDateTime } from "@/lib/admin-format";
import { PLACED_ORDER, UNPAID_ATTEMPT } from "@/lib/orders";
import SalesChart from "@/components/admin/SalesChart";

const BAR = "#C76F35";

// Signed change against the previous period of the same length
function Delta({ now, before, days }: { now: number; before: number; days: number }) {
  if (before === 0) {
    return <p className="mt-1 text-xs text-stone-500">{now > 0 ? `First in the last ${days * 2} days` : `vs previous ${days} days`}</p>;
  }
  const change = Math.round(((now - before) / before) * 100);
  const up = change >= 0;
  return (
    <p className={`mt-1 text-xs ${change === 0 ? "text-stone-500" : up ? "text-emerald-800" : "text-red-700"}`}>
      <span aria-hidden>{change === 0 ? "→" : up ? "↑" : "↓"}</span> {up && change > 0 ? "+" : ""}
      {change}% <span className="text-stone-500">vs previous {days} days</span>
    </p>
  );
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdmin("dashboard");
  const { days: requested } = await searchParams;
  const days = (RANGES.find((r) => String(r) === requested) ?? 30) as RangeDays;

  const [data, newOrders, awaitingPayment, pendingReviews, productsWithoutPhoto] = await Promise.all([
    getDashboard(days),
    prisma.order.findMany({
      where: { ...PLACED_ORDER, fulfillment: "new" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, ref: true, customerName: true, city: true, total: true, createdAt: true },
    }),
    prisma.order.count({ where: UNPAID_ATTEMPT }),
    prisma.review.count({ where: { status: "pending" } }),
    prisma.product.count({ where: { isActive: true, images: { none: {} } } }),
  ]);
  const newOrderCount = await prisma.order.count({ where: { ...PLACED_ORDER, fulfillment: "new" } });

  const { current, previous } = data;
  const average = current.orders ? Math.round(current.sales / current.orders) : 0;
  const previousAverage = previous.orders ? Math.round(previous.sales / previous.orders) : 0;
  const tiles = [
    { label: "Sales", value: formatPrice(current.sales), now: current.sales, before: previous.sales },
    { label: "Orders", value: current.orders.toLocaleString("en-IN"), now: current.orders, before: previous.orders },
    { label: "Average order", value: formatPrice(average), now: average, before: previousAverage },
    { label: "Money received", value: formatPrice(current.collected), now: current.collected, before: previous.collected },
  ];
  const categoryMax = Math.max(1, ...data.categories.map((c) => c.sales));

  const todo = [
    { count: newOrderCount, label: "new orders to confirm", href: "/admin/orders?status=new" },
    { count: awaitingPayment, label: "checkouts where the payment was not completed", href: "/admin/orders?status=unpaid" },
    { count: pendingReviews, label: "reviews waiting for approval", href: "/admin/reviews" },
    { count: productsWithoutPhoto, label: "products not on the shop (no photo)", href: "/admin/products" },
  ].filter((t) => t.count > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-3xl text-[#111110]">Dashboard</h1>
        {/* One filter row above everything it scopes */}
        <nav aria-label="Period" className="flex rounded-xl border border-stone-200 bg-white p-1 text-sm">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin?days=${r}`}
              aria-current={r === days ? "page" : undefined}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                r === days ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"
              }`}
            >
              Last {r} days
            </Link>
          ))}
        </nav>
      </div>

      <section aria-label="Totals" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
            <p className="text-sm text-stone-500">{t.label}</p>
            <p className="mt-1 text-2xl sm:text-3xl font-semibold text-stone-900">{t.value}</p>
            <Delta now={t.now} before={t.before} days={days} />
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="font-medium text-stone-900">Sales per day</h2>
        <p className="mt-0.5 mb-5 text-xs text-stone-500">Value of orders placed, cancelled orders left out. Hover a day for details.</p>
        <SalesChart data={data.daily} />
      </section>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          <h2 className="font-medium text-stone-900">Sales by category</h2>
          {data.categories.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">No sales in this period yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.categories.map((c) => (
                <li key={c.name} className="grid grid-cols-[7rem_1fr] items-center gap-3 text-sm">
                  <span className="truncate text-stone-700">{c.name}</span>
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-4 rounded-r-[4px]"
                      style={{ width: `${Math.max((c.sales / categoryMax) * 75, 1)}%`, background: BAR }}
                      aria-hidden
                    />
                    <span className="shrink-0 tabular-nums text-stone-900">{formatPrice(c.sales)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          <h2 className="font-medium text-stone-900">Best sellers</h2>
          {data.topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">No sales in this period yet.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs text-stone-500">
                <tr>
                  <th className="py-2 font-medium">Product</th>
                  <th className="py-2 font-medium text-right">Sold</th>
                  <th className="py-2 font-medium text-right">Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.topProducts.map((p) => (
                  <tr key={`${p.productId}-${p.name}`}>
                    <td className="py-2 pr-3">
                      {p.productId ? (
                        <Link href={`/admin/products/${p.productId}`} className="text-stone-900 hover:underline underline-offset-4">
                          {p.name}
                        </Link>
                      ) : (
                        p.name
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums">{p.qty}</td>
                    <td className="py-2 text-right tabular-nums">{formatPrice(p.sales)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          <h2 className="font-medium text-stone-900">Needs attention</h2>
          {todo.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">All caught up.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {todo.map((t) => (
                <li key={t.label}>
                  <Link href={t.href} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-stone-50">
                    <span className="min-w-8 rounded-full bg-[#E08A50] px-2 py-0.5 text-center text-xs font-semibold text-white">
                      {t.count}
                    </span>
                    <span className="text-stone-700">{t.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-stone-900">Latest new orders</h2>
            <Link href="/admin/orders" className="text-sm text-stone-500 hover:text-stone-900">
              All orders →
            </Link>
          </div>
          {newOrders.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">No new orders waiting.</p>
          ) : (
            <ul className="mt-3 divide-y divide-stone-100 text-sm">
              {newOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-stone-50 -mx-2 px-2 rounded-lg">
                    <span>
                      <span className="font-medium text-stone-900">{o.ref}</span>
                      <span className="block text-xs text-stone-500">
                        {o.customerName}, {o.city} · {formatDateTime(o.createdAt)}
                      </span>
                    </span>
                    <span className="tabular-nums">{formatPrice(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

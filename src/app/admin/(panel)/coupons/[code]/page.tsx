import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { RANGES, getCouponDetail, type RangeDays } from "@/lib/sales";
import { formatPrice } from "@/data/collections";
import { formatDate, formatDateTime, fulfillmentInfo } from "@/lib/admin-format";
import SalesChart from "@/components/admin/SalesChart";

function Delta({ now, before, days }: { now: number; before: number; days: number }) {
  if (before === 0) return <p className="mt-1 text-xs text-stone-500">vs previous {days} days</p>;
  const change = Math.round(((now - before) / before) * 100);
  return (
    <p className={`mt-1 text-xs ${change === 0 ? "text-stone-500" : change > 0 ? "text-emerald-800" : "text-red-700"}`}>
      <span aria-hidden>{change === 0 ? "→" : change > 0 ? "↑" : "↓"}</span> {change > 0 ? "+" : ""}
      {change}% <span className="text-stone-500">vs previous {days} days</span>
    </p>
  );
}

export default async function CouponTrackPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  await requireAdmin();
  const [{ code: rawCode }, { days: requested }] = await Promise.all([params, searchParams]);
  const code = decodeURIComponent(rawCode).toUpperCase();
  const days = (RANGES.find((r) => String(r) === requested) ?? 30) as RangeDays;

  const [coupon, data] = await Promise.all([prisma.coupon.findUnique({ where: { code } }), getCouponDetail(code, days)]);
  // A deleted coupon can still be tracked while orders carry its code
  if (!coupon && data.allTime.orders === 0 && data.recent.length === 0) notFound();

  const { current, previous, allTime } = data;
  const average = current.orders ? Math.round(current.sales / current.orders) : 0;
  const tiles = [
    { label: "Sales", value: formatPrice(current.sales), now: current.sales, before: previous.sales },
    { label: "Orders", value: String(current.orders), now: current.orders, before: previous.orders },
    { label: "Customers", value: String(current.customers), now: current.customers, before: previous.customers },
    { label: "Discount given", value: formatPrice(current.discount), now: current.discount, before: previous.discount },
  ];

  const rules = coupon
    ? [
        coupon.type === "percent" ? `${coupon.value}% off` : `${formatPrice(coupon.value)} off`,
        coupon.minOrder ? `min order ${formatPrice(coupon.minOrder)}` : null,
        coupon.maxDiscount ? `max ${formatPrice(coupon.maxDiscount)}` : null,
        coupon.maxUsesPerCustomer ? `${coupon.maxUsesPerCustomer}× per customer` : null,
        coupon.maxUses ? `${coupon.maxUses} uses in total` : null,
        coupon.allowedEmails.length ? `only ${coupon.allowedEmails.length} customer${coupon.allowedEmails.length === 1 ? "" : "s"}` : null,
        coupon.expiresAt ? `until ${formatDate(coupon.expiresAt)}` : null,
      ].filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/coupons?days=${days}`} className="text-sm text-stone-500 hover:text-stone-900">
          ← All coupons
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-mono text-3xl font-semibold text-[#111110]">{code}</h1>
            <p className="mt-1 text-sm text-stone-500">
              {coupon ? (
                <>
                  {coupon.description}
                  {rules.length > 0 && <> · {rules.join(" · ")}</>}
                  {!coupon.isActive && <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">Off</span>}
                </>
              ) : (
                "This coupon has been deleted; its past orders are shown below."
              )}
            </p>
          </div>
          <nav aria-label="Period" className="flex rounded-xl border border-stone-200 bg-white p-1 text-sm">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/admin/coupons/${code}?days=${r}`}
                aria-current={r === days ? "page" : undefined}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  r === days ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                {r} days
              </Link>
            ))}
          </nav>
        </div>
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

      <p className="text-sm text-stone-600">
        {current.discount > 0 ? (
          <>
            Every ₹1 of discount brought in <strong className="text-stone-900">{formatPrice(Math.round(current.sales / current.discount))}</strong>{" "}
            of sales. Average order with this coupon: <strong className="text-stone-900">{formatPrice(average)}</strong>.
          </>
        ) : null}{" "}
        All time: {allTime.orders} order{allTime.orders === 1 ? "" : "s"}, {formatPrice(allTime.sales)} in sales,{" "}
        {formatPrice(allTime.discount)} discount.
      </p>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="font-medium text-stone-900">Sales with {code}, per day</h2>
        <p className="mt-0.5 mb-5 text-xs text-stone-500">Value of orders that used this coupon, cancelled orders left out. Hover a day for details.</p>
        <SalesChart data={data.daily} />
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white overflow-x-auto">
        <h2 className="px-5 pt-5 font-medium text-stone-900">Latest orders with {code}</h2>
        {data.recent.length === 0 ? (
          <p className="px-5 py-6 text-sm text-stone-500">No orders have used this coupon yet.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-stone-500 border-y border-stone-200">
              <tr>
                <th className="px-5 py-2.5 font-medium">Order</th>
                <th className="px-5 py-2.5 font-medium">Customer</th>
                <th className="px-5 py-2.5 font-medium text-right">Discount</th>
                <th className="px-5 py-2.5 font-medium text-right">Total</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {data.recent.map((o) => {
                const info = fulfillmentInfo(o.fulfillment);
                return (
                  <tr key={o.id} className="hover:bg-stone-50">
                    <td className="px-5 py-2.5 whitespace-nowrap">
                      <Link href={`/admin/orders/${o.id}`} className="font-medium text-stone-900 hover:underline underline-offset-4">
                        {o.ref}
                      </Link>
                      <span className="block text-xs text-stone-500">{formatDateTime(o.createdAt)}</span>
                    </td>
                    <td className="px-5 py-2.5">
                      {o.customerName}
                      <span className="block text-xs text-stone-500">{o.customerEmail}</span>
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums whitespace-nowrap">{formatPrice(o.discount)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums whitespace-nowrap">{formatPrice(o.total)}</td>
                    <td className="px-5 py-2.5">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${info.tone}`}>
                        {info.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

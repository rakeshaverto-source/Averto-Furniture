import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { RANGES, getCouponSales, type RangeDays } from "@/lib/sales";
import { formatPrice } from "@/data/collections";
import { formatDate } from "@/lib/admin-format";
import { deleteCoupon } from "@/app/admin/store-actions";
import CouponForm from "@/components/admin/CouponForm";
import ConfirmButton from "@/components/admin/ConfirmButton";

// yyyy-mm-dd of a date in India time, for the date picker
const indianDay = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);

const BAR = "#C76F35"; // same single hue as the dashboard charts

export default async function AdminCouponsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdmin("coupons");
  const { days: requested } = await searchParams;
  const days = (RANGES.find((r) => String(r) === requested) ?? 30) as RangeDays;
  const [coupons, usage, performance] = await Promise.all([
    prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.order.groupBy({
      by: ["couponCode"],
      where: { couponCode: { not: null }, fulfillment: { not: "cancelled" } },
      _count: { _all: true },
      _sum: { discount: true },
    }),
    getCouponSales(days),
  ]);
  const now = new Date();
  const maxSales = Math.max(1, ...performance.map((p) => p.sales));
  const totalSales = performance.reduce((sum, p) => sum + p.sales, 0);
  const totalDiscount = performance.reduce((sum, p) => sum + p.discount, 0);

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-[#111110]">Coupons</h1>
          <p className="mt-1 text-sm text-stone-500">Codes are checked on the server, so customers can only use a code they were given.</p>
        </div>
        <nav aria-label="Period" className="flex rounded-xl border border-stone-200 bg-white p-1 text-sm">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/coupons?days=${r}`}
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

      <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-medium text-stone-900">Sales by coupon</h2>
          {performance.length > 0 && (
            <p className="text-xs text-stone-500">
              {formatPrice(totalSales)} in sales · {formatPrice(totalDiscount)} given as discount · last {days} days
            </p>
          )}
        </div>
        {performance.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">No orders used a coupon in the last {days} days.</p>
        ) : (
          <ul className="mt-5 space-y-4">
            {performance.map((p) => (
              <li key={p.code} className="grid grid-cols-[6.5rem_1fr] sm:grid-cols-[8rem_1fr] items-start gap-3 text-sm">
                <Link href={`/admin/coupons/${p.code}?days=${days}`} className="font-mono font-semibold text-stone-900 hover:underline underline-offset-4 truncate pt-0.5">
                  {p.code}
                </Link>
                <div className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-4 rounded-r-[4px]"
                      style={{ width: `${Math.max((p.sales / maxSales) * 72, 1)}%`, background: BAR }}
                      aria-hidden
                    />
                    <span className="shrink-0 tabular-nums font-medium text-stone-900">{formatPrice(p.sales)}</span>
                  </span>
                  <span className="mt-1 block text-xs text-stone-500">
                    {p.orders} order{p.orders === 1 ? "" : "s"} · {p.customers} customer{p.customers === 1 ? "" : "s"} ·{" "}
                    {formatPrice(p.discount)} discount
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="font-medium text-stone-900 mb-4">New coupon</h2>
        <CouponForm />
      </section>

      <ul className="mt-6 space-y-3">
        {coupons.map((c) => {
          const used = usage.find((u) => u.couponCode === c.code);
          const expired = !!c.expiresAt && c.expiresAt < now;
          const state = !c.isActive ? "Off" : expired ? "Expired" : "Active";
          return (
            <li key={c.code} className="rounded-2xl border border-stone-200 bg-white">
              <details>
                <summary className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 cursor-pointer list-none">
                  <span className="font-mono font-semibold text-stone-900">{c.code}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      state === "Active" ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {state}
                  </span>
                  <span className="text-sm text-stone-600">
                    {c.type === "percent" ? `${c.value}% off` : `${formatPrice(c.value)} off`}
                    {c.minOrder ? ` · min ${formatPrice(c.minOrder)}` : ""}
                    {c.expiresAt ? ` · until ${formatDate(c.expiresAt)}` : ""}
                  </span>
                  {c.allowedEmails.length > 0 && (
                    <span
                      className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-900"
                      title={c.allowedEmails.join(", ")}
                    >
                      {c.allowedEmails.length === 1 ? `Only ${c.allowedEmails[0]}` : `Only ${c.allowedEmails.length} customers`}
                    </span>
                  )}
                  {c.maxUsesPerCustomer && (
                    <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-900">
                      {c.maxUsesPerCustomer === 1 ? "Once per customer" : `${c.maxUsesPerCustomer}× per customer`}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-stone-500">
                    Used {used?._count._all ?? 0}
                    {c.maxUses ? ` of ${c.maxUses}` : "×"}{used?._sum.discount ? ` · ${formatPrice(used._sum.discount)} given` : ""}
                  </span>
                </summary>
                <div className="border-t border-stone-200 px-5 py-5">
                  <CouponForm
                    coupon={{
                      code: c.code,
                      description: c.description,
                      type: c.type,
                      value: c.value,
                      minOrder: c.minOrder,
                      maxDiscount: c.maxDiscount,
                      expiresAt: c.expiresAt ? indianDay(c.expiresAt) : "",
                      isActive: c.isActive,
                      allowedEmails: c.allowedEmails,
                      maxUses: c.maxUses,
                      maxUsesPerCustomer: c.maxUsesPerCustomer,
                    }}
                  />
                  <form action={deleteCoupon} className="mt-4 flex items-center justify-between">
                    <Link
                      href={`/admin/coupons/${c.code}`}
                      className="text-sm text-stone-900 underline underline-offset-4"
                    >
                      Track sales →
                    </Link>
                    <input type="hidden" name="code" value={c.code} />
                    <ConfirmButton
                      message={`Delete ${c.code}? Orders that used it keep the code.`}
                      className="text-sm text-red-700 hover:text-red-800 underline underline-offset-4 cursor-pointer"
                    >
                      Delete coupon
                    </ConfirmButton>
                  </form>
                </div>
              </details>
            </li>
          );
        })}
        {coupons.length === 0 && (
          <li className="rounded-2xl border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-stone-500">No coupons yet.</li>
        )}
      </ul>
    </div>
  );
}

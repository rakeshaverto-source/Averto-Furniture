import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { formatPrice } from "@/data/collections";
import { formatDate, formatDateTime } from "@/lib/admin-format";
import { OPEN_RETURN_STATUSES, RETURN_WINDOW_DAYS, returnReasonLabel, returnStatusInfo } from "@/data/returns";

// Every return customers have asked for. Open ones (still needing the team) come first.
export default async function AdminReturnsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireAdmin("orders");
  const { show } = await searchParams;
  const all = show === "all";
  const returns = await prisma.returnRequest.findMany({
    where: all ? {} : { status: { in: OPEN_RETURN_STATUSES } },
    orderBy: { createdAt: "desc" },
    include: { order: { select: { id: true, ref: true, customerName: true, customerPhone: true, city: true, total: true } } },
  });

  const tab = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm ${active ? "bg-[#1A1A18] text-white" : "border border-stone-300 text-stone-700 hover:border-stone-900"}`;

  return (
    <div className="max-w-5xl">
      <h1 className="font-serif text-3xl text-[#111110]">Returns</h1>
      <p className="mt-1 text-sm text-stone-500">
        Customers can ask to return an order from &ldquo;My account&rdquo; until {RETURN_WINDOW_DAYS} days after delivery. Open one to
        approve it, fix the pickup and record the refund; the customer is emailed at each step.
      </p>

      <div className="mt-5 flex gap-2">
        <Link href="/admin/returns" className={tab(!all)}>
          Open
        </Link>
        <Link href="/admin/returns?show=all" className={tab(all)}>
          All
        </Link>
      </div>

      <ul className="mt-5 space-y-3">
        {returns.map((r) => {
          const info = returnStatusInfo(r.status);
          return (
            <li key={r.id}>
              <Link
                href={`/admin/orders/${r.order.id}#return`}
                className="block rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 hover:border-stone-900 transition-colors"
              >
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-medium text-stone-900">{r.order.ref}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${info.tone}`}>{info.label}</span>
                  <span className="ml-auto text-xs text-stone-500">{formatDateTime(r.createdAt)}</span>
                </span>
                <span className="mt-1.5 block text-sm text-stone-700">
                  {r.order.customerName} · {r.order.city} · {formatPrice(r.order.total)}
                </span>
                <span className="mt-1 block text-sm text-stone-900">
                  {returnReasonLabel(r.reason)}
                  <span className="text-stone-500"> · {r.details.length > 120 ? `${r.details.slice(0, 120)}…` : r.details}</span>
                </span>
                {r.status === "pickup_scheduled" && (r.pickupDate || r.driverName) && (
                  <span className="mt-1 block text-xs text-indigo-800">
                    Pickup {[r.pickupDate && formatDate(r.pickupDate), r.pickupSlot, r.driverName].filter(Boolean).join(" · ")}
                  </span>
                )}
                {r.photos.length > 0 && (
                  <span className="mt-1 block text-xs text-stone-500">
                    {r.photos.length} photo{r.photos.length === 1 ? "" : "s"}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
        {returns.length === 0 && (
          <li className="rounded-2xl border border-dashed border-stone-300 px-4 py-12 text-center text-sm text-stone-500">
            {all ? "No returns yet." : "No open returns."}
          </li>
        )}
      </ul>
    </div>
  );
}

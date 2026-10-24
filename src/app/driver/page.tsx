import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireDriver } from "@/lib/driver-page";
import { DRIVER_STATUSES, toDriverOrder } from "@/lib/driver-orders";
import { formatPrice } from "@/data/collections";
import { formatDate } from "@/lib/admin-format";
import DriverSignOut from "@/components/driver/DriverSignOut";

export default async function DriverHomePage() {
  const driver = await requireDriver();
  const orders = (
    await prisma.order.findMany({
      where: { driverId: driver.id, fulfillment: { in: DRIVER_STATUSES } },
      include: { items: true },
      orderBy: [{ expectedDelivery: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    })
  ).map(toDriverOrder);
  // Returns the office has given this driver to collect
  const pickups = await prisma.returnRequest.findMany({
    where: { driverId: driver.id, status: "pickup_scheduled" },
    include: { order: { select: { ref: true, customerName: true, address: true, locality: true, city: true } } },
    orderBy: [{ pickupDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
  });

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="font-serif text-3xl text-[#111110]">My deliveries</h1>
        <DriverSignOut />
      </div>
      <p className="mt-1 text-stone-500">
        Hello {driver.name.split(" ")[0]}
        {driver.vehicleNumber ? ` · ${driver.vehicleNumber}` : ""}
      </p>

      <ul className="mt-6 space-y-3">
        {orders.map((o) => (
          <li key={o.ref}>
            <Link
              href={`/driver/${o.ref}`}
              className="block rounded-2xl border border-stone-200 bg-white p-4 hover:border-stone-900 transition-colors"
            >
              <span className="flex items-center justify-between">
                <span className="text-sm font-semibold text-stone-500">{o.ref}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    o.status === "out_for_delivery" ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-700"
                  }`}
                >
                  {o.status === "out_for_delivery" ? "On the way" : "Ready"}
                </span>
              </span>
              <span className="mt-1.5 block text-lg font-semibold text-stone-900">{o.customerName}</span>
              <span className="block text-stone-500 line-clamp-2">{o.addressLines.join(", ")}</span>
              {(o.expectedDelivery || o.deliverySlot) && (
                <span className="mt-2 block font-medium text-stone-900">
                  {[o.expectedDelivery && formatDate(new Date(`${o.expectedDelivery}T00:00:00Z`)), o.deliverySlot]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}
              {o.cashToCollect > 0 && (
                <span className="mt-1 block font-bold text-[#C76F35]">Collect {formatPrice(o.cashToCollect)}</span>
              )}
            </Link>
          </li>
        ))}
        {orders.length === 0 && (
          <li className="rounded-2xl border border-dashed border-stone-300 px-4 py-12 text-center text-stone-500">
            No deliveries right now.
            <Link href="/driver" className="mt-2 block font-medium text-stone-900 underline underline-offset-4">
              Refresh
            </Link>
          </li>
        )}
      </ul>

      {pickups.length > 0 && (
        <>
          <h2 className="mt-8 font-serif text-2xl text-[#111110]">Return pickups</h2>
          <ul className="mt-3 space-y-3">
            {pickups.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/driver/pickup/${p.order.ref}`}
                  className="block rounded-2xl border border-indigo-200 bg-white p-4 hover:border-indigo-700 transition-colors"
                >
                  <span className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-stone-500">{p.order.ref}</span>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-800">Pickup</span>
                  </span>
                  <span className="mt-1.5 block text-lg font-semibold text-stone-900">{p.order.customerName}</span>
                  <span className="block text-stone-500 line-clamp-2">
                    {[p.order.address, p.order.locality, p.order.city].filter(Boolean).join(", ")}
                  </span>
                  {(p.pickupDate || p.pickupSlot) && (
                    <span className="mt-2 block font-medium text-stone-900">
                      {[p.pickupDate && formatDate(p.pickupDate), p.pickupSlot].filter(Boolean).join(", ")}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-8 rounded-xl border border-stone-200 p-4 text-sm text-stone-600">
        On this website, your location is shared only while the delivery page is open and the screen is on. For
        sharing with the phone locked, use the Averto Driver app.
      </p>
    </div>
  );
}

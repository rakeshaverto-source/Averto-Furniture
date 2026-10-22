import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireDriver } from "@/lib/driver-page";
import { DRIVER_STATUSES, toDriverOrder } from "@/lib/driver-orders";
import { formatPrice } from "@/data/collections";
import { formatDate } from "@/lib/admin-format";
import DriverOrderActions from "@/components/driver/DriverOrderActions";

export default async function DriverOrderPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const driver = await requireDriver();
  const found = await prisma.order.findFirst({
    where: { ref, driverId: driver.id, fulfillment: { in: DRIVER_STATUSES } },
    include: { items: true },
  });
  if (!found) notFound();
  const order = toDriverOrder(found);
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.mapQuery)}`;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/driver" className="text-stone-500 hover:text-stone-900">
          ← My deliveries
        </Link>
        <h1 className="mt-2 font-serif text-3xl text-[#111110]">{order.ref}</h1>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <p className="text-xl font-semibold text-stone-900">{order.customerName}</p>
        {order.addressLines.map((line) => (
          <p key={line} className="text-stone-800">
            {line}
          </p>
        ))}
        {(order.expectedDelivery || order.deliverySlot) && (
          <p className="mt-3 font-semibold text-[#C76F35]">
            {[order.expectedDelivery && formatDate(new Date(`${order.expectedDelivery}T00:00:00Z`)), order.deliverySlot]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <a
            href={`tel:${order.customerPhone}`}
            className="rounded-xl border border-stone-300 py-3 text-center font-semibold text-stone-900 hover:border-stone-900"
          >
            📞 Call
          </a>
          <a
            href={directions}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-stone-300 py-3 text-center font-semibold text-stone-900 hover:border-stone-900"
          >
            🧭 Navigate
          </a>
        </div>
      </section>

      {order.cashToCollect > 0 && (
        <section className="rounded-2xl bg-amber-50 p-4 text-amber-900">
          <p className="text-sm">Collect from customer</p>
          <p className="text-3xl font-bold">{formatPrice(order.cashToCollect)}</p>
        </section>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">Items</h2>
        <ul className="mt-2 space-y-1 text-stone-900">
          {order.items.map((item, i) => (
            <li key={i}>
              {item.qty} × {item.name}
              {item.colorName ? ` (${item.colorName})` : ""}
            </li>
          ))}
        </ul>
        {order.notes && (
          <>
            <h2 className="mt-4 text-xs font-bold uppercase tracking-wider text-stone-500">Customer note</h2>
            <p className="mt-1 whitespace-pre-line text-stone-900">{order.notes}</p>
          </>
        )}
      </section>

      <DriverOrderActions
        orderRef={order.ref}
        status={order.status as "shipped" | "out_for_delivery"}
        customerName={order.customerName}
        cashToCollect={order.cashToCollect > 0 ? formatPrice(order.cashToCollect) : ""}
      />
    </div>
  );
}

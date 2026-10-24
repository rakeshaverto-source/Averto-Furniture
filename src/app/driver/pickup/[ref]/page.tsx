import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireDriver } from "@/lib/driver-page";
import { toDriverOrder } from "@/lib/driver-orders";
import { formatDate } from "@/lib/admin-format";
import { returnReasonLabel } from "@/data/returns";
import PickupDoneButton from "@/components/driver/PickupDoneButton";

// A return to collect from a customer
export default async function DriverPickupPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const driver = await requireDriver();
  const pickup = await prisma.returnRequest.findFirst({
    where: { driverId: driver.id, status: "pickup_scheduled", order: { ref } },
    include: { order: { include: { items: true } } },
  });
  if (!pickup) notFound();
  const order = toDriverOrder(pickup.order);
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.mapQuery)}`;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/driver" className="text-stone-500 hover:text-stone-900">
          ← My deliveries
        </Link>
        <h1 className="mt-2 font-serif text-3xl text-[#111110]">Pickup {order.ref}</h1>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <p className="text-xl font-semibold text-stone-900">{order.customerName}</p>
        {order.addressLines.map((line) => (
          <p key={line} className="text-stone-800">
            {line}
          </p>
        ))}
        {(pickup.pickupDate || pickup.pickupSlot) && (
          <p className="mt-3 font-semibold text-indigo-800">
            {[pickup.pickupDate && formatDate(pickup.pickupDate), pickup.pickupSlot].filter(Boolean).join(", ")}
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

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">Collect</h2>
        <ul className="mt-2 space-y-1 text-stone-900">
          {order.items.map((item, i) => (
            <li key={i}>
              {item.qty} × {item.name}
              {item.colorName ? ` (${item.colorName})` : ""}
            </li>
          ))}
        </ul>
        <h2 className="mt-4 text-xs font-bold uppercase tracking-wider text-stone-500">Why it&apos;s coming back</h2>
        <p className="mt-1 font-medium text-stone-900">{returnReasonLabel(pickup.reason)}</p>
        <p className="mt-1 whitespace-pre-line text-stone-700">{pickup.details}</p>
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Check the piece and take a photo of it before loading. Don&apos;t give any money to the customer; the
          refund is sent by the office.
        </p>
      </section>

      <PickupDoneButton orderRef={order.ref} customerName={order.customerName} />
    </div>
  );
}

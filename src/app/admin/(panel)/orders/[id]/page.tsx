import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { formatPrice } from "@/data/collections";
import { PAYMENT_LABEL, fulfillmentInfo, formatDate, formatDateTime } from "@/lib/admin-format";
import OrderStatusForm from "@/components/admin/OrderStatusForm";

// wa.me needs the number with country code; Indian numbers are often typed without it
function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits.replace(/^0+/, "");
}

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  const info = fulfillmentInfo(order.fulfillment);
  const balance = order.total - (order.status === "deposit_paid" ? order.deposit : 0);
  const rows: [string, string][] = [
    ["Subtotal", formatPrice(order.subtotal)],
    ...(order.discount > 0 ? [[`Coupon ${order.couponCode ?? ""}`.trim(), `− ${formatPrice(order.discount)}`] as [string, string]] : []),
    ["Total", formatPrice(order.total)],
    [`Advance (${order.depositPercent}%)`, formatPrice(order.deposit)],
  ];

  return (
    <div className="max-w-5xl">
      <Link href="/admin/orders" className="text-sm text-stone-500 hover:text-stone-900">
        ← All orders
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl text-[#111110]">{order.ref}</h1>
        <Link
          href={`/invoice/${order.ref}`}
          target="_blank"
          className="ml-auto rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-900 hover:border-stone-900"
        >
          Invoice ↗
        </Link>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${info.tone}`}>{info.label}</span>
      </div>
      <p className="mt-1 text-sm text-stone-500">Placed {formatDateTime(order.createdAt)}</p>

      <div className="mt-8 grid lg:grid-cols-[1fr_20rem] gap-6 items-start">
        <div className="space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
            <h2 className="px-5 pt-5 font-medium text-stone-900">Items</h2>
            <ul className="mt-3 divide-y divide-stone-100">
              {order.items.map((item) => (
                <li key={item.id} className="px-5 py-3 flex items-start justify-between gap-4 text-sm">
                  <div>
                    {item.productId ? (
                      <Link href={`/admin/products/${item.productId}`} className="text-stone-900 hover:underline underline-offset-4">
                        {item.name}
                      </Link>
                    ) : (
                      <span className="text-stone-900">{item.name}</span>
                    )}
                    <p className="text-xs text-stone-500">
                      {item.colorName ? `${item.colorName} · ` : ""}
                      {item.qty} × {formatPrice(item.unitPrice)}
                    </p>
                  </div>
                  <span className="tabular-nums">{formatPrice(item.qty * item.unitPrice)}</span>
                </li>
              ))}
            </ul>
            <dl className="border-t border-stone-200 px-5 py-4 space-y-1.5 text-sm">
              {rows.map(([label, value]) => (
                <div key={label} className={`flex justify-between ${label === "Total" ? "font-semibold text-stone-900" : "text-stone-600"}`}>
                  <dt>{label}</dt>
                  <dd className="tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 text-sm">
            <h2 className="font-medium text-stone-900">Payment</h2>
            <p className="mt-2 text-stone-700">{PAYMENT_LABEL[order.status]}</p>
            {order.paidAt && <p className="text-xs text-stone-500">Paid {formatDateTime(order.paidAt)}</p>}
            {order.razorpayPaymentId && (
              <p className="mt-1 text-xs text-stone-500 font-mono">Razorpay {order.razorpayPaymentId}</p>
            )}
            <p className="mt-3 text-stone-700">
              {order.balancePaid
                ? `Balance received${order.balancePaidAt ? ` on ${formatDate(order.balancePaidAt)}` : ""}.`
                : `Still to collect: ${formatPrice(balance)}`}
            </p>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 text-sm">
            <h2 className="font-medium text-stone-900">Customer</h2>
            <p className="mt-2 text-stone-900">{order.customerName}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a href={`tel:${order.customerPhone}`} className="rounded-lg border border-stone-200 px-3 py-1.5 hover:border-stone-400">
                Call {order.customerPhone}
              </a>
              <a
                href={`https://wa.me/${whatsappNumber(order.customerPhone)}?text=${encodeURIComponent(`Hello ${order.customerName}, this is Averto about your order ${order.ref}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-stone-200 px-3 py-1.5 hover:border-stone-400"
              >
                WhatsApp
              </a>
              <a href={`mailto:${order.customerEmail}?subject=${encodeURIComponent(`Your Averto order ${order.ref}`)}`} className="rounded-lg border border-stone-200 px-3 py-1.5 hover:border-stone-400 break-all">
                {order.customerEmail}
              </a>
            </div>
            <h3 className="mt-4 text-xs uppercase tracking-wider text-stone-500">Deliver to</h3>
            <p className="mt-1 text-stone-700 whitespace-pre-line">
              {order.address}
              {"\n"}
              {order.city}, {order.state} {order.pincode}
            </p>
            {order.notes && (
              <>
                <h3 className="mt-4 text-xs uppercase tracking-wider text-stone-500">Customer note</h3>
                <p className="mt-1 text-stone-700 whitespace-pre-line">{order.notes}</p>
              </>
            )}
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="font-medium text-stone-900 mb-4">Update</h2>
            <OrderStatusForm
              id={order.id}
              fulfillment={order.fulfillment}
              balancePaid={order.balancePaid}
              adminNote={order.adminNote}
              balanceLabel={`${formatPrice(balance)} after the advance`}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

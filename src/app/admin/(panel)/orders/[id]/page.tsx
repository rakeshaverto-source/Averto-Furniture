import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { formatPrice } from "@/data/collections";
import {
  PAYMENT_LABEL,
  fulfillmentInfo,
  formatDate,
  formatDateTime,
  orderUpdateMessage,
  toDateInput,
  whatsappLink,
} from "@/lib/admin-format";
import OrderStatusForm from "@/components/admin/OrderStatusForm";
import OrderEditForm from "@/components/admin/OrderEditForm";
import ReturnAdminForm from "@/components/admin/ReturnAdminForm";
import LiveDeliveryMap from "@/components/account/LiveDeliveryMap";
import { imageUrl } from "@/lib/catalog";
import { returnReasonLabel, returnStatusInfo } from "@/data/returns";
import { PAYMENT_METHOD_NAME } from "@/data/store";
import { addressLines } from "@/lib/address";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("orders");
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { orderBy: { id: "asc" } }, events: { orderBy: { createdAt: "asc" } }, returnRequest: true },
  });
  if (!order) notFound();
  const ret = order.returnRequest;
  const keepDrivers = [order.driverId, ret?.driverId].filter((d): d is string => !!d);
  const drivers = await prisma.driver.findMany({
    where: { OR: [{ isActive: true }, ...(keepDrivers.length ? [{ id: { in: keepDrivers } }] : [])] },
    select: { id: true, name: true, vehicleNumber: true, isActive: true },
    orderBy: { name: "asc" },
  });

  const info = fulfillmentInfo(order.fulfillment);
  const balance = order.total - (order.status === "deposit_paid" ? order.deposit : 0);
  const balanceOpen = order.balancePaid ? 0 : balance;
  const updateMessage = orderUpdateMessage({ ...order, balanceDue: balanceOpen });
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
          {ret && (
            <section id="return" className="rounded-2xl border-2 border-amber-200 bg-white p-5 text-sm scroll-mt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-medium text-stone-900">Return request</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${returnStatusInfo(ret.status).tone}`}>
                  {returnStatusInfo(ret.status).label}
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-500">Asked {formatDateTime(ret.createdAt)}</p>
              <p className="mt-3 font-medium text-stone-900">{returnReasonLabel(ret.reason)}</p>
              <p className="mt-1 text-stone-700 whitespace-pre-line">{ret.details}</p>
              {ret.photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {ret.photos.map((path) => (
                    <a key={path} href={imageUrl(path)} target="_blank" rel="noopener noreferrer" title="Open full size">
                      {/* eslint-disable-next-line @next/next/no-img-element -- thumbnails of the customer's photos */}
                      <img src={imageUrl(path)} alt="Customer photo" className="h-24 w-24 rounded-lg object-cover border border-stone-200 hover:border-stone-900" />
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-5 border-t border-stone-200 pt-5">
                <ReturnAdminForm
                  key={ret.updatedAt.toISOString()}
                  id={ret.id}
                  status={ret.status}
                  teamMessage={ret.teamMessage}
                  adminNote={ret.adminNote}
                  pickupDate={toDateInput(ret.pickupDate)}
                  pickupSlot={ret.pickupSlot}
                  driverId={ret.driverId}
                  drivers={drivers}
                  refundAmount={ret.refundAmount}
                  orderTotal={formatPrice(order.total)}
                />
              </div>
            </section>
          )}

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
            <p className="mt-2 font-medium text-stone-900">{PAYMENT_METHOD_NAME[order.paymentMethod]}</p>
            <p className="mt-1 text-stone-700">{PAYMENT_LABEL[order.status]}</p>
            {order.paidAt && <p className="text-xs text-stone-500">Paid {formatDateTime(order.paidAt)}</p>}
            {order.razorpayPaymentId && (
              <p className="mt-1 text-xs text-stone-500 font-mono">Razorpay {order.razorpayPaymentId}</p>
            )}
            <p className="mt-3 text-stone-700">
              {order.balancePaid
                ? `Balance received${order.balancePaidAt ? ` on ${formatDate(order.balancePaidAt)}` : ""}.`
                : `Still to collect${order.paymentMethod === "cod" ? " in cash on delivery" : ""}: ${formatPrice(balance)}`}
            </p>
          </section>

          <details className="rounded-2xl border border-stone-200 bg-white p-5 group">
            <summary className="cursor-pointer font-medium text-stone-900 list-none flex justify-between">
              Edit order
              <span className="text-sm font-normal text-stone-500 group-open:hidden">Customer details, items, discount</span>
            </summary>
            <div className="mt-5">
              <OrderEditForm
                order={{
                  id: order.id,
                  customerName: order.customerName,
                  customerPhone: order.customerPhone,
                  address: order.address,
                  locality: order.locality,
                  landmark: order.landmark,
                  city: order.city,
                  tehsil: order.tehsil,
                  state: order.state,
                  pincode: order.pincode,
                  discount: order.discount,
                  depositPercent: order.depositPercent,
                  advancePaid: order.status === "deposit_paid",
                  deposit: order.deposit,
                  items: order.items.map((i) => ({
                    id: i.id,
                    name: i.name,
                    colorName: i.colorName,
                    qty: i.qty,
                    unitPrice: i.unitPrice,
                  })),
                }}
              />
            </div>
          </details>

          {(order.expectedDelivery || order.deliverySlot || order.driverName || order.courierName || order.trackingNumber) && (
            <section className="rounded-2xl border border-stone-200 bg-white p-5 text-sm">
              <h2 className="font-medium text-stone-900">Delivery</h2>
              {(order.expectedDelivery || order.deliverySlot) && (
                <p className="mt-2 text-stone-700">
                  Expected {[order.expectedDelivery && formatDate(order.expectedDelivery), order.deliverySlot].filter(Boolean).join(", ")}
                </p>
              )}
              {(order.driverName || order.driverPhone || order.vehicleNumber) && (
                <p className="mt-1 text-stone-700">
                  Driver: {[order.driverName, order.driverPhone, order.vehicleNumber].filter(Boolean).join(" · ")}
                </p>
              )}
              {(order.courierName || order.trackingNumber) && (
                <p className="mt-1 text-stone-700">
                  {[order.courierName, order.trackingNumber && `#${order.trackingNumber}`].filter(Boolean).join(" · ")}
                </p>
              )}
              {order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block underline underline-offset-4">
                  Tracking link ↗
                </a>
              )}
              {order.fulfillment === "out_for_delivery" && order.driverId && <LiveDeliveryMap orderRef={order.ref} />}
            </section>
          )}
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
                href={whatsappLink(order.customerPhone, `Hello ${order.customerName}, this is Averto about your order ${order.ref}.`)}
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
            <p className="mt-1 text-stone-700 whitespace-pre-line">{addressLines(order, { tehsil: true }).join("\n")}</p>
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
              expectedDelivery={toDateInput(order.expectedDelivery)}
              courierName={order.courierName}
              trackingNumber={order.trackingNumber}
              trackingUrl={order.trackingUrl}
              driverId={order.driverId}
              drivers={drivers}
              deliverySlot={order.deliverySlot}
            />
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 text-sm">
            <h2 className="font-medium text-stone-900">Send the customer an update</h2>
            <p className="mt-1 text-xs text-stone-500">A WhatsApp message for the current status, ready to send. Save changes first.</p>
            <p className="mt-3 rounded-lg bg-stone-50 p-3 text-stone-700 whitespace-pre-line">{updateMessage}</p>
            <a
              href={whatsappLink(order.customerPhone, updateMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-lg bg-[#1A1A18] px-4 py-2 text-white hover:bg-[#3b3732]"
            >
              Open in WhatsApp
            </a>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 text-sm">
            <h2 className="font-medium text-stone-900">History</h2>
            <ol className="mt-3 space-y-2">
              <li className="flex justify-between gap-3">
                <span className="text-stone-900">Placed</span>
                <span className="text-stone-500">{formatDateTime(order.createdAt)}</span>
              </li>
              {order.paidAt && (
                <li className="flex justify-between gap-3">
                  <span className="text-stone-900">Paid online</span>
                  <span className="text-stone-500">{formatDateTime(order.paidAt)}</span>
                </li>
              )}
              {order.events.map((e) => (
                <li key={e.id} className="flex justify-between gap-3">
                  <span className="text-stone-900">{fulfillmentInfo(e.fulfillment).label}</span>
                  <span className="text-stone-500">{formatDateTime(e.createdAt)}</span>
                </li>
              ))}
              {order.balancePaidAt && (
                <li className="flex justify-between gap-3">
                  <span className="text-stone-900">Balance received</span>
                  <span className="text-stone-500">{formatDateTime(order.balancePaidAt)}</span>
                </li>
              )}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

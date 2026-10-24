import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, FileText, Mail, MessageCircle, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { balanceDue, productPhotos } from "@/lib/account";
import { razorpayKeys } from "@/lib/razorpay";
import { formatPrice, WHATSAPP_NUMBER } from "@/data/collections";
import { BUSINESS } from "@/data/business";
import { PAYMENT_METHOD_NAME } from "@/data/store";
import { formatDate, formatDateTime } from "@/lib/admin-format";
import { addressLines } from "@/lib/address";
import OrderTimeline from "@/components/account/OrderTimeline";
import LiveDeliveryMap from "@/components/account/LiveDeliveryMap";
import PayBalanceButton from "@/components/account/PayBalanceButton";
import AccountReviewForm from "@/components/account/AccountReviewForm";
import ReturnRequestForm from "@/components/account/ReturnRequestForm";
import ReturnStatusCard from "@/components/account/ReturnStatusCard";
import { returnDeadline, withinReturnWindow } from "@/data/returns";

export default async function MyOrderPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const customer = await requireCustomer(`/account/orders/${ref}`);
  // Only the customer's own orders
  const order = await prisma.order.findFirst({
    where: { ref, userId: customer.id },
    include: { items: true, events: { orderBy: { createdAt: "asc" } }, returnRequest: true },
  });
  if (!order) notFound();
  // A return can be asked for until a week after delivery
  const deadline = returnDeadline(order);
  const canReturn = !order.returnRequest && withinReturnWindow(deadline);

  const [photos, reviewed] = await Promise.all([
    productPhotos(),
    prisma.review.findMany({ where: { userId: customer.id }, select: { productId: true } }),
  ]);
  const reviewedIds = new Set(reviewed.map((r) => r.productId));
  const delivered = order.fulfillment === "delivered";
  const cancelled = order.fulfillment === "cancelled";
  // The driver's details only matter while the piece is on its way, so they are not shown before or after
  const onTheWay = order.fulfillment === "shipped" || order.fulfillment === "out_for_delivery";
  const showDriver = onTheWay && !!(order.driverName || order.driverPhone || order.vehicleNumber);
  const advancePaid = order.status === "deposit_paid";
  const due = order.balancePaid ? 0 : balanceDue(order);
  const canPayOnline = !!razorpayKeys() && advancePaid && !order.balancePaid && !cancelled;
  const help = `Hello Averto, I have a question about my order ${order.ref}.`;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/account/orders" className="text-sm text-stone-500 hover:text-stone-900">
          ← My orders
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-3xl text-[#111110]">Order {order.ref}</h2>
            <p className="mt-1 text-sm text-stone-500">Placed on {formatDateTime(order.createdAt)}</p>
          </div>
          <Link
            href={`/invoice/${order.ref}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-sm border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-900 hover:border-stone-900 transition-colors"
          >
            <FileText className="w-4 h-4" /> Invoice
          </Link>
        </div>
      </div>

      <section className="rounded-sm bg-white border border-stone-200 p-5 sm:p-7">
        <OrderTimeline
          status={order.fulfillment}
          // the latest time each step was reached; "Order placed" is when the order came in
          dates={{ new: order.createdAt, ...Object.fromEntries(order.events.map((e) => [e.fulfillment, e.createdAt])) }}
        />
        {!cancelled && !delivered && (order.expectedDelivery || order.deliverySlot || showDriver || order.courierName || order.trackingNumber) && (
          <div className="mt-6 border-t border-stone-200 pt-5 flex flex-wrap gap-x-10 gap-y-3 text-sm justify-center text-center">
            {(order.expectedDelivery || order.deliverySlot) && (
              <p>
                <span className="block text-xs uppercase tracking-wider text-stone-500">Expected delivery</span>
                <span className="text-stone-900 font-medium">
                  {[order.expectedDelivery && formatDate(order.expectedDelivery), order.deliverySlot].filter(Boolean).join(", ")}
                </span>
              </p>
            )}
            {showDriver && (
              <p>
                <span className="block text-xs uppercase tracking-wider text-stone-500">Delivered by</span>
                <span className="text-stone-900">{[order.driverName, order.vehicleNumber].filter(Boolean).join(" · ")}</span>
              </p>
            )}
            {showDriver && order.driverPhone && (
              <a
                href={`tel:${order.driverPhone.replace(/[\s-]/g, "")}`}
                className="self-center inline-flex items-center gap-2 rounded-sm bg-[#111110] px-4 py-2 font-medium text-white hover:bg-stone-800"
              >
                <Phone className="w-4 h-4" /> Call driver
              </a>
            )}
            {(order.courierName || order.trackingNumber) && (
              <p>
                <span className="block text-xs uppercase tracking-wider text-stone-500">Shipped with</span>
                <span className="text-stone-900">
                  {[order.courierName, order.trackingNumber && `Tracking no. ${order.trackingNumber}`].filter(Boolean).join(" · ")}
                </span>
              </p>
            )}
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="self-center rounded-sm border border-stone-300 px-4 py-2 font-medium text-stone-900 hover:border-stone-900"
              >
                Track your order ↗
              </a>
            )}
          </div>
        )}
        {order.fulfillment === "out_for_delivery" && (order.driverId || order.pickupLat !== null) && (
          <LiveDeliveryMap orderRef={order.ref} driverPhone={order.driverPhone || undefined} />
        )}
      </section>

      {order.returnRequest && <ReturnStatusCard orderRef={order.ref} request={order.returnRequest} />}
      {canReturn && deadline && <ReturnRequestForm orderRef={order.ref} deadline={formatDateTime(deadline)} />}

      <div className="grid xl:grid-cols-[1fr_20rem] gap-6 items-start">
        <section className="rounded-sm bg-white border border-stone-200">
          <h3 className="px-5 sm:px-6 pt-5 font-medium text-stone-900">Pieces</h3>
          <ul className="mt-2 divide-y divide-stone-100">
            {order.items.map((item) => {
              const photo = item.productId ? photos.get(item.productId) : undefined;
              const canReview = delivered && item.productId && photo && !reviewedIds.has(item.productId);
              return (
                <li key={item.id} className="flex gap-4 px-5 sm:px-6 py-4">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-stone-100">
                    {photo && (
                      <Image src={photo.image} alt="" fill sizes="64px" className={`object-cover ${photo.zoomClass ?? ""}`} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3">
                      <div>
                        {photo && item.productId ? (
                          <Link href={`/products/${item.productId}`} className="font-medium text-stone-900 hover:underline underline-offset-4">
                            {item.name}
                          </Link>
                        ) : (
                          <p className="font-medium text-stone-900">{item.name}</p>
                        )}
                        <p className="text-sm text-stone-500">
                          {item.colorName ? `${item.colorName} · ` : ""}Qty {item.qty}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-stone-900 tabular-nums whitespace-nowrap">
                        {formatPrice(item.qty * item.unitPrice)}
                      </p>
                    </div>
                    {canReview && <AccountReviewForm productId={item.productId!} productName={item.name} />}
                    {delivered && item.productId && reviewedIds.has(item.productId) && (
                      <p className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-800">
                        <BadgeCheck className="w-3.5 h-3.5" /> You reviewed this
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <dl className="border-t border-stone-200 px-5 sm:px-6 py-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-stone-600">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-800">
                <dt>Coupon {order.couponCode}</dt>
                <dd className="tabular-nums">− {formatPrice(order.discount)}</dd>
              </div>
            )}
            {order.gst > 0 && (
              <div className="flex justify-between text-stone-600">
                <dt>GST ({order.gstPercent}%)</dt>
                <dd className="tabular-nums">{formatPrice(order.gst)}</dd>
              </div>
            )}
            <div className="flex justify-between pt-1.5 font-semibold text-stone-900">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(order.total)}</dd>
            </div>
            {order.gst === 0 && BUSINESS.pricesIncludeGst && <p className="text-xs text-stone-500">Prices include GST.</p>}
          </dl>
        </section>

        <div className="space-y-6">
          <section className="rounded-sm bg-white border border-stone-200 p-5 text-sm">
            <h3 className="font-medium text-stone-900">Payment</h3>
            <dl className="mt-3 space-y-2">
              <div className="flex justify-between gap-3">
                <dt className="text-stone-600">Method</dt>
                <dd className="text-stone-900 text-right">{PAYMENT_METHOD_NAME[order.paymentMethod]}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-stone-600">
                  {order.paymentMethod === "full" ? "Online payment" : `Advance (${order.depositPercent}%)`}
                </dt>
                <dd className={advancePaid ? "text-emerald-800" : "text-stone-500"}>
                  {advancePaid ? `Paid ${formatPrice(order.deposit)}` : formatPrice(order.deposit)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-stone-600">{order.paymentMethod === "cod" ? "Cash on delivery" : "Balance"}</dt>
                <dd className={order.balancePaid ? "text-emerald-800" : "text-stone-900 font-medium"}>
                  {order.balancePaid
                    ? `Paid${order.balancePaidAt ? ` on ${formatDate(order.balancePaidAt)}` : ""}`
                    : cancelled
                      ? "—"
                      : formatPrice(due)}
                </dd>
              </div>
            </dl>
            {canPayOnline ? (
              <div className="mt-4">
                <PayBalanceButton
                  orderRef={order.ref}
                  label={`Pay balance ${formatPrice(due)}`}
                  prefill={{ name: order.customerName, email: order.customerEmail, contact: order.customerPhone }}
                />
              </div>
            ) : (
              !order.balancePaid &&
              !cancelled && (
                <p className="mt-3 text-xs text-stone-500">
                  {advancePaid
                    ? order.paymentMethod === "cod"
                      ? "Please keep this amount ready in cash for the day of delivery."
                      : "You can pay the balance before delivery. Our team will share the details."
                    : "Our team will call you to arrange the advance and confirm your order."}
                </p>
              )
            )}
          </section>

          <section className="rounded-sm bg-white border border-stone-200 p-5 text-sm">
            <h3 className="font-medium text-stone-900">Delivering to</h3>
            <p className="mt-2 text-stone-900">{order.customerName}</p>
            <p className="text-stone-600 whitespace-pre-line">{addressLines(order).join("\n")}</p>
            <p className="mt-1 text-stone-500">{order.customerPhone}</p>
          </section>

          <section className="rounded-sm bg-[#111110] text-white p-5 text-sm">
            <h3 className="font-medium">Need help with this order?</h3>
            <p className="mt-1 text-white/70">We usually reply within a few hours.</p>
            <div className="mt-4 grid gap-2">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(help)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm bg-white/10 hover:bg-white/15 px-4 py-2.5 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp us
              </a>
              <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 rounded-sm bg-white/10 hover:bg-white/15 px-4 py-2.5 transition-colors">
                <Phone className="w-4 h-4" /> {BUSINESS.phone}
              </a>
              <a
                href={`mailto:${BUSINESS.email}?subject=${encodeURIComponent(`Order ${order.ref}`)}`}
                className="inline-flex items-center gap-2 rounded-sm bg-white/10 hover:bg-white/15 px-4 py-2.5 transition-colors"
              >
                <Mail className="w-4 h-4" /> {BUSINESS.email}
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

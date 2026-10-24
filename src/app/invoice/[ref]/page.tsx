import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/customer-auth";
import { getAdminFor } from "@/lib/admin-auth";
import { formatPrice } from "@/data/collections";
import { BUSINESS } from "@/data/business";
import { PAYMENT_METHOD_NAME } from "@/data/store";
import { formatDate } from "@/lib/admin-format";
import { addressLines } from "@/lib/address";
import PrintButton from "@/components/account/PrintButton";

export const metadata: Metadata = {
  title: "Invoice | Averto",
  robots: { index: false, follow: false },
};

// Printable invoice. The customer who placed the order, or the admin, can open it.
// PLACEHOLDER layout: confirm the GST invoice format (HSN codes, tax split) with your CA before launch.
export default async function InvoicePage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const [customer, admin] = await Promise.all([getCustomer(), getAdminFor("orders")]);
  if (!customer && !admin) redirect(`/login?next=${encodeURIComponent(`/invoice/${ref}`)}`);

  const order = await prisma.order.findFirst({
    where: admin ? { ref } : { ref, userId: customer!.id },
    include: { items: true },
  });
  if (!order) notFound();
  const paid = (order.status === "deposit_paid" ? order.deposit : 0) + (order.balancePaid ? order.total - (order.status === "deposit_paid" ? order.deposit : 0) : 0);

  return (
    <main className="min-h-screen bg-stone-100 print:bg-white py-10 px-4 print:p-0">
      <div className="mx-auto max-w-3xl flex justify-end mb-4 print:hidden">
        <PrintButton />
      </div>
      <article className="mx-auto max-w-3xl bg-white p-8 sm:p-12 shadow-sm print:shadow-none print:max-w-none text-sm text-stone-800">
        <header className="flex flex-wrap justify-between gap-6 border-b border-stone-200 pb-6">
          <div>
            <p className="font-serif text-3xl text-[#111110]">Averto</p>
            <p className="mt-2 text-stone-600">{BUSINESS.legalName}</p>
            <p className="text-stone-600 max-w-xs">{BUSINESS.address}</p>
            <p className="text-stone-600">GSTIN: {BUSINESS.gstin}</p>
            <p className="text-stone-600">
              {BUSINESS.email} · {BUSINESS.phone}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Invoice</p>
            <p className="mt-1 text-lg font-semibold text-stone-900">{order.ref}</p>
            <p className="text-stone-600">Date: {formatDate(order.createdAt)}</p>
            {order.fulfillment === "cancelled" && <p className="mt-1 font-semibold text-red-700">CANCELLED</p>}
          </div>
        </header>

        <section className="grid sm:grid-cols-2 gap-6 py-6 border-b border-stone-200">
          <div>
            <p className="text-xs uppercase tracking-wider text-stone-500">Billed and delivered to</p>
            <p className="mt-1 font-medium text-stone-900">{order.customerName}</p>
            <p className="whitespace-pre-line text-stone-600">{addressLines(order).join("\n")}</p>
            <p className="text-stone-600">
              {order.customerPhone} · {order.customerEmail}
            </p>
          </div>
        </section>

        <table className="w-full mt-6">
          <thead>
            <tr className="border-b border-stone-300 text-left text-xs uppercase tracking-wider text-stone-500">
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 font-medium text-right">Qty</th>
              <th className="py-2 font-medium text-right">Price</th>
              <th className="py-2 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-stone-100">
                <td className="py-2.5 pr-3">
                  {item.name}
                  {item.colorName && <span className="block text-xs text-stone-500">{item.colorName}</span>}
                </td>
                <td className="py-2.5 text-right tabular-nums">{item.qty}</td>
                <td className="py-2.5 text-right tabular-nums">{formatPrice(item.unitPrice)}</td>
                <td className="py-2.5 text-right tabular-nums">{formatPrice(item.qty * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto mt-6 w-full max-w-xs space-y-1.5">
          <div className="flex justify-between">
            <dt className="text-stone-600">Subtotal</dt>
            <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-stone-600">Discount ({order.couponCode})</dt>
              <dd className="tabular-nums">− {formatPrice(order.discount)}</dd>
            </div>
          )}
          {order.gst > 0 && (
            <>
              <div className="flex justify-between">
                <dt className="text-stone-600">Taxable value</dt>
                <dd className="tabular-nums">{formatPrice(order.subtotal - order.discount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-600">GST ({order.gstPercent}%)</dt>
                <dd className="tabular-nums">{formatPrice(order.gst)}</dd>
              </div>
            </>
          )}
          <div className="flex justify-between border-t border-stone-300 pt-2 text-base font-semibold text-stone-900">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatPrice(order.total)}</dd>
          </div>
          <div className="flex justify-between text-stone-600">
            <dt>Payment method</dt>
            <dd>{PAYMENT_METHOD_NAME[order.paymentMethod]}</dd>
          </div>
          <div className="flex justify-between text-stone-600">
            <dt>Paid</dt>
            <dd className="tabular-nums">{formatPrice(paid)}</dd>
          </div>
          <div className="flex justify-between font-medium text-stone-900">
            <dt>Balance due</dt>
            <dd className="tabular-nums">{formatPrice(order.fulfillment === "cancelled" ? 0 : order.total - paid)}</dd>
          </div>
        </dl>

        <footer className="mt-10 border-t border-stone-200 pt-4 text-xs text-stone-500">
          {/* Orders from before GST was added on top had it inside the prices */}
          {order.gst > 0 ? "" : BUSINESS.pricesIncludeGst ? "All prices include GST. " : ""}This is a computer-generated invoice and needs no
          signature.
        </footer>
      </article>
    </main>
  );
}

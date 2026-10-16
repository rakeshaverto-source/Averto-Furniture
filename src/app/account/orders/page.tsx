import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { productPhotos } from "@/lib/account";
import OrderCard from "@/components/account/OrderCard";

export default async function MyOrdersPage() {
  const customer = await requireCustomer("/account/orders");
  const [orders, photos] = await Promise.all([
    prisma.order.findMany({
      where: { userId: customer.id },
      orderBy: { createdAt: "desc" },
      include: { items: { select: { id: true, name: true, qty: true, productId: true } } },
    }),
    productPhotos(),
  ]);
  const active = orders.filter((o) => o.fulfillment !== "delivered" && o.fulfillment !== "cancelled");
  const past = orders.filter((o) => o.fulfillment === "delivered" || o.fulfillment === "cancelled");
  const card = (o: (typeof orders)[number]) => (
    <OrderCard
      key={o.id}
      order={{ ...o, items: o.items.map((i) => ({ ...i, image: i.productId ? photos.get(i.productId)?.image : undefined })) }}
    />
  );

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-serif text-3xl text-[#111110]">My orders</h2>
        <p className="mt-1 text-sm text-stone-500">Open an order to see every step, its invoice, and to get help.</p>
      </div>

      {orders.length === 0 && (
        <div className="rounded-sm border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center">
          <p className="font-serif text-xl text-stone-900">No orders yet</p>
          <Link href="/collections" className="inline-block mt-5 px-7 py-3 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] text-white text-sm font-medium transition-colors">
            Explore collections
          </Link>
        </div>
      )}

      {active.length > 0 && (
        <section>
          <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-stone-900">In progress</h3>
          <div className="mt-4 grid gap-4">{active.map(card)}</div>
        </section>
      )}
      {past.length > 0 && (
        <section>
          <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-stone-900">Past orders</h3>
          <div className="mt-4 grid gap-4">{past.map(card)}</div>
        </section>
      )}
    </div>
  );
}

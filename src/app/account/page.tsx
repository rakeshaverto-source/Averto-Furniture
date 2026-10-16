import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { accountSummary, productPhotos } from "@/lib/account";
import OrderCard from "@/components/account/OrderCard";
import OrderTimeline from "@/components/account/OrderTimeline";

export default async function AccountOverview({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  const customer = await requireCustomer("/account");
  const { password } = await searchParams;
  const [summary, recent, photos] = await Promise.all([
    accountSummary(customer.id, customer.email),
    prisma.order.findMany({
      where: { userId: customer.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { items: { select: { id: true, name: true, qty: true, productId: true } } },
    }),
    productPhotos(),
  ]);
  const live = recent.find((o) => o.fulfillment !== "delivered" && o.fulfillment !== "cancelled");

  const tiles = [
    { label: "Orders", value: summary.orders, href: "/account/orders" },
    { label: "In progress", value: summary.active, href: "/account/orders" },
    { label: "Saved pieces", value: summary.saved, href: "/account/wishlist" },
    { label: "Coupons for you", value: summary.coupons, href: "/account/coupons" },
  ];

  return (
    <div className="space-y-8">
      {password && (
        <p role="status" className="rounded-sm bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900">
          Your password has been changed.
        </p>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {tiles.map(({ label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-sm border border-stone-200 bg-white p-4 sm:p-5 transition-colors hover:border-stone-400"
          >
            <p className="font-serif text-4xl text-stone-900">{value}</p>
            <p className="text-sm text-stone-500">{label}</p>
          </Link>
        ))}
      </div>

      {live && (
        <section className="rounded-sm bg-white border border-stone-200 p-5 sm:p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-serif text-2xl text-[#111110]">Your latest order</h2>
            <Link href={`/account/orders/${live.ref}`} className="text-sm text-stone-700 underline underline-offset-4">
              {live.ref} details
            </Link>
          </div>
          <div className="mt-6">
            <OrderTimeline status={live.fulfillment} />
          </div>
        </section>
      )}

      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-2xl text-[#111110]">Recent orders</h2>
          {summary.orders > 3 && (
            <Link href="/account/orders" className="text-sm text-stone-700 underline underline-offset-4">
              See all
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <div className="mt-4 rounded-sm border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center">
            <p className="font-serif text-xl text-stone-900">No orders yet</p>
            <p className="mt-1 text-sm text-stone-500">When you order a piece, you can follow it here, from workshop to your home.</p>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 mt-6 px-7 py-3 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] text-white text-sm font-medium transition-colors"
            >
              Explore collections <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            {recent.map((o) => (
              <OrderCard
                key={o.id}
                order={{
                  ...o,
                  items: o.items.map((i) => ({ ...i, image: i.productId ? photos.get(i.productId)?.image : undefined })),
                }}
              />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

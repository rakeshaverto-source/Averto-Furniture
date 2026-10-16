import Link from "next/link";
import { TicketPercent } from "lucide-react";
import { requireCustomer } from "@/lib/customer-auth";
import { couponsFor } from "@/lib/account";
import { formatPrice } from "@/data/collections";
import { formatDate } from "@/lib/admin-format";
import CopyCode from "@/components/account/CopyCode";

export default async function MyCouponsPage() {
  const customer = await requireCustomer("/account/coupons");
  const coupons = await couponsFor(customer.email);

  return (
    <div>
      <h2 className="font-serif text-3xl text-[#111110]">My coupons</h2>
      <p className="mt-1 text-sm text-stone-500">Offers made just for you. Copy a code and add it in your cart.</p>

      {coupons.length === 0 ? (
        <div className="mt-6 rounded-sm border border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center">
          <TicketPercent className="mx-auto w-8 h-8 text-stone-300" strokeWidth={1.4} />
          <p className="mt-3 font-serif text-xl text-stone-900">No coupons right now</p>
          <p className="mt-1 text-sm text-stone-500">Personal offers we send you will appear here.</p>
        </div>
      ) : (
        <ul className="mt-6 grid sm:grid-cols-2 gap-4">
          {coupons.map((c) => (
            <li key={c.code} className="relative overflow-hidden rounded-sm border border-stone-200 bg-white">
              {/* ticket look: a coloured stub on the left */}
              <div className="flex">
                <div className="flex w-24 shrink-0 flex-col items-center justify-center bg-stone-100 px-2 py-5 text-center border-r border-dashed border-stone-300">
                  <span className="font-serif text-2xl leading-none text-stone-900">
                    {c.type === "percent" ? `${c.value}%` : formatPrice(c.value)}
                  </span>
                  <span className="mt-1 text-xs text-stone-500">off</span>
                </div>
                <div className="min-w-0 flex-1 p-4">
                  <p className="font-medium text-stone-900">{c.description}</p>
                  <ul className="mt-1.5 space-y-0.5 text-xs text-stone-500">
                    {c.minOrder ? <li>On orders over {formatPrice(c.minOrder)}</li> : null}
                    {c.maxDiscount ? <li>Up to {formatPrice(c.maxDiscount)} off</li> : null}
                    {c.left !== null && <li>{c.left === 1 ? "Can be used once more" : `Can be used ${c.left} more times`}</li>}
                    {c.expiresAt && <li>Valid until {formatDate(c.expiresAt)}</li>}
                  </ul>
                  <div className="mt-3">
                    <CopyCode code={c.code} />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-sm text-stone-500">
        Ready to use one?{" "}
        <Link href="/collections" className="text-stone-900 underline underline-offset-4">
          Browse the collections
        </Link>
      </p>
    </div>
  );
}

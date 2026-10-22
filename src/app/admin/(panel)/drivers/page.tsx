import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { formatDateTime } from "@/lib/admin-format";
import { signOutDriver } from "@/app/admin/store-actions";
import { DRIVER_STATUSES } from "@/lib/driver-orders";
import DriverForm from "@/components/admin/DriverForm";
import ConfirmButton from "@/components/admin/ConfirmButton";

export default async function AdminDriversPage() {
  await requireAdmin("drivers");
  const drivers = await prisma.driver.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      sessions: { orderBy: { lastUsedAt: "desc" }, take: 1, select: { lastUsedAt: true } },
      _count: { select: { sessions: true } },
      orders: { where: { fulfillment: { in: DRIVER_STATUSES } }, select: { ref: true, id: true, fulfillment: true } },
    },
  });
  const now = new Date();

  return (
    <div className="max-w-4xl">
      <h1 className="font-serif text-3xl text-[#111110]">Drivers</h1>
      <p className="mt-1 text-sm text-stone-500">
        Our own delivery staff. They sign in to the Averto driver app with their mobile number and PIN, and see the orders
        you assign to them once those are Dispatched. Without the app, they can sign in on the website at{" "}
        <Link href="/driver" target="_blank" className="underline underline-offset-4">
          /driver
        </Link>{" "}
        (location is shared there only while the page is open).
      </p>

      <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="font-medium text-stone-900 mb-4">New driver</h2>
        <DriverForm />
      </section>

      <ul className="mt-6 space-y-3">
        {drivers.map((d) => {
          const locked = !!d.lockedUntil && d.lockedUntil > now;
          return (
            <li key={d.id} className="rounded-2xl border border-stone-200 bg-white">
              <details>
                <summary className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 cursor-pointer list-none">
                  <span className="font-medium text-stone-900">{d.name}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      d.isActive ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {d.isActive ? "Active" : "Off"}
                  </span>
                  {locked && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                      Locked after wrong PINs
                    </span>
                  )}
                  <span className="text-sm text-stone-600">
                    {d.phone}
                    {d.vehicleNumber ? ` · ${d.vehicleNumber}` : ""}
                  </span>
                  <span className="ml-auto text-xs text-stone-500">
                    {d._count.sessions > 0
                      ? `Signed in · last seen ${formatDateTime(d.sessions[0].lastUsedAt)}`
                      : "Not signed in"}
                  </span>
                </summary>
                <div className="border-t border-stone-200 px-5 py-5 space-y-5">
                  {d.orders.length > 0 && (
                    <p className="text-sm text-stone-700">
                      On the road with:{" "}
                      {d.orders.map((o, i) => (
                        <span key={o.id}>
                          {i > 0 && ", "}
                          <Link href={`/admin/orders/${o.id}`} className="underline underline-offset-4">
                            {o.ref}
                          </Link>
                          {o.fulfillment === "out_for_delivery" ? " (out for delivery)" : ""}
                        </span>
                      ))}
                    </p>
                  )}
                  <DriverForm
                    driver={{ id: d.id, name: d.name, phone: d.phone, vehicleNumber: d.vehicleNumber, isActive: d.isActive }}
                  />
                  {d._count.sessions > 0 && (
                    <form action={signOutDriver} className="border-t border-stone-100 pt-4">
                      <input type="hidden" name="id" value={d.id} />
                      <ConfirmButton
                        message={`Sign ${d.name} out of the driver app? They can sign in again with their PIN.`}
                        className="text-sm text-red-700 hover:text-red-800 underline underline-offset-4 cursor-pointer"
                      >
                        Sign out of the app{d._count.sessions > 1 ? ` on all ${d._count.sessions} phones` : ""}
                      </ConfirmButton>
                    </form>
                  )}
                </div>
              </details>
            </li>
          );
        })}
        {drivers.length === 0 && (
          <li className="rounded-2xl border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-stone-500">
            No drivers yet.
          </li>
        )}
      </ul>
    </div>
  );
}

import { MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";
import { deleteAddress, setDefaultAddress } from "@/app/actions/account-data";
import AddressForm from "@/components/account/AddressForm";
import { addressLines } from "@/lib/address";
import ConfirmButton from "@/components/admin/ConfirmButton";

export default async function AddressesPage() {
  const customer = await requireCustomer("/account/addresses");
  const addresses = await prisma.address.findMany({
    where: { userId: customer.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl text-[#111110]">Addresses</h2>
        <p className="mt-1 text-sm text-stone-500">Your default address is filled in at checkout. New addresses are also saved when you order.</p>
      </div>

      {addresses.length > 0 && (
        <ul className="grid sm:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <li
              key={a.id}
              className={`rounded-sm border bg-white p-5 ${a.isDefault ? "border-stone-900" : "border-stone-200"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 font-medium text-stone-900">
                  <MapPin className="w-4 h-4 text-stone-400" strokeWidth={1.6} />
                  {a.label || "Address"}
                </p>
                {a.isDefault && (
                  <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-800">Default</span>
                )}
              </div>
              <p className="mt-3 text-sm text-stone-900">{a.name}</p>
              <p className="text-sm text-stone-600">
                {addressLines(a).join(", ")}
              </p>
              <p className="text-sm text-stone-500">{a.phone}</p>

              <details className="mt-4 group">
                <summary className="inline-block cursor-pointer text-sm text-stone-900 underline underline-offset-4 list-none">Edit</summary>
                <div className="mt-4">
                  <AddressForm address={a} />
                </div>
              </details>
              <div className="mt-3 flex items-center gap-4 text-sm">
                {!a.isDefault && (
                  <form action={setDefaultAddress}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="text-stone-700 hover:text-stone-900 underline underline-offset-4 cursor-pointer">
                      Make default
                    </button>
                  </form>
                )}
                <form action={deleteAddress} className="ml-auto">
                  <input type="hidden" name="id" value={a.id} />
                  <ConfirmButton message="Delete this address?" className="text-red-700 hover:text-red-800 cursor-pointer">
                    Delete
                  </ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-sm border border-stone-200 bg-white p-5 sm:p-6">
        <h3 className="font-medium text-stone-900 mb-4">{addresses.length ? "Add another address" : "Add an address"}</h3>
        <AddressForm address={{ label: "", name: customer.name, phone: customer.phone, address: "", city: "", state: "", pincode: "" }} />
      </section>
    </div>
  );
}

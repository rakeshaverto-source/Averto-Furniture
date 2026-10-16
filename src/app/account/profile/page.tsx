import Link from "next/link";
import { KeyRound } from "lucide-react";
import { requireCustomer } from "@/lib/customer-auth";
import { DeleteAccountForm, ProfileForm } from "@/components/account/ProfileForms";

export default async function ProfilePage() {
  const customer = await requireCustomer("/account/profile");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl text-[#111110]">Profile</h2>
        <p className="mt-1 text-sm text-stone-500">Used to fill in your details at checkout.</p>
      </div>

      <section className="rounded-sm border border-stone-200 bg-white p-5 sm:p-6">
        <h3 className="font-medium text-stone-900 mb-4">Your details</h3>
        <ProfileForm name={customer.name} phone={customer.phone} email={customer.email} />
      </section>

      <section className="rounded-sm border border-stone-200 bg-white p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-medium text-stone-900">Password</h3>
          <p className="text-sm text-stone-500">Choose a new password for logging in.</p>
        </div>
        <Link
          href="/account/password"
          className="inline-flex items-center gap-2 rounded-sm border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-900 hover:border-stone-900 transition-colors"
        >
          <KeyRound className="w-4 h-4" /> Change password
        </Link>
      </section>

      <section className="rounded-sm border border-red-200 bg-white p-5 sm:p-6">
        <h3 className="font-medium text-red-800">Delete account</h3>
        <p className="mt-1 mb-4 text-sm text-stone-600">
          This removes your login, saved addresses, wishlist and reviews for good. Past orders are kept without your
          account, as we need them for accounts and warranty.
        </p>
        <DeleteAccountForm />
      </section>
    </div>
  );
}

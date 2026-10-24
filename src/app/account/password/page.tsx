import Link from "next/link";
import { ChangePasswordForm } from "@/components/auth/PasswordForms";
import { requireCustomer } from "@/lib/customer-auth";

// Reached from the profile page; the change needs a code from the account's email
export default async function NewPasswordPage() {
  const customer = await requireCustomer("/account/password");
  return (
    <div className="max-w-md">
      <Link href="/account/profile" className="text-sm text-stone-500 hover:text-stone-900">
        ← Profile
      </Link>
      <h2 className="mt-2 font-serif text-3xl text-[#111110]">New password</h2>
      <p className="mt-1 text-sm text-stone-500">For {customer.email}</p>
      <ChangePasswordForm email={customer.email} />
    </div>
  );
}

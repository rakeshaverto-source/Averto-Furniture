import Link from "next/link";
import { KeyRound } from "lucide-react";
import { initials, requireCustomer } from "@/lib/customer-auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  AvatarForm,
  DeleteAccountForm,
  ProfileForm,
  SessionList,
  SignOutEverywhereButton,
  type SessionRow,
} from "@/components/account/ProfileForms";
import { listSessions } from "@/lib/sessions";

const dateTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const fmt = (value?: string | null) => (value ? dateTime.format(new Date(value)) : "—");

export default async function ProfilePage() {
  const customer = await requireCustomer("/account/profile");
  // Sign-up and last-login times are not in the session token, so ask Supabase for them
  const [{ data }, logins] = await Promise.all([
    createSupabaseServer().then((supabase) => supabase.auth.getUser()),
    listSessions(customer.id),
  ]);
  // This device first, then the most recently used
  const sessions: SessionRow[] = logins
    .map((s) => ({
      id: s.id,
      device: s.device,
      mobile: s.mobile,
      current: s.id === customer.sessionId,
      signedIn: dateTime.format(s.signedInAt),
      lastActive: dateTime.format(s.lastActiveAt),
    }))
    .sort((a, b) => Number(b.current) - Number(a.current));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl text-[#111110]">Profile</h2>
        <p className="mt-1 text-sm text-stone-500">Used to fill in your details at checkout.</p>
      </div>

      <section className="rounded-sm border border-stone-200 bg-white p-5 sm:p-6">
        <h3 className="font-medium text-stone-900 mb-4">Profile photo</h3>
        <AvatarForm avatar={customer.avatar} initials={initials(customer)} />
      </section>

      <section className="rounded-sm border border-stone-200 bg-white p-5 sm:p-6">
        <h3 className="font-medium text-stone-900 mb-4">Your details</h3>
        <ProfileForm
          name={customer.name}
          phone={customer.phone}
          email={customer.email}
          whatsapp={customer.whatsapp}
          birthday={customer.birthday}
          contactPref={customer.contactPref}
        />
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

      <section className="rounded-sm border border-stone-200 bg-white p-5 sm:p-6">
        <h3 className="font-medium text-stone-900">Login and security</h3>
        <dl className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-stone-500">Member since</dt>
            <dd className="text-stone-900">{fmt(data.user?.created_at)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Last login</dt>
            <dd className="text-stone-900">{fmt(data.user?.last_sign_in_at)}</dd>
          </div>
        </dl>
        <div className="mt-5 pt-5 border-t border-stone-100">
          <h4 className="text-sm font-medium text-stone-900">Where you&apos;re logged in</h4>
          <p className="mt-0.5 mb-3 text-sm text-stone-500">Don&apos;t recognise a device? Remove it and change your password.</p>
          <SessionList sessions={sessions} />
        </div>
        <div className="mt-5 pt-5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-stone-500 max-w-md">
            Lost a phone or used a shared computer? Log out everywhere, including this device.
          </p>
          <SignOutEverywhereButton />
        </div>
      </section>

      <section className="rounded-sm border border-red-200 bg-white p-5 sm:p-6">
        <h3 className="font-medium text-red-800">Delete account</h3>
        <p className="mt-1 mb-4 text-sm text-stone-600">
          This removes your login, saved addresses, wishlist, reviews and profile photo for good. Past orders are kept
          without your account, as we need them for accounts and warranty.
        </p>
        <DeleteAccountForm />
      </section>
    </div>
  );
}

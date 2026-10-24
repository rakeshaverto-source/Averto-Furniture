import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AccountNav from "@/components/account/AccountNav";
import Image from "next/image";
import { displayName, getCustomer, initials } from "@/lib/customer-auth";
import { accountSummary } from "@/lib/account";

export const metadata: Metadata = {
  title: "My account | Averto",
  robots: { index: false, follow: false },
};

// Shell for every "My account" page. Each page checks the customer itself (requireCustomer),
// because a layout doesn't re-run on every navigation.
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCustomer();
  const summary = customer ? await accountSummary(customer.id, customer.email) : null;
  const name = customer ? displayName(customer) : "";

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <Navbar />
      <section className="flex-1 px-4 sm:px-10 pt-6 sm:pt-14 pb-16 sm:pb-20">
        <div className="max-w-6xl mx-auto">
          {customer && (
            <header className="flex items-center gap-4 sm:gap-5">
              <span className="relative h-12 w-12 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-full bg-[#111110] text-white font-serif text-lg sm:text-2xl flex items-center justify-center">
                {customer.avatar ? (
                  <Image src={customer.avatar} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  initials(customer) || "A"
                )}
              </span>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">My account</p>
                <h1 className="font-serif text-2xl sm:text-4xl text-[#111110] truncate">Hello, {name.split(" ")[0]}</h1>
                <p className="text-sm text-stone-500 truncate">{customer.email}</p>
              </div>
            </header>
          )}

          <div className="mt-6 sm:mt-10 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[15rem_minmax(0,1fr)] gap-6 lg:gap-10 items-start">
            {customer && (
              <AccountNav
                counts={{
                  "/account/orders": summary?.active ?? 0,
                  "/account/wishlist": summary?.saved ?? 0,
                  "/account/coupons": summary?.coupons ?? 0,
                }}
              />
            )}
            <div className="min-w-0">{children}</div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

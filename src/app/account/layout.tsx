import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AccountNav from "@/components/account/AccountNav";
import { getCustomer } from "@/lib/customer-auth";
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
  const displayName = customer?.name || customer?.email.split("@")[0] || "";
  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <Navbar />
      <section className="flex-1 px-6 sm:px-10 pt-10 sm:pt-14 pb-20">
        <div className="max-w-6xl mx-auto">
          {customer && (
            <header className="flex items-center gap-4 sm:gap-5">
              <span className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-full bg-[#111110] text-white font-serif text-xl sm:text-2xl flex items-center justify-center">
                {initials || "A"}
              </span>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">My account</p>
                <h1 className="font-serif text-3xl sm:text-4xl text-[#111110] truncate">Hello, {displayName.split(" ")[0]}</h1>
                <p className="text-sm text-stone-500 truncate">{customer.email}</p>
              </div>
            </header>
          )}

          <div className="mt-8 sm:mt-10 grid lg:grid-cols-[15rem_1fr] gap-6 lg:gap-10 items-start">
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

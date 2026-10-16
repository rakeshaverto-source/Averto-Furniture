"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutDashboard, LogOut, MapPin, Package, TicketPercent, UserRound } from "lucide-react";
import { signOutCustomer } from "@/app/actions/account";

const links = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "My orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/coupons", label: "My coupons", icon: TicketPercent },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", icon: UserRound },
];

// Side menu on desktop, a scrolling row of pills on phones
export default function AccountNav({ counts }: { counts: Record<string, number> }) {
  const pathname = usePathname();

  return (
    <nav aria-label="My account" className="lg:sticky lg:top-28">
      <ul className="flex lg:flex-col gap-1.5 overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-0 pb-1 lg:pb-0">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/account" ? pathname === "/account" : pathname.startsWith(href) || (href === "/account/profile" && pathname === "/account/password");
          const count = counts[href] ?? 0;
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-sm px-4 py-2.5 text-sm transition-colors whitespace-nowrap ${
                  active
                    ? "bg-[#111110] text-white"
                    : "bg-white lg:bg-transparent border border-stone-200 lg:border-transparent text-stone-700 hover:bg-white hover:text-stone-900"
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.6} />
                <span className="flex-1">{label}</span>
                {count > 0 && (
                  <span
                    className={`min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold ${
                      active ? "bg-white/20 text-white" : "bg-stone-200 text-stone-800"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 lg:mt-4 lg:pt-4 lg:border-t lg:border-stone-200">
          <form action={signOutCustomer}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-sm px-4 py-2.5 text-sm text-stone-500 hover:text-stone-900 cursor-pointer whitespace-nowrap border border-stone-200 lg:border-transparent bg-white lg:bg-transparent"
            >
              <LogOut className="w-[18px] h-[18px]" strokeWidth={1.6} />
              Log out
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}

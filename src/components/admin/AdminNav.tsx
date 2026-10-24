"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  FileText,
  GalleryHorizontal,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  Star,
  Tags,
  TicketPercent,
  Truck,
  Undo2,
  Users,
  X,
} from "lucide-react";
import { signOut } from "@/app/admin/actions";
import { canUse, type AdminSection, type StaffRole } from "@/lib/admin-roles";

const links: { href: string; label: string; icon: typeof Package; section: AdminSection }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, section: "dashboard" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, section: "orders" },
  { href: "/admin/returns", label: "Returns", icon: Undo2, section: "orders" },
  { href: "/admin/drivers", label: "Drivers", icon: Truck, section: "drivers" },
  { href: "/admin/products", label: "Products", icon: Package, section: "products" },
  { href: "/admin/reviews", label: "Reviews", icon: Star, section: "reviews" },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent, section: "coupons" },
  { href: "/admin/categories", label: "Categories", icon: Tags, section: "categories" },
  { href: "/admin/showcase", label: "Home slider", icon: GalleryHorizontal, section: "products" },
  { href: "/admin/seo", label: "SEO", icon: Search, section: "seo" },
  { href: "/admin/blog", label: "Blog", icon: FileText, section: "blog" },
  { href: "/admin/team", label: "Team", icon: Users, section: "team" },
];

// Left sidebar on desktop; on phones a top bar whose menu button slides the same sidebar in
export default function AdminNav({
  email,
  role,
  roleName,
  pendingReviews,
  newOrders,
  newReturns,
}: {
  email: string;
  role: StaffRole;
  roleName: string;
  pendingReviews: number;
  newOrders: number;
  newReturns: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const counts: Record<string, number> = {
    "/admin/orders": newOrders,
    "/admin/returns": newReturns,
    "/admin/reviews": pendingReviews,
  };

  // Close the phone menu after moving to another page
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Esc closes the phone menu
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const home = links.find((l) => canUse(role, l.section))?.href ?? "/admin";
  const brand = (
    <Link href={home} className="font-serif text-xl text-[#111110]">
      Averto <span className="text-stone-400">Admin</span>
    </Link>
  );

  return (
    <>
      {/* Phone top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white border-b border-stone-200">
        {brand}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="relative h-10 w-10 inline-flex items-center justify-center rounded-lg hover:bg-stone-100 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          {newOrders + pendingReviews > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#E08A50]" aria-hidden />
          )}
        </button>
      </div>

      {open && <div className="lg:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} aria-hidden />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white border-r border-stone-200 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-stone-100">
          {brand}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {links.filter((l) => canUse(role, l.section)).map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            const count = counts[href] ?? 0;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />
                <span className="flex-1">{label}</span>
                {count > 0 && (
                  <span
                    className={`min-w-5 px-1.5 rounded-full text-[11px] font-semibold text-center ${
                      active ? "bg-white text-stone-900" : "bg-[#E08A50] text-white"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-stone-100 px-3 py-4 space-y-1 text-sm">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-stone-700 hover:bg-stone-100"
          >
            <ExternalLink className="w-[18px] h-[18px]" strokeWidth={1.75} />
            View shop
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              <LogOut className="w-[18px] h-[18px]" strokeWidth={1.75} />
              Sign out
            </button>
          </form>
          <p className="px-3 pt-2 text-xs text-stone-400 truncate" title={email}>
            {email} · {roleName}
          </p>
        </div>
      </aside>
    </>
  );
}

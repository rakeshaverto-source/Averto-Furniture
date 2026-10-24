"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import CartButton from "@/components/cart/CartButton";
import AccountButton from "@/components/layout/AccountButton";
import { m, useScroll, useMotionValueEvent } from "framer-motion";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Collections", href: "/collections" },
  { name: "About", href: "/#about" },
  { name: "Blog", href: "/blog" },
  { name: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const pathname = usePathname();

  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Hide on scroll down, reveal on scroll up; compact once the page has moved
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setHidden(latest > previous && latest > 160);
    setScrolled(latest > 24);
  });

  // Esc closes the phone menu
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <m.header
      animate={{ y: hidden && !menuOpen ? "-100%" : "0%" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`w-full bg-white/95 backdrop-blur-md sticky top-0 z-[100] px-4 sm:px-6 md:px-16 border-b border-stone-100 transition-[padding,box-shadow] duration-300 ${
        scrolled ? "py-2 shadow-[0_6px_24px_rgba(0,0,0,0.05)]" : "py-3 sm:py-3.5 shadow-xs"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Official Brand Logo */}
        <Link href="/" className="flex items-center group py-0.5">
          <div
            className={`relative w-36 sm:w-48 md:w-56 transition-[height] duration-300 ${
              scrolled ? "h-10 sm:h-11 md:h-12" : "h-11 sm:h-13 md:h-15"
            }`}
          >
            <Image
              src="/averto-logo.png"
              alt="Averto · Furniture · Interior · Styling"
              fill
              priority
              className="object-contain object-left group-hover:scale-102 transition-transform duration-300"
              sizes="(max-width: 640px) 144px, (max-width: 768px) 192px, 224px"
            />
          </div>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = item.href === pathname;
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`text-sm tracking-wide transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-stone-900 after:origin-left after:transition-transform after:duration-300 ${
                  isActive
                    ? "text-stone-900 font-medium after:scale-x-100"
                    : "text-stone-500 hover:text-stone-900 after:scale-x-0 hover:after:scale-x-100"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Cart + action button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <CartButton />
          <AccountButton />
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="md:hidden -mr-2 flex h-10 w-10 items-center justify-center rounded-sm text-stone-800 hover:bg-stone-100 cursor-pointer"
          >
            {menuOpen ? <X className="w-6 h-6" strokeWidth={1.6} /> : <Menu className="w-6 h-6" strokeWidth={1.6} />}
          </button>
        </div>
      </div>

      {/* Phone menu: drops below the header; tapping the dimmed page closes it.
          Positioned absolute (not fixed) because the header's motion transform would trap fixed children. */}
      {menuOpen && (
        <>
          <div
            className="md:hidden absolute left-0 right-0 top-full h-[100dvh] bg-black/20"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <nav
            id="mobile-menu"
            aria-label="Main"
            className="md:hidden absolute left-0 right-0 top-full bg-white border-b border-stone-200 shadow-[0_12px_24px_rgba(0,0,0,0.08)] px-4 sm:px-6 py-3"
          >
            <ul className="flex flex-col">
              {navItems.map((item) => {
                const isActive = item.href === pathname;
                return (
                  <li key={item.name} className="border-b border-stone-100 last:border-b-0">
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`block py-3.5 text-base tracking-wide transition-colors ${
                        isActive ? "text-stone-900 font-semibold" : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </m.header>
  );
}

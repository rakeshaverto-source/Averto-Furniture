"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import CartButton from "@/components/cart/CartButton";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Collections", href: "/collections" },
  { name: "About", href: "/#about" },
  { name: "Blog", href: "/#blog" },
  { name: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const pathname = usePathname();

  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Hide on scroll down, reveal on scroll up; compact once the page has moved
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setHidden(latest > previous && latest > 160);
    setScrolled(latest > 24);
  });

  return (
    <motion.header
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`w-full bg-white/95 backdrop-blur-md sticky top-0 z-[100] px-6 md:px-16 border-b border-stone-100 transition-[padding,box-shadow] duration-300 ${
        scrolled ? "py-2 shadow-[0_6px_24px_rgba(0,0,0,0.05)]" : "py-3 sm:py-3.5 shadow-xs"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Official Brand Logo */}
        <Link href="/" className="flex items-center group py-0.5">
          <div
            className={`relative w-36 sm:w-44 md:w-48 aspect-[2.5/1] transition-[height] duration-300 ${
              scrolled ? "h-10 sm:h-11 md:h-12" : "h-11 sm:h-13 md:h-15"
            }`}
          >
            <Image
              src="/Logo.png"
              alt="Averto Furniture · Interior · Styling"
              fill
              priority
              className="object-contain object-left group-hover:scale-102 transition-transform duration-300"
              sizes="(max-width: 640px) 150px, (max-width: 1024px) 180px, 200px"
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
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-xl bg-[#E08A50] hover:bg-[#cf7b43] text-white text-sm font-medium transition-all shadow-sm shadow-[#E08A50]/20 inline-block"
          >
            Login
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

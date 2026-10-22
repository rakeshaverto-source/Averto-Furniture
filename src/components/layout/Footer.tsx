"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mail, Phone, MapPin } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/data/collections";

export default function Footer() {
  return (
    <footer className="w-full bg-[#F5F2EB] text-stone-800 border-t border-stone-200/80 pt-16 pb-12 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-14 border-b border-stone-300/60">
          
          {/* Brand Column with Original Warm Wood Logo */}
          <div className="lg:col-span-4 space-y-5">
            <Link href="/" className="inline-block group">
              <div className="relative h-12 w-48 transition-transform group-hover:scale-[1.02] duration-300">
                <Image
                  src="/Logo.png"
                  alt="Averto Furniture"
                  fill
                  className="object-contain object-left"
                  sizes="200px"
                  priority
                />
              </div>
            </Link>
            
            <p className="text-sm text-stone-600 font-light leading-relaxed max-w-sm">
              Furniture made by hand in Rajasthan slate, seasoned teak and full-grain leather, to the size of your room.
            </p>

            <div className="space-y-2 pt-1 text-xs text-stone-600 font-normal">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>Ateliers: New Delhi · Mumbai · Bengaluru</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-stone-400" />
                <span>Concierge: +91 98765 43210</span>
              </div>
            </div>
          </div>

          {/* Collections Column */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-medium text-stone-900">Collections</h4>
            <ul className="space-y-2.5 text-sm text-stone-600 font-light">
              <li><a href="/collections?category=dining" className="hover:text-stone-900 transition-colors">Dining tables</a></li>
              <li><a href="/collections?category=seating" className="hover:text-stone-900 transition-colors">Chairs</a></li>
              <li><a href="/collections?category=sofas" className="hover:text-stone-900 transition-colors">Sofas</a></li>
              <li><a href="/collections?category=beds" className="hover:text-stone-900 transition-colors">Beds</a></li>
              <li><a href="/collections?category=storage" className="hover:text-stone-900 transition-colors">Storage</a></li>
            </ul>
          </div>

          {/* Atelier Column */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-medium text-stone-900">About</h4>
            <ul className="space-y-2.5 text-sm text-stone-600 font-light">
              <li><a href="#about" className="hover:text-stone-900 transition-colors">Our story</a></li>
              <li><a href="#materials" className="hover:text-stone-900 transition-colors">Materials</a></li>
              <li><a href="#bespoke" className="hover:text-stone-900 transition-colors">Made to order</a></li>
              <li><a href="#trade" className="hover:text-stone-900 transition-colors">For architects</a></li>
              <li><Link href="/blog" className="hover:text-stone-900 transition-colors">Journal</Link></li>
            </ul>
          </div>

          {/* Direct Consultation / Newsletter Column */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-sm font-medium text-stone-900">Talk to us</h4>
            <p className="text-sm text-stone-600 font-light leading-relaxed">
              Planning a room? Send us the measurements and we will suggest pieces, or post you material samples.
            </p>
            
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] text-white text-sm transition-colors"
              >
                <span>Message us on WhatsApp</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
              <a
                href="mailto:concierge@averto.in"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-sm border border-stone-300 hover:border-stone-400 bg-white/70 hover:bg-white text-stone-800 text-sm transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email us</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 font-light">
          <p>© {new Date().getFullYear()} Averto Furniture Studio. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-stone-800 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-stone-800 transition-colors">Terms</a>
            <a href="#" className="hover:text-stone-800 transition-colors">Warranty</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

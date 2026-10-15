"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mail, Phone, MapPin } from "lucide-react";

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
              Contemporary architectural luxury furniture handcrafted with natural Rajasthan slate, solid seasoned teakwood, and generational Indian artisan craftsmanship.
            </p>

            <div className="space-y-2 pt-1 text-xs text-stone-600 font-normal">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#E08A50]" />
                <span>Ateliers: New Delhi · Mumbai · Bengaluru</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#E08A50]" />
                <span>Concierge: +91 98765 43210</span>
              </div>
            </div>
          </div>

          {/* Collections Column */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-[0.25em] text-[#A66E38] font-semibold">Collections</h4>
            <ul className="space-y-2.5 text-sm text-stone-600 font-light">
              <li><a href="/collections?category=dining" className="hover:text-stone-900 transition-colors">Monolith Dining</a></li>
              <li><a href="/collections?category=seating" className="hover:text-stone-900 transition-colors">Lounge & Armchairs</a></li>
              <li><a href="/collections?category=sofas" className="hover:text-stone-900 transition-colors">Modular Sofas</a></li>
              <li><a href="/collections?category=beds" className="hover:text-stone-900 transition-colors">Sanctuary Beds</a></li>
              <li><a href="/collections?category=storage" className="hover:text-stone-900 transition-colors">Stone Credenzas</a></li>
            </ul>
          </div>

          {/* Atelier Column */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-[0.25em] text-[#A66E38] font-semibold">Atelier</h4>
            <ul className="space-y-2.5 text-sm text-stone-600 font-light">
              <li><a href="#about" className="hover:text-stone-900 transition-colors">Design Philosophy</a></li>
              <li><a href="#materials" className="hover:text-stone-900 transition-colors">Material Archive</a></li>
              <li><a href="#bespoke" className="hover:text-stone-900 transition-colors">Made to Order</a></li>
              <li><a href="#trade" className="hover:text-stone-900 transition-colors">Trade & Architects</a></li>
            </ul>
          </div>

          {/* Direct Consultation / Newsletter Column */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-[0.25em] text-[#A66E38] font-semibold">Private Consultation</h4>
            <p className="text-sm text-stone-600 font-light leading-relaxed">
              Schedule a bespoke consultation with our studio architect or request curated natural material sample boxes.
            </p>
            
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#E08A50] hover:bg-[#cf7b43] text-white text-xs font-medium uppercase tracking-wider transition-all shadow-sm shadow-[#E08A50]/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Inquire With Atelier</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
              <a
                href="mailto:concierge@averto.in"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-stone-300 hover:border-stone-400 bg-white/70 hover:bg-white text-stone-800 text-xs font-medium uppercase tracking-wider transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[#E08A50]" />
                <span>Email Us</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 font-light">
          <p>© {new Date().getFullYear()} Averto Furniture Studio. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-stone-800 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-stone-800 transition-colors">Terms of Commission</a>
            <a href="#" className="hover:text-stone-800 transition-colors">Sustainability Guarantee</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

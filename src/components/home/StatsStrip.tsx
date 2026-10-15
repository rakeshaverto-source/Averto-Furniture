"use client";

import React, { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

interface Stat {
  value: number;
  decimals?: number;
  suffix?: string;
  label: string;
}

const stats: Stat[] = [
  { value: 180, suffix: "+", label: "Bespoke Commissions" },
  { value: 10, suffix: " Yr", label: "Structural Guarantee" },
  { value: 3, label: "Ateliers Across India" },
  { value: 4.95, decimals: 2, label: "Average Client Rating" },
];

function CountUp({ value, decimals = 0, suffix = "" }: Omit<Stat, "label">) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const controls = animate(0, value, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: setDisplay,
    });
    return () => controls.stop();
  }, [inView, reduceMotion, value]);

  // Reduced-motion visitors see the final number straight away
  const shown = reduceMotion && inView ? value : display;

  return (
    <span ref={ref} className="tabular-nums">
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export default function StatsStrip() {
  return (
    <section className="w-full bg-[#141413] text-white py-14 sm:py-20 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-y-10 lg:divide-x lg:divide-white/10">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center text-center px-4">
            <span className="text-4xl sm:text-5xl lg:text-6xl font-serif font-light text-[#F5F2EB] leading-none">
              <CountUp value={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
            </span>
            <span className="mt-3 text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-stone-400 font-semibold">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

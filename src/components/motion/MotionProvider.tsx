"use client";

import React from "react";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";

// Honours the visitor's OS "reduce motion" setting across every animation on the site.
// LazyMotion + domAnimation ships only the animation features the site uses; components use the
// lightweight `m` instead of `motion` (strict makes a stray `motion` component throw in development).
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

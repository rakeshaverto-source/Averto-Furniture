"use client";

import React from "react";
import { motion, useScroll, useSpring } from "framer-motion";

// Thin reading-progress line pinned to the very top of the viewport
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-[#E08A50] origin-left z-[200] pointer-events-none"
    />
  );
}

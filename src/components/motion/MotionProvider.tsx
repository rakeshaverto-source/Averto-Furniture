"use client";

import React from "react";
import { MotionConfig } from "framer-motion";

// Honours the visitor's OS "reduce motion" setting across every animation on the site
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

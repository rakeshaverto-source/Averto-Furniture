"use client";

import React from "react";
import { m, type Variants } from "framer-motion";

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  // "inView" animates when scrolled into view, "mount" animates immediately (hero)
  trigger?: "inView" | "mount";
}

const container: Variants = {
  hidden: {},
  visible: (delay: number) => ({
    transition: { staggerChildren: 0.07, delayChildren: delay },
  }),
};

const word: Variants = {
  hidden: { y: "110%" },
  visible: {
    y: "0%",
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

// Curtain-style headline reveal: each word slides up from behind a mask
export default function TextReveal({
  text,
  className = "",
  delay = 0,
  trigger = "inView",
}: TextRevealProps) {
  const words = text.split(" ");
  const animateProps =
    trigger === "mount"
      ? { initial: "hidden", animate: "visible" }
      : {
          initial: "hidden",
          whileInView: "visible",
          viewport: { once: true, margin: "-80px" },
        };

  return (
    <span className={className}>
      {/* Full sentence for screen readers; split words are decorative */}
      <span className="sr-only">{text}</span>
      <m.span aria-hidden="true" custom={delay} variants={container} {...animateProps}>
        {words.map((w, i) => (
          <React.Fragment key={`${w}-${i}`}>
            <span className="inline-block overflow-hidden align-bottom pb-[0.1em] -mb-[0.1em]">
              <m.span className="inline-block will-change-transform" variants={word}>
                {w}
              </m.span>
            </span>
            {i < words.length - 1 && " "}
          </React.Fragment>
        ))}
      </m.span>
    </span>
  );
}

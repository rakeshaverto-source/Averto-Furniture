"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import type { PopupReview } from "@/lib/catalog";

// Real customer reviews, one at a time, in the bottom-left corner of the shop pages
const FIRST_AFTER_MS = 8_000;
const SHOW_FOR_MS = 7_000;
const GAP_MS = 18_000;
const MAX_PER_VISIT = 6;
const DISMISSED_KEY = "averto:review-popup-closed";

// Pages where it would get in the way
const HIDDEN_ON = ["/admin", "/driver", "/checkout", "/account", "/invoice", "/login", "/register", "/forgot-password"];

export default function ReviewPopup({ reviews }: { reviews: PopupReview[] }) {
  const pathname = usePathname();
  const [shown, setShown] = useState(0); // how many have been shown this visit
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);
  const hiddenHere = HIDDEN_ON.some((p) => pathname.startsWith(p));
  const active = reviews.length > 0 && !closed && !hiddenHere && shown < MAX_PER_VISIT;

  // Closing it once keeps it away for the rest of the visit
  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISSED_KEY)) setClosed(true); // eslint-disable-line react-hooks/set-state-in-effect -- read once after mount
    } catch {
      // storage blocked: it simply shows again next visit
    }
  }, []);

  // Wait, show one, hide it, wait, show the next…
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(
      () => {
        if (visible) {
          setVisible(false);
          setShown((n) => n + 1);
        } else setVisible(true);
      },
      visible ? SHOW_FOR_MS : shown === 0 ? FIRST_AFTER_MS : GAP_MS,
    );
    return () => clearTimeout(timer);
  }, [active, visible, shown]);

  function close() {
    setVisible(false);
    setClosed(true);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // nothing to do
    }
  }

  const review = reviews.length ? reviews[shown % reviews.length] : null;

  return (
    <AnimatePresence>
      {active && visible && review && (
        <m.aside
          key={review.id + shown}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Customer review"
          // Above the product page's sticky bar on phones
          className="fixed left-4 right-4 sm:right-auto bottom-24 lg:bottom-6 z-[95] sm:w-80 rounded-2xl border border-stone-200 bg-white p-4 pr-10 shadow-xl"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-2 top-2 h-7 w-7 inline-flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <Link href={`/products/${review.productId}#reviews`} className="block">
            <p className="text-amber-500 text-sm tracking-wider" aria-label={`${review.rating} out of 5 stars`}>
              {"★".repeat(review.rating)}
              <span className="text-stone-200">{"★".repeat(5 - review.rating)}</span>
            </p>
            <p className="mt-1 text-sm text-stone-800 leading-snug">&ldquo;{review.text}&rdquo;</p>
            <p className="mt-2 text-xs text-stone-500">
              <span className="font-medium text-stone-900">{review.name}</span>
              {review.location ? `, ${review.location}` : ""} · {review.offline ? "bought in store" : "verified buyer"}
            </p>
            <p className="mt-0.5 text-xs text-stone-500 truncate">on the {review.productName}</p>
          </Link>
        </m.aside>
      )}
    </AnimatePresence>
  );
}

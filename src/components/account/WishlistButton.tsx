"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { getWishlistIds, toggleWishlist } from "@/app/actions/account-data";
import { supabaseBrowser } from "@/lib/supabase/browser";

// Pages are cached for everyone, so which pieces are saved is looked up in the browser after load
// (only for signed-in visitors). One lookup is shared by every ♥ on the page, and a toggle on one
// card updates any other ♥ for the same piece.
let savedIds: Set<string> | null = null;
let loading: Promise<Set<string>> | null = null;
const listeners = new Set<() => void>();

let watchingAuth = false;

function loadSaved() {
  if (!watchingAuth) {
    watchingAuth = true;
    // Signing in or out without a full page load: look the list up again for the new visitor
    supabaseBrowser().auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;
      loading = null;
      loadSaved().then(() => listeners.forEach((notify) => notify()));
    });
  }
  loading ??= supabaseBrowser()
    .auth.getSession()
    .then(({ data }) => (data.session ? getWishlistIds() : []))
    .catch(() => [] as string[])
    .then((ids) => (savedIds = new Set(ids)));
  return loading;
}

function setSavedId(productId: string, saved: boolean) {
  savedIds ??= new Set();
  if (saved) savedIds.add(productId);
  else savedIds.delete(productId);
  listeners.forEach((notify) => notify());
}

export default function WishlistButton({
  productId,
  variant = "outline",
  className = "",
}: {
  productId: string;
  /** "outline" sits beside the add-to-cart button; "overlay" floats on a product photo. */
  variant?: "outline" | "overlay";
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    const sync = () => {
      if (!cancelled) setSaved(savedIds?.has(productId) ?? false);
    };
    listeners.add(sync);
    loadSaved().then(sync);
    return () => {
      cancelled = true;
      listeners.delete(sync);
    };
  }, [productId]);

  const toggle = () =>
    startTransition(async () => {
      const previous = saved;
      setSaved(!previous); // feels instant; put back if the server says otherwise
      const result = await toggleWishlist(productId).catch(() => null);
      if (!result) setSaved(previous);
      else if ("needsLogin" in result) {
        setSaved(previous);
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
      } else setSavedId(productId, result.saved);
    });

  const look =
    variant === "overlay"
      ? `w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm text-stone-900 hover:bg-white`
      : `rounded-sm border ${saved ? "border-stone-900 text-stone-900" : "border-stone-300 text-stone-700 hover:border-stone-900"}`;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      title={saved ? "Saved to your wishlist" : "Save to wishlist"}
      className={`inline-flex items-center justify-center transition-colors cursor-pointer ${look} ${className}`}
    >
      <Heart className={`${variant === "overlay" ? "w-[18px] h-[18px]" : "w-5 h-5"} ${saved ? "fill-current" : ""}`} strokeWidth={1.6} />
    </button>
  );
}

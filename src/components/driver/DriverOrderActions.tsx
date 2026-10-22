"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Start / Delivered for the website version of the driver app, and location sharing from the
// browser while the order is out for delivery. A browser can only do this while the page is open,
// so the screen is kept on (Wake Lock) where the phone allows it.
const SEND_EVERY_MS = 30_000;

type Share = "starting" | "on" | "denied" | "unsupported" | "error";

const post = (path: string, body: unknown = {}) =>
  fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export default function DriverOrderActions({
  orderRef,
  status,
  customerName,
  cashToCollect,
}: {
  orderRef: string;
  status: "shipped" | "out_for_delivery";
  customerName: string;
  cashToCollect: string; // "₹4,000", or "" when nothing is due
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const live = status === "out_for_delivery";
  const base = `/api/driver/orders/${encodeURIComponent(orderRef)}`;

  async function act(path: string, done: () => void) {
    setBusy(true);
    setError("");
    try {
      const res = await post(`${base}/${path}`);
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/driver/login");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      done();
    } catch {
      setError("No internet connection. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function start() {
    if (!window.confirm("Start delivery? The customer will see your location until you mark it delivered.")) return;
    act("start", () => router.refresh());
  }

  function delivered() {
    const cash = cashToCollect ? `\n\nDid you collect ${cashToCollect}?` : "";
    if (!window.confirm(`Mark as delivered? ${customerName} has received the order.${cash}`)) return;
    act("delivered", () => {
      router.replace("/driver");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 pb-8">
      {live && <LocationSharing base={base} onStopped={() => router.refresh()} />}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {live ? (
        <button
          type="button"
          onClick={delivered}
          disabled={busy}
          className="w-full rounded-2xl bg-emerald-700 py-4 text-lg font-bold text-white hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
        >
          {busy ? "Saving…" : "✓ Delivered"}
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={busy}
          className="w-full rounded-2xl bg-[#E08A50] py-4 text-lg font-bold text-white hover:bg-[#cf7b43] disabled:opacity-60 cursor-pointer"
        >
          {busy ? "Starting…" : "▶ Start delivery"}
        </button>
      )}
    </div>
  );
}

function LocationSharing({ base, onStopped }: { base: string; onStopped: () => void }) {
  const [share, setShare] = useState<Share>(() =>
    typeof navigator !== "undefined" && !("geolocation" in navigator) ? "unsupported" : "starting",
  );
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const lastSent = useRef(0);
  // The latest callback, without restarting the location watch on every render
  const stoppedCallback = useRef(onStopped);
  useEffect(() => {
    stoppedCallback.current = onStopped;
  }, [onStopped]);

  // Follow the phone's position and send it at most every 30 seconds
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    let stopped = false;
    const watch = navigator.geolocation.watchPosition(
      async (pos) => {
        setShare("on");
        if (Date.now() - lastSent.current < SEND_EVERY_MS) return;
        lastSent.current = Date.now();
        try {
          const res = await post(`${base}/location`, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            at: pos.timestamp,
          });
          if (stopped) return;
          if (res.status === 409 || res.status === 404) stoppedCallback.current(); // delivered or changed by the office
          else if (res.ok) setSentAt(Date.now());
        } catch {
          lastSent.current = 0; // offline: try again with the next position
        }
      },
      (err) => setShare(err.code === err.PERMISSION_DENIED ? "denied" : "error"),
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 60_000 },
    );
    const tick = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => {
      stopped = true;
      navigator.geolocation.clearWatch(watch);
      window.clearInterval(tick);
    };
  }, [base]);

  // Keep the screen on; the phone drops the lock when the page is hidden, so take it again on return
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const take = async () => {
      if (document.visibilityState !== "visible" || !("wakeLock" in navigator)) return;
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        // battery saver can refuse; sharing still works while the screen happens to be on
      }
    };
    take();
    document.addEventListener("visibilitychange", take);
    return () => {
      document.removeEventListener("visibilitychange", take);
      lock?.release().catch(() => undefined);
    };
  }, []);

  const message: Record<Share, string> = {
    starting: "Turning on location…",
    on: sentAt
      ? `Sharing your location · sent ${Math.max(0, Math.round((now - sentAt) / 1000))}s ago`
      : "Sharing your location…",
    denied: "Location is blocked. Allow location for this website in the browser settings, then reload the page.",
    unsupported: "This browser can't share location. Please use the Averto Driver app.",
    error: "Can't get your location. Turn on GPS and reload the page.",
  };
  const ok = share === "on" || share === "starting";

  return (
    <div className={`rounded-2xl p-4 ${ok ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`} aria-live="polite">
      <p className="font-semibold">{message[share]}</p>
      {ok && <p className="mt-1 text-sm">Keep this page open and don&apos;t lock the phone until you deliver.</p>}
    </div>
  );
}

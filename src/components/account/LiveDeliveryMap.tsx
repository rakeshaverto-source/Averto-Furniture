"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";

// The driver's van on an OpenStreetMap map, asked for again every 20 seconds while the order is out
// for delivery. When the status moves on (delivered, say) the page is refreshed to show it.
const POLL_MS = 20_000;
const STALE_MS = 10 * 60 * 1000; // older than this, the driver's phone has probably lost signal

interface Fix {
  lat: number;
  lng: number;
  at: string;
}

const ago = (iso: string, now: number) => {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
  return minutes < 1 ? "just now" : minutes === 1 ? "1 min ago" : minutes < 60 ? `${minutes} min ago` : "over an hour ago";
};

export default function LiveDeliveryMap({ orderRef, driverPhone }: { orderRef: string; driverPhone?: string }) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const [fix, setFix] = useState<Fix | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Ask for the position now and then every 20 seconds, but not while the tab is hidden
  useEffect(() => {
    let stopped = false;
    async function poll() {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderRef)}/location`, { cache: "no-store" });
        if (!res.ok || stopped) return;
        const data: { fulfillment: string; location: Fix | null } = await res.json();
        if (data.fulfillment !== "out_for_delivery") {
          router.refresh();
          return;
        }
        setFix(data.location);
        setNow(Date.now());
      } catch {
        // offline for a moment; the next round tries again
      } finally {
        if (!stopped) setLoaded(true);
      }
    }
    poll();
    const timer = window.setInterval(poll, POLL_MS);
    document.addEventListener("visibilitychange", poll);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [orderRef, router]);

  // Leaflet needs the browser, so it is loaded here rather than on the server
  useEffect(() => {
    if (!fix || !box.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !box.current) return;
      const at: [number, number] = [fix.lat, fix.lng];
      if (!map.current) {
        map.current = L.map(box.current, { scrollWheelZoom: false }).setView(at, 15);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map.current);
        const icon = L.divIcon({
          className: "",
          html: '<span style="display:block;width:22px;height:22px;border-radius:9999px;background:#E08A50;border:3px solid #fff;box-shadow:0 0 0 2px #E08A50,0 2px 6px rgba(0,0,0,.35)"></span>',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        marker.current = L.marker(at, { icon, title: "Delivery van", alt: "Delivery van" }).addTo(map.current);
      } else {
        marker.current?.setLatLng(at);
        map.current.panTo(at);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fix]);

  // Remove the map when leaving the page
  useEffect(
    () => () => {
      map.current?.remove();
      map.current = null;
    },
    [],
  );

  const stale = !fix || now - new Date(fix.at).getTime() > STALE_MS;

  return (
    <div className="mt-6 border-t border-stone-200 pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xs uppercase tracking-wider text-stone-500">Live location</h3>
        {fix && (
          <p className="text-xs text-stone-500" aria-live="polite">
            Last updated {ago(fix.at, now)}
          </p>
        )}
      </div>
      <div
        ref={box}
        className={`mt-3 h-72 sm:h-80 w-full overflow-hidden rounded-sm bg-stone-100 ${fix ? "" : "hidden"}`}
        role="region"
        aria-label="Map showing the delivery van"
      />
      {loaded && stale && (
        <p className="mt-3 text-sm text-stone-600">
          {fix ? "The driver's location hasn't updated for a while." : "The driver's location isn't available right now."}
          {driverPhone && (
            <>
              {" "}
              <a href={`tel:${driverPhone}`} className="font-medium text-stone-900 underline underline-offset-4">
                Call the driver
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LayerGroup, Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";

// The driver's van on an OpenStreetMap map, asked for again every 20 seconds while the order is out
// for delivery, with the pickup point, the customer's address and the road route still to go.
// When the status moves on (delivered, say) the page is refreshed to show it.
const POLL_MS = 20_000;
const STALE_MS = 10 * 60 * 1000; // older than this, the driver's phone has probably lost signal
const REROUTE_METRES = 250; // ask for a new route once the van has moved this far

interface Pin {
  lat: number;
  lng: number;
}
interface Fix extends Pin {
  at: string;
}
interface Route {
  line: [number, number][];
  km: number;
  minutes: number;
}

const ago = (iso: string, now: number) => {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
  return minutes < 1 ? "just now" : minutes === 1 ? "1 min ago" : minutes < 60 ? `${minutes} min ago` : "over an hour ago";
};

// Straight-line distance, only to decide when the route is worth asking for again
const metresBetween = (a: Pin, b: Pin) => {
  const rad = Math.PI / 180;
  const x = (b.lng - a.lng) * rad * Math.cos(((a.lat + b.lat) / 2) * rad);
  const y = (b.lat - a.lat) * rad;
  return Math.sqrt(x * x + y * y) * 6_371_000;
};

// Road route from OpenStreetMap's public router; null when it can't be reached
async function fetchRoute(from: Pin, to: Pin): Promise<Route | null> {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`,
    );
    if (!res.ok) return null;
    const data: { routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[] } = await res.json();
    const best = data.routes?.[0];
    if (!best) return null;
    return {
      line: best.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      km: best.distance / 1000,
      minutes: best.duration / 60,
    };
  } catch {
    return null;
  }
}

const pinIcon = (emoji: string, background: string) =>
  `<span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:${background};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);font-size:16px;line-height:1">${emoji}</span>`;

export default function LiveDeliveryMap({ orderRef, driverPhone }: { orderRef: string; driverPhone?: string }) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const van = useRef<Marker | null>(null);
  const pickupMarker = useRef<Marker | null>(null);
  const dropMarker = useRef<Marker | null>(null);
  const routeLayer = useRef<LayerGroup | null>(null);
  const routedFrom = useRef<Pin | null>(null);
  const [fix, setFix] = useState<Fix | null>(null);
  const [pickup, setPickup] = useState<Pin | null>(null);
  const [drop, setDrop] = useState<Pin | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
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
        const data: { fulfillment: string; location: Fix | null; pickup: Pin | null; drop: Pin | null } = await res.json();
        if (data.fulfillment !== "out_for_delivery") {
          router.refresh();
          return;
        }
        setFix(data.location);
        setPickup(data.pickup);
        setDrop(data.drop);
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

  // The road route from the van (or the pickup, before the van reports in) to the customer
  const from = fix ?? pickup;
  useEffect(() => {
    if (!from || !drop) return;
    if (routedFrom.current && metresBetween(routedFrom.current, from) < REROUTE_METRES) return;
    routedFrom.current = { lat: from.lat, lng: from.lng };
    let cancelled = false;
    fetchRoute(from, drop).then((r) => {
      if (!cancelled) setRoute(r);
    });
    return () => {
      cancelled = true;
    };
  }, [from, drop]);

  // Leaflet needs the browser, so it is loaded here rather than on the server
  useEffect(() => {
    if (!box.current || !(fix || pickup || drop)) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !box.current) return;
      const points = [pickup, fix, drop].filter((p): p is Pin => !!p).map((p): [number, number] => [p.lat, p.lng]);
      if (!map.current) {
        map.current = L.map(box.current, { scrollWheelZoom: false });
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map.current);
        routeLayer.current = L.layerGroup().addTo(map.current);
        // Show everything once; after that the customer can pan and zoom freely
        if (points.length > 1) map.current.fitBounds(points, { padding: [36, 36], maxZoom: 16 });
        else map.current.setView(points[0], 15);
      }

      // Each pin is made the first time it is known and moved after that
      const place = (marker: Marker | null, pin: Pin | null, emoji: string, bg: string, title: string, top = false) => {
        if (!pin || !map.current) return marker;
        if (marker) return marker.setLatLng([pin.lat, pin.lng]);
        const icon = L.divIcon({ className: "", html: pinIcon(emoji, bg), iconSize: [32, 32], iconAnchor: [16, 16] });
        return L.marker([pin.lat, pin.lng], { icon, title, alt: title, zIndexOffset: top ? 1000 : 0 }).addTo(map.current);
      };
      pickupMarker.current = place(pickupMarker.current, pickup, "📦", "#f5f5f4", "Pickup point");
      dropMarker.current = place(dropMarker.current, drop, "🏠", "#111110", "Delivery address");
      van.current = place(van.current, fix, "🚚", "#E08A50", "Delivery van", true);

      // The route still to go, solid; the way already covered from the pickup, dotted
      const layer = routeLayer.current;
      if (!layer) return;
      layer.clearLayers();
      if (pickup && fix) {
        L.polyline([[pickup.lat, pickup.lng], [fix.lat, fix.lng]], { color: "#a8a29e", weight: 3, dashArray: "2 8" }).addTo(layer);
      }
      if (from && drop) {
        const line: [number, number][] = route?.line ?? [[from.lat, from.lng], [drop.lat, drop.lng]];
        L.polyline(line, { color: "#111110", weight: 4, opacity: 0.85, ...(route ? {} : { dashArray: "8 8" }) }).addTo(layer);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fix, pickup, drop, from, route]);

  // Remove the map when leaving the page
  useEffect(
    () => () => {
      map.current?.remove();
      map.current = null;
      van.current = null;
      pickupMarker.current = null;
      dropMarker.current = null;
      routeLayer.current = null;
    },
    [],
  );

  const stale = !fix || now - new Date(fix.at).getTime() > STALE_MS;
  const hasMap = !!(fix || pickup || drop);

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
      {route && fix && drop && (
        <p className="mt-2 text-sm text-stone-900">
          About <strong>{route.km < 10 ? route.km.toFixed(1) : Math.round(route.km)} km</strong> away by road
          {route.minutes >= 1 && <>, roughly {Math.round(route.minutes)} min</>}
        </p>
      )}
      <div
        ref={box}
        className={`mt-3 h-72 sm:h-80 w-full overflow-hidden rounded-sm bg-stone-100 ${hasMap ? "" : "hidden"}`}
        role="region"
        aria-label="Map showing the pickup point, the delivery van and your address"
      />
      {hasMap && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
          {pickup && <li>📦 Pickup</li>}
          {fix && <li>🚚 Delivery van</li>}
          {drop && <li>🏠 Your address</li>}
        </ul>
      )}
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

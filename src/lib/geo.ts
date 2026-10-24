// The customer's address as a map pin, looked up on OpenStreetMap, for the drop point on the live
// delivery map. Street-level addresses are often missing there, so the pin may land on the area or
// pincode instead, usually within a km or two, which is close enough for "how far is the van".
import "server-only";
import { prisma } from "@/lib/prisma";

export interface Pin {
  lat: number;
  lng: number;
}

// OpenStreetMap's free lookup; it asks for an identifying User-Agent and at most one request a second
async function geocode(query: string): Promise<Pin | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": `Averto delivery map${process.env.NEXT_PUBLIC_SITE_URL ? ` (${process.env.NEXT_PUBLIC_SITE_URL})` : ""}`,
        "Accept-Language": "en",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const [hit] = (await res.json()) as { lat: string; lon: string }[];
    const pin = hit && { lat: Number(hit.lat), lng: Number(hit.lon) };
    return pin && Number.isFinite(pin.lat) && Number.isFinite(pin.lng) ? pin : null;
  } catch {
    return null;
  }
}

// The full address first, then the area, then just the pincode
export async function geocodeAddress(a: { address: string; locality: string; city: string; state: string; pincode: string }) {
  const queries = [
    [a.address, a.locality, a.city, a.state, a.pincode],
    [a.locality, a.city, a.state, a.pincode],
    [a.pincode, a.city, a.state],
  ].map((parts) => parts.filter(Boolean).join(", "));
  for (const [i, q] of [...new Set(queries)].entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1100)); // keep within the one-a-second limit
    const pin = await geocode(q);
    if (pin) return pin;
  }
  return null;
}

// Puts the drop pin on an order that has none yet; nothing happens if the address can't be found
export async function pinOrderDrop(ref: string) {
  const order = await prisma.order.findUnique({
    where: { ref },
    select: { dropLat: true, address: true, locality: true, city: true, state: true, pincode: true },
  });
  if (!order || order.dropLat !== null) return;
  const pin = await geocodeAddress(order);
  if (pin) await prisma.order.updateMany({ where: { ref, dropLat: null }, data: { dropLat: pin.lat, dropLng: pin.lng } });
}

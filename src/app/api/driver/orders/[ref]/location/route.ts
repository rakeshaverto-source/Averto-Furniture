// The driver app's position, sent about every 30 seconds while an order is out for delivery. Only the
// latest point is kept. A 409 tells the app to stop tracking this order.
import { prisma } from "@/lib/prisma";
import { getDriver } from "@/lib/driver-auth";
import { fail } from "@/lib/driver-orders";

const inRange = (value: unknown, limit: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit;

export async function POST(request: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const driver = await getDriver(request);
  if (!driver) return fail(401, "Please sign in again.");

  const body = await request.json().catch(() => null);
  const { lat, lng } = body ?? {};
  if (!inRange(lat, 90) || !inRange(lng, 180)) return fail(400, "Location missing.");
  // The phone's own time of the reading, if it is sensible; otherwise now
  const sentAt = typeof body.at === "number" ? new Date(body.at) : new Date();
  const at = Math.abs(sentAt.getTime() - Date.now()) < 15 * 60 * 1000 ? sentAt : new Date();

  // One query that only matches this driver's order while it is still out for delivery
  const { count } = await prisma.order.updateMany({
    where: { ref, driverId: driver.id, fulfillment: "out_for_delivery" },
    data: { driverLat: lat, driverLng: lng, driverLocationAt: at },
  });
  if (count === 0) return fail(409, "This order is no longer out for delivery.");
  return Response.json({ ok: true });
}

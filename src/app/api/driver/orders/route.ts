// The signed-in driver's deliveries: dispatched to them or already on the road, soonest first
import { prisma } from "@/lib/prisma";
import { getDriver } from "@/lib/driver-auth";
import { DRIVER_STATUSES, fail, toDriverOrder } from "@/lib/driver-orders";

export async function GET(request: Request) {
  const driver = await getDriver(request);
  if (!driver) return fail(401, "Please sign in again.");
  const orders = await prisma.order.findMany({
    where: { driverId: driver.id, fulfillment: { in: DRIVER_STATUSES } },
    include: { items: true },
    orderBy: [{ expectedDelivery: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
  });
  return Response.json(
    { driver: { name: driver.name, vehicleNumber: driver.vehicleNumber }, orders: orders.map(toDriverOrder) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

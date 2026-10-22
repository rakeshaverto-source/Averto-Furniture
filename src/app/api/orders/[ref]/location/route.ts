// Where the driver is now, for the live map on the order page. The customer sees only their own
// order and the admin sees any; the position is only there while the order is out for delivery.
import { prisma } from "@/lib/prisma";
import { getAdminFor } from "@/lib/admin-auth";
import { getCustomer } from "@/lib/customer-auth";

export async function GET(_request: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const customer = await getCustomer();
  if (!customer) return Response.json({ error: "Please sign in again." }, { status: 401 });
  const admin = await getAdminFor("orders");

  const order = await prisma.order.findFirst({
    where: admin ? { ref } : { ref, userId: customer.id },
    select: { fulfillment: true, driverLat: true, driverLng: true, driverLocationAt: true },
  });
  if (!order) return Response.json({ error: "Order not found." }, { status: 404 });

  const live = order.fulfillment === "out_for_delivery" && order.driverLat !== null && order.driverLng !== null;
  return Response.json(
    {
      fulfillment: order.fulfillment,
      location: live ? { lat: order.driverLat, lng: order.driverLng, at: order.driverLocationAt } : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

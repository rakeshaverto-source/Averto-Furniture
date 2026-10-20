// Changing an order's status, shared by the admin panel and the driver app. Kept out of the Server
// Action file so it is not callable from the browser.
import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { FulfillmentStatus, Prisma } from "@/generated/prisma/client";

// Saves an order and, when its status changes, records when that happened for the order history.
// The driver's position is only kept while the order is out for delivery.
export async function saveOrderChange(
  order: { id: string; fulfillment: FulfillmentStatus },
  data: Prisma.OrderUncheckedUpdateInput & { fulfillment?: FulfillmentStatus },
) {
  const changed = data.fulfillment !== undefined && data.fulfillment !== order.fulfillment;
  const clearLocation = changed && data.fulfillment !== "out_for_delivery";
  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: clearLocation ? { ...data, driverLat: null, driverLng: null, driverLocationAt: null } : data,
    }),
    ...(changed ? [prisma.orderEvent.create({ data: { orderId: order.id, fulfillment: data.fulfillment! } })] : []),
  ]);
}

// Order changes show in the admin panel and on the customer's "My account" pages
export function refreshOrders() {
  revalidatePath("/admin", "layout");
  revalidatePath("/account", "layout");
}

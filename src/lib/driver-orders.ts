// What the driver app sees of an order, and the checks shared by its API routes
import "server-only";
import { prisma } from "@/lib/prisma";
import { addressLines } from "@/lib/address";
import { balanceDue } from "@/lib/account";
import { getDriver } from "@/lib/driver-auth";
import type { FulfillmentStatus, Order, OrderItem } from "@/generated/prisma/client";

// Orders reach the driver's app once the team marks them Dispatched
export const DRIVER_STATUSES: FulfillmentStatus[] = ["shipped", "out_for_delivery"];

export const fail = (status: number, error: string) => Response.json({ error }, { status });

// Only what the driver needs at the door: no payment ids, notes for the team or prices per item
export function toDriverOrder(order: Order & { items: OrderItem[] }) {
  return {
    ref: order.ref,
    status: order.fulfillment,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    addressLines: addressLines(order, { tehsil: true }),
    pincode: order.pincode,
    // For the Navigate button: Google Maps searches this text
    mapQuery: [order.address, order.locality, order.landmark, order.city, order.state, order.pincode].filter(Boolean).join(", "),
    expectedDelivery: order.expectedDelivery ? order.expectedDelivery.toISOString().slice(0, 10) : null,
    deliverySlot: order.deliverySlot,
    notes: order.notes,
    items: order.items.map((i) => ({ name: i.name, colorName: i.colorName, qty: i.qty })),
    cashToCollect: order.balancePaid || order.fulfillment === "cancelled" ? 0 : balanceDue(order),
  };
}

// The signed-in driver and one of their own orders, or an error response to send back
export async function driverOrder(request: Request, ref: string) {
  const driver = await getDriver(request);
  if (!driver) return { error: fail(401, "Please sign in again.") };
  const order = await prisma.order.findFirst({ where: { ref, driverId: driver.id }, include: { items: true } });
  if (!order) return { error: fail(404, "This order is no longer assigned to you.") };
  return { driver, order };
}

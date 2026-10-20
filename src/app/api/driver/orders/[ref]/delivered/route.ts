// "Delivered" in the driver app: closes the order and forgets the driver's position
import { driverOrder, fail } from "@/lib/driver-orders";
import { refreshOrders, saveOrderChange } from "@/lib/order-status";

export async function POST(request: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const found = await driverOrder(request, ref);
  if (found.error) return found.error;
  const { order } = found;
  if (order.fulfillment === "delivered") return Response.json({ ok: true });
  if (order.fulfillment !== "out_for_delivery" && order.fulfillment !== "shipped") {
    return fail(409, "This order can't be marked delivered now. Please call the office.");
  }

  await saveOrderChange(order, { fulfillment: "delivered" });
  refreshOrders();
  return Response.json({ ok: true });
}

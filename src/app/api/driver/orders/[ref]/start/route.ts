// "Start delivery" in the driver app: the order goes out for delivery and the customer's map turns on
import { driverOrder, fail } from "@/lib/driver-orders";
import { refreshOrders, saveOrderChange } from "@/lib/order-status";

export async function POST(request: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const found = await driverOrder(request, ref);
  if (found.error) return found.error;
  const { order } = found;
  if (order.fulfillment === "out_for_delivery") return Response.json({ ok: true });
  if (order.fulfillment !== "shipped") return fail(409, "This order can't be started now. Please call the office.");

  await saveOrderChange(order, { fulfillment: "out_for_delivery" });
  refreshOrders();
  return Response.json({ ok: true });
}

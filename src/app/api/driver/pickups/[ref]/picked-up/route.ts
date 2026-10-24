// "Picked up" for a return in the driver app: the piece is back with us, and the customer is told
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDriver } from "@/lib/driver-auth";
import { fail } from "@/lib/driver-orders";
import { refreshOrders } from "@/lib/order-status";
import { returnUpdateEmail, sendMail } from "@/lib/mailer";
import { SITE_URL } from "@/lib/seo";
import { returnStatusInfo } from "@/data/returns";

export async function POST(request: Request, { params }: { params: Promise<{ ref: string }> }) {
  const driver = await getDriver(request);
  if (!driver) return fail(401, "Please sign in again.");
  const { ref } = await params;
  const pickup = await prisma.returnRequest.findFirst({
    where: { driverId: driver.id, order: { ref } },
    include: { order: { select: { ref: true, customerEmail: true } } },
  });
  if (!pickup) return fail(404, "This pickup is no longer assigned to you.");
  if (pickup.status === "picked_up") return Response.json({ ok: true });
  if (pickup.status !== "pickup_scheduled") return fail(409, "This pickup can't be marked now. Please call the office.");

  await prisma.returnRequest.update({ where: { id: pickup.id }, data: { status: "picked_up", pickedUpAt: new Date() } });
  const info = returnStatusInfo("picked_up");
  after(async () => {
    try {
      await sendMail({
        to: pickup.order.customerEmail,
        ...returnUpdateEmail({ ref: pickup.order.ref, heading: info.label, message: info.hint, siteUrl: SITE_URL }),
      });
    } catch (e) {
      console.error("Return pickup email not sent", e);
    }
  });
  refreshOrders();
  return Response.json({ ok: true });
}

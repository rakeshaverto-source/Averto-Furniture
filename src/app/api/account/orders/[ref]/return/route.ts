// A customer's return request for a delivered order, sent from "My account" with up to four photos.
// Photos are turned upright, shrunk to at most 1600 px, converted to WebP and stripped of hidden data
// such as GPS location, then stored under returns/<order id>/ with random names.
import { randomUUID } from "crypto";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/customer-auth";
import { productStorage } from "@/lib/supabase/storage";
import { refreshOrders } from "@/lib/order-status";
import { MAX_RETURN_PHOTOS, RETURN_REASONS, returnDeadline, withinReturnWindow } from "@/data/returns";
import type { ReturnReason } from "@/generated/prisma/enums";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const fail = (status: number, error: string) => Response.json({ error }, { status });

// Only our own pages may post here (Server Actions get this check from Next.js automatically)
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return !!origin && !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}

const isReason = (value: string): value is ReturnReason => RETURN_REASONS.some((r) => r.value === value);

export async function POST(request: Request, { params }: { params: Promise<{ ref: string }> }) {
  if (!sameOrigin(request)) return fail(403, "Requests must come from this site.");
  const customer = await getCustomer();
  if (!customer) return fail(401, "Please log in again.");
  const { ref } = await params;

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_RETURN_PHOTOS * MAX_PHOTO_BYTES + 256 * 1024) return fail(413, "The photos are too large together.");

  const order = await prisma.order.findFirst({
    where: { ref, userId: customer.id },
    include: { events: { orderBy: { createdAt: "asc" } }, returnRequest: { select: { id: true } } },
  });
  if (!order) return fail(404, "This order wasn't found.");
  if (order.returnRequest) return fail(409, "You've already asked to return this order.");
  const deadline = returnDeadline(order);
  if (!deadline) return fail(409, "A return can be asked for once the order is delivered.");
  if (!withinReturnWindow(deadline)) return fail(409, "The time to ask for a return on this order has passed.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "The request could not be read.");
  }
  const reason = String(form.get("reason") ?? "");
  const details = String(form.get("details") ?? "").trim();
  if (!isReason(reason)) return fail(400, "Choose a reason for the return.");
  if (details.length < 10) return fail(400, "Please tell us a little more (at least 10 characters).");
  if (details.length > 1500) return fail(400, "Please keep the details under 1500 characters.");

  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_RETURN_PHOTOS) return fail(400, `Add up to ${MAX_RETURN_PHOTOS} photos.`);
  if ((reason === "damaged" || reason === "defective") && files.length === 0) {
    return fail(400, "Please add at least one photo showing the damage or fault.");
  }
  if (files.some((f) => f.size > MAX_PHOTO_BYTES)) return fail(413, "Each photo should be under 10 MB.");

  const photos: Buffer[] = [];
  for (const file of files) {
    try {
      photos.push(
        await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 80_000_000 })
          .rotate()
          .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer(),
      );
    } catch {
      return fail(415, `"${file.name}" isn't a photo we can read. Please use JPG, PNG or WebP.`);
    }
  }

  const paths: string[] = [];
  for (const webp of photos) {
    const path = `returns/${order.id}/${randomUUID()}.webp`;
    const { error } = await productStorage().upload(path, webp, { contentType: "image/webp", cacheControl: "31536000" });
    if (error) {
      if (paths.length) await productStorage().remove(paths);
      return fail(502, "The photos could not be stored. Please try again.");
    }
    paths.push(path);
  }

  try {
    await prisma.returnRequest.create({ data: { orderId: order.id, reason, details, photos: paths } });
  } catch {
    // Most likely a second tap that arrived first
    if (paths.length) await productStorage().remove(paths);
    return fail(409, "You've already asked to return this order.");
  }
  refreshOrders();
  return Response.json({ ok: true });
}

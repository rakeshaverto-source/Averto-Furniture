// Receives one product photo from the admin panel, WordPress-style: whatever comes in (JPG, PNG,
// WebP, AVIF, a phone photo) is turned upright, scaled to fit 1600 × 2000, converted to WebP and
// stripped of hidden data such as GPS location, then stored in the "products" bucket.
import { randomUUID } from "crypto";
import sharp from "sharp";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdminFor } from "@/lib/admin-auth";
import { productStorage } from "@/lib/supabase/storage";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

const fail = (status: number, error: string) => Response.json({ error }, { status });

// Only our own admin page may post here (Server Actions get this check from Next.js automatically)
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return !!origin && !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail(403, "Uploads must come from the admin panel.");
  if (!(await getAdminFor("products"))) return fail(401, "Please sign in again.");

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) return fail(413, "This photo is over 15 MB.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "The upload could not be read.");
  }
  const productId = String(form.get("productId") ?? "");
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return fail(400, "Choose a photo to upload.");
  if (file.size > MAX_UPLOAD_BYTES) return fail(413, "This photo is over 15 MB.");

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, name: true } });
  if (!product) return fail(404, "That product no longer exists.");

  let webp: Buffer;
  try {
    webp = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 80_000_000 })
      .rotate() // follow the phone's orientation flag, then drop it
      .resize({ width: 1600, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer(); // sharp leaves out EXIF/GPS unless asked to keep it
  } catch {
    return fail(415, "This file isn't a photo we can read. Please use JPG, PNG or WebP.");
  }

  const path = `${product.id}/${randomUUID()}.webp`;
  const { error } = await productStorage().upload(path, webp, {
    contentType: "image/webp",
    cacheControl: "31536000", // every upload gets a new name, so it can be cached for a year
  });
  if (error) return fail(502, "The photo could not be stored. Please try again.");

  const last = await prisma.productImage.aggregate({ where: { productId: product.id }, _max: { sortOrder: true } });
  const image = await prisma.productImage.create({
    data: {
      productId: product.id,
      path,
      label: product.name,
      sortOrder: (last._max.sortOrder ?? -1) + 1,
    },
  });

  revalidateTag("catalog", { expire: 0 });
  return Response.json({ id: image.id, sizeKb: Math.round(webp.length / 1024) });
}

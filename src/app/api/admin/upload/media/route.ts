// Receives one image for a blog post or a share preview from the admin panel. Like product photos
// it is turned upright, scaled down, converted to WebP and stripped of hidden data such as GPS
// location, then stored under blog/ or seo/ in the "products" bucket (the one the site already serves).
import { randomUUID } from "crypto";
import sharp from "sharp";
import { getAdmin } from "@/lib/admin-auth";
import { canUse } from "@/lib/admin-roles";
import { imageUrl } from "@/lib/catalog";
import { productStorage } from "@/lib/supabase/storage";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

const fail = (status: number, error: string) => Response.json({ error }, { status });

// Only our own admin pages may post here (Server Actions get this check from Next.js automatically)
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
  const admin = await getAdmin();
  if (!admin) return fail(401, "Please sign in again.");

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) return fail(413, "This image is over 15 MB.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "The upload could not be read.");
  }
  const folder = String(form.get("folder") ?? "");
  if (folder !== "blog" && folder !== "seo") return fail(400, "Unknown upload type.");
  if (!canUse(admin.role, folder)) return fail(403, "Your role can't upload these images.");
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return fail(400, "Choose an image to upload.");
  if (file.size > MAX_UPLOAD_BYTES) return fail(413, "This image is over 15 MB.");

  let webp: Buffer;
  try {
    webp = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 80_000_000 })
      .rotate() // follow the phone's orientation flag, then drop it
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer(); // sharp leaves out EXIF/GPS unless asked to keep it
  } catch {
    return fail(415, "This file isn't an image we can read. Please use JPG, PNG or WebP.");
  }

  const path = `${folder}/${randomUUID()}.webp`;
  const { error } = await productStorage().upload(path, webp, {
    contentType: "image/webp",
    cacheControl: "31536000", // every upload gets a new name, so it can be cached for a year
  });
  if (error) return fail(502, "The image could not be stored. Please try again.");

  return Response.json({ path, url: imageUrl(path), sizeKb: Math.round(webp.length / 1024) });
}

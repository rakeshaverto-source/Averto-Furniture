// The shopper's profile photo. Whatever comes in (JPG, PNG, WebP, a phone photo) is turned upright,
// cropped to a 400 × 400 square, converted to WebP and stripped of hidden data such as GPS location,
// then stored under avatars/<user id>/ in the "products" bucket. DELETE removes it.
import { randomUUID } from "crypto";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { getCustomer, type Customer } from "@/lib/customer-auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { productStorage } from "@/lib/supabase/storage";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

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

// Points the account at the new photo (or none) and drops the old file
async function setAvatar(customer: Customer, path: string) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.updateUser({ data: { avatar_path: path } });
  if (error) return false;
  // The photo lives inside the session token, so get a fresh one for the pages to show it
  await supabase.auth.refreshSession();
  if (customer.avatarPath && customer.avatarPath !== path) await productStorage().remove([customer.avatarPath]);
  revalidatePath("/account", "layout");
  return true;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail(403, "Uploads must come from this site.");
  const customer = await getCustomer();
  if (!customer) return fail(401, "Please log in again.");

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) return fail(413, "This photo is over 10 MB.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "The upload could not be read.");
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return fail(400, "Choose a photo to upload.");
  if (file.size > MAX_UPLOAD_BYTES) return fail(413, "This photo is over 10 MB.");

  let webp: Buffer;
  try {
    webp = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 80_000_000 })
      .rotate() // follow the phone's orientation flag, then drop it
      .resize({ width: 400, height: 400, fit: "cover", position: "attention" })
      .webp({ quality: 82 })
      .toBuffer(); // sharp leaves out EXIF/GPS unless asked to keep it
  } catch {
    return fail(415, "This file isn't a photo we can read. Please use JPG, PNG or WebP.");
  }

  const path = `avatars/${customer.id}/${randomUUID()}.webp`;
  const { error } = await productStorage().upload(path, webp, {
    contentType: "image/webp",
    cacheControl: "31536000", // every upload gets a new name, so it can be cached for a year
  });
  if (error) return fail(502, "The photo could not be stored. Please try again.");

  if (!(await setAvatar(customer, path))) {
    await productStorage().remove([path]);
    return fail(502, "The photo could not be saved. Please try again.");
  }
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return fail(403, "Requests must come from this site.");
  const customer = await getCustomer();
  if (!customer) return fail(401, "Please log in again.");
  if (!customer.avatarPath) return Response.json({ ok: true });
  if (!(await setAvatar(customer, ""))) return fail(502, "The photo could not be removed. Please try again.");
  return Response.json({ ok: true });
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdmin, requireAdmin } from "@/lib/admin-auth";
import { SECTION_HOME } from "@/lib/admin-roles";
import { createSupabaseServer } from "@/lib/supabase/server";
import { isBucketPath, productStorage } from "@/lib/supabase/storage";
import { slugify } from "@/lib/slug";
import { MAX_DELIVERY_DAYS } from "@/data/delivery";

// Shows admin edits on the shop straight away instead of after the 5-minute cache,
// and re-renders the admin page the change was made on
function refreshShop() {
  updateTag("catalog");
  revalidatePath("/admin", "layout");
}

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

// ─── Sign in / out ──────────────────────────────────────────────────────────

export interface LoginState {
  error?: string;
  email?: string;
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = text(formData, "email");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email and password don't match.", email };

  const admin = await getAdmin();
  if (!admin) {
    await supabase.auth.signOut();
    return { error: "This account doesn't have admin access.", email };
  }
  redirect(SECTION_HOME[admin.role]);
}

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ─── Products ───────────────────────────────────────────────────────────────

export interface ProductFormState {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
}

interface ColorInput {
  id?: string; // existing colour row
  name: string;
  hex: string;
  priceDelta: number;
}

function parseColors(raw: string): ColorInput[] | null {
  try {
    const data: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(data) || data.length > 20) return null;
    return data.map((c) => {
      const item = (c ?? {}) as Record<string, unknown>;
      return {
        id: typeof item.id === "string" && item.id ? item.id : undefined,
        name: String(item.name ?? "").trim().slice(0, 40),
        hex: String(item.hex ?? "").trim(),
        priceDelta: Math.round(Number(item.priceDelta)),
      };
    });
  } catch {
    return null;
  }
}

export async function saveProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin("products");

  const existingId = text(formData, "existingId");
  const name = text(formData, "name");
  const slug = existingId || slugify(text(formData, "slug") || name);
  const categoryId = text(formData, "categoryId");
  const badge = text(formData, "badge");
  const description = text(formData, "description");
  const specs = text(formData, "specs");
  const price = Number(text(formData, "priceInr"));
  const originalRaw = text(formData, "originalPriceInr");
  const original = originalRaw ? Number(originalRaw) : null;
  const sortOrder = Number(text(formData, "sortOrder") || 0);
  const isActive = formData.get("isActive") === "on";
  const onHomePage = formData.get("onHomePage") === "on";
  const colors = parseColors(text(formData, "colors"));

  const errors: Record<string, string> = {};
  if (name.length < 2 || name.length > 120) errors.name = "Name should be 2 to 120 characters.";
  if (!existingId && slug.length < 2) errors.slug = "Enter a web address name (letters and numbers).";
  if (!(await prisma.category.findUnique({ where: { id: categoryId } }))) errors.categoryId = "Choose a category.";
  if (badge.length > 40) errors.badge = "Keep the badge under 40 characters.";
  if (description.length < 10 || description.length > 3000) errors.description = "Description should be 10 to 3000 characters.";
  if (specs.length > 200) errors.specs = "Keep specs under 200 characters.";
  if (!Number.isInteger(price) || price < 1) errors.priceInr = "Enter the price in whole rupees.";
  // Delivery time in days: both empty hides it; one filled means an exact number of days
  const minRaw = text(formData, "deliveryMinDays");
  const maxRaw = text(formData, "deliveryMaxDays");
  const deliveryMinDays = minRaw ? Number(minRaw) : maxRaw ? Number(maxRaw) : null;
  const deliveryMaxDays = maxRaw ? Number(maxRaw) : deliveryMinDays;
  const validDays = (d: number | null) => d === null || (Number.isInteger(d) && d >= 1 && d <= MAX_DELIVERY_DAYS);
  if (!validDays(deliveryMinDays) || !validDays(deliveryMaxDays)) {
    errors.deliveryDays = `Use whole days from 1 to ${MAX_DELIVERY_DAYS}, or leave both empty.`;
  } else if (deliveryMinDays !== null && deliveryMaxDays !== null && deliveryMinDays > deliveryMaxDays) {
    errors.deliveryDays = "The first number should be the smaller one.";
  }
  if (original !== null && (!Number.isInteger(original) || original <= price)) {
    errors.originalPriceInr = "The original price must be higher than the price, or left empty.";
  }
  if (!Number.isInteger(sortOrder)) errors.sortOrder = "Use a whole number.";
  if (!colors) errors.colors = "The colours could not be read. Please try again.";
  else {
    colors.forEach((c, i) => {
      if (!c.name) errors.colors = `Colour ${i + 1} needs a name.`;
      else if (!/^#[0-9a-f]{6}$/i.test(c.hex)) errors.colors = `Colour "${c.name}" needs a colour code like #C9A36A.`;
      else if (!Number.isInteger(c.priceDelta) || c.priceDelta < 0) errors.colors = `Extra price for "${c.name}" must be 0 or more.`;
    });
    const slugs = colors.map((c) => c.name.toLowerCase());
    if (new Set(slugs).size !== slugs.length) errors.colors = "Two colours have the same name.";
  }
  if (!existingId && !errors.slug && (await prisma.product.findUnique({ where: { id: slug } }))) {
    errors.slug = "Another product already uses this web address.";
  }
  if (Object.keys(errors).length > 0) return { error: "Please check the highlighted fields.", fieldErrors: errors };

  const data = {
    name,
    categoryId,
    badge,
    description,
    specs,
    priceInr: price,
    originalPriceInr: original,
    deliveryMinDays,
    deliveryMaxDays,
    sortOrder,
    isActive,
    onHomePage,
  };

  try {
    await prisma.$transaction(async (tx) => {
      if (existingId) {
        const found = await tx.product.findUnique({ where: { id: existingId } });
        if (!found) throw new Error("missing");
        await tx.product.update({ where: { id: existingId }, data });
      } else {
        await tx.product.create({ data: { id: slug, ...data } });
      }

      // Colours: keep the ones still listed, add new ones, remove the rest. Saved carts refer to a
      // colour by its slug, so an existing colour keeps its slug even if it is renamed.
      const current = await tx.productColor.findMany({ where: { productId: slug } });
      const keepIds = new Set(colors!.flatMap((c) => (c.id ? [c.id] : [])));
      const removed = current.filter((c) => !keepIds.has(c.id)).map((c) => c.id);
      if (removed.length) {
        // their photos stay as general product photos rather than disappearing
        await tx.productImage.updateMany({ where: { colorId: { in: removed } }, data: { colorId: null } });
        await tx.productColor.deleteMany({ where: { id: { in: removed } } });
      }
      const usedSlugs = new Set(current.filter((c) => keepIds.has(c.id)).map((c) => c.slug));
      for (const [i, c] of colors!.entries()) {
        const fields = { name: c.name, hex: c.hex.toUpperCase(), priceDelta: c.priceDelta, sortOrder: i };
        const mine = c.id ? current.find((row) => row.id === c.id) : undefined;
        if (mine) {
          await tx.productColor.update({ where: { id: mine.id }, data: fields });
        } else {
          let colorSlug = slugify(c.name) || `colour-${i + 1}`;
          while (usedSlugs.has(colorSlug)) colorSlug = `${colorSlug}-${i + 1}`;
          usedSlugs.add(colorSlug);
          await tx.productColor.create({ data: { productId: slug, slug: colorSlug, ...fields } });
        }
      }
    });
  } catch {
    return { error: "The product could not be saved. Please try again." };
  }

  refreshShop();
  // Reload the page so the form starts again from what is now saved (new colours get their ids)
  redirect(`/admin/products/${slug}?${existingId ? "saved" : "created"}=1`);
}

// Show or hide a product straight from the list
export async function setProductActive(formData: FormData) {
  await requireAdmin("products");
  await prisma.product.updateMany({
    where: { id: text(formData, "id") },
    data: { isActive: formData.get("active") === "true" },
  });
  refreshShop();
}

// Add a product to, or take it off, "Selected pieces" on the home page straight from the list
export async function setProductOnHomePage(formData: FormData) {
  await requireAdmin("products");
  await prisma.product.updateMany({
    where: { id: text(formData, "id") },
    data: { onHomePage: formData.get("onHomePage") === "true" },
  });
  refreshShop();
}

// Add a product to, or take it off, the home page's signature slider (Admin → Home slider)
export async function setProductInShowcase(formData: FormData) {
  await requireAdmin("products");
  const id = text(formData, "id");
  if (formData.get("inShowcase") === "true") {
    // A new slide goes to the end
    const last = await prisma.product.aggregate({ where: { inShowcase: true }, _max: { showcaseOrder: true } });
    await prisma.product.updateMany({
      where: { id, inShowcase: false },
      data: { inShowcase: true, showcaseOrder: (last._max.showcaseOrder ?? 0) + 1 },
    });
  } else {
    await prisma.product.updateMany({ where: { id }, data: { inShowcase: false } });
  }
  refreshShop();
}

// Swap a slide with the one before or after it
export async function moveShowcasePiece(formData: FormData) {
  await requireAdmin("products");
  const id = text(formData, "id");
  const step = formData.get("direction") === "up" ? -1 : 1;
  const slides = await prisma.product.findMany({
    where: { inShowcase: true },
    orderBy: [{ showcaseOrder: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: { id: true },
  });
  const from = slides.findIndex((s) => s.id === id);
  const to = from + step;
  if (from < 0 || to < 0 || to >= slides.length) return;
  [slides[from], slides[to]] = [slides[to], slides[from]];
  // Renumber them all, so slides added before ordering existed get a place too
  await prisma.$transaction(
    slides.map((s, i) => prisma.product.update({ where: { id: s.id }, data: { showcaseOrder: i + 1 } })),
  );
  refreshShop();
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin("products");
  const id = text(formData, "id");
  const images = await prisma.productImage.findMany({ where: { productId: id }, select: { path: true } });
  // Past orders keep their own copy of the name and price, so they are unaffected
  await prisma.product.delete({ where: { id } });
  const files = images.map((i) => i.path).filter(isBucketPath);
  if (files.length) await productStorage().remove(files);
  refreshShop();
  redirect("/admin/products?deleted=1");
}

// ─── Photos ─────────────────────────────────────────────────────────────────

export async function updateImage(formData: FormData) {
  await requireAdmin("products");
  const id = text(formData, "id");
  const image = await prisma.productImage.findUnique({ where: { id } });
  if (!image) return;
  const colorId = text(formData, "colorId");
  const color = colorId
    ? await prisma.productColor.findFirst({ where: { id: colorId, productId: image.productId } })
    : null;
  await prisma.productImage.update({
    where: { id },
    data: {
      label: text(formData, "label").slice(0, 120),
      fit: formData.get("fit") === "contain" ? "contain" : "cover",
      colorId: color?.id ?? null,
    },
  });
  refreshShop();
}

// Swaps a photo with its neighbour, which is how the order of the gallery is changed
export async function moveImage(formData: FormData) {
  await requireAdmin("products");
  const id = text(formData, "id");
  const direction = text(formData, "direction") === "up" ? -1 : 1;
  const image = await prisma.productImage.findUnique({ where: { id } });
  if (!image) return;
  const all = await prisma.productImage.findMany({
    where: { productId: image.productId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  const index = all.findIndex((i) => i.id === id);
  const other = all[index + direction];
  if (!other) return;
  // renumber everything so equal sort orders can't get stuck
  const order = all.map((i) => i.id);
  [order[index], order[index + direction]] = [order[index + direction], order[index]];
  await prisma.$transaction(
    order.map((imageId, i) => prisma.productImage.update({ where: { id: imageId }, data: { sortOrder: i } })),
  );
  refreshShop();
}

// Puts a photo first and makes it a photo for all colours, so the shop uses it as the main photo
export async function makeMainImage(formData: FormData) {
  await requireAdmin("products");
  const id = text(formData, "id");
  const image = await prisma.productImage.findUnique({ where: { id } });
  if (!image) return;
  const all = await prisma.productImage.findMany({
    where: { productId: image.productId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  const order = [id, ...all.map((i) => i.id).filter((other) => other !== id)];
  await prisma.$transaction([
    prisma.productImage.update({ where: { id }, data: { colorId: null } }),
    ...order.map((imageId, i) => prisma.productImage.update({ where: { id: imageId }, data: { sortOrder: i } })),
  ]);
  refreshShop();
}

export async function deleteImage(formData: FormData) {
  await requireAdmin("products");
  const id = text(formData, "id");
  const image = await prisma.productImage.findUnique({ where: { id } });
  if (!image) return;
  await prisma.productImage.delete({ where: { id } });
  if (isBucketPath(image.path)) await productStorage().remove([image.path]);
  refreshShop();
}

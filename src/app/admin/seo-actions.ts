"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { DESCRIPTION_MAX, STATIC_PAGES } from "@/lib/seo";
import type { FormState } from "@/app/admin/store-actions";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
// An image path from the media upload (seo/…), or empty to clear it
const imagePath = (formData: FormData, key: string) => {
  const value = text(formData, key);
  return /^seo\/[\w-]+\.webp$/.test(value) ? value : null;
};

const TITLE_LIMIT = 120;
const DESCRIPTION_LIMIT = 320;

function tooLong(title: string, description: string) {
  if (title.length > TITLE_LIMIT) return `Keep the title under ${TITLE_LIMIT} characters.`;
  if (description.length > DESCRIPTION_LIMIT) return `Keep the description under ${DESCRIPTION_LIMIT} characters.`;
  return undefined;
}

// Search Console's HTML tag can be pasted whole; keep only the code from content="…"
const verificationCode = (value: string) => value.match(/content=["']([^"']+)["']/)?.[1] ?? value;

function refresh() {
  updateTag("seo");
  revalidatePath("/admin/seo");
}

export async function saveSeoSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("seo");
  const data = {
    siteName: text(formData, "siteName"),
    defaultTitle: text(formData, "defaultTitle"),
    defaultDescription: text(formData, "defaultDescription"),
    ogImage: imagePath(formData, "ogImage"),
    googleVerification: verificationCode(text(formData, "googleVerification")),
    bingVerification: verificationCode(text(formData, "bingVerification")),
  };
  if (!data.siteName) return { error: "Enter the site name." };
  const error = tooLong(data.defaultTitle, data.defaultDescription);
  if (error) return { error };

  await prisma.seoSettings.upsert({ where: { id: "site" }, create: { id: "site", ...data }, update: data });
  refresh();
  return { ok: "Saved. Search engines pick this up on their next visit." };
}

export async function savePageSeo(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("seo");
  const path = text(formData, "path");
  if (!STATIC_PAGES.some((p) => p.path === path)) return { error: "Unknown page." };
  const data = {
    title: text(formData, "title"),
    description: text(formData, "description"),
    ogImage: imagePath(formData, "ogImage"),
    noindex: formData.get("noindex") === "on",
  };
  const error = tooLong(data.title, data.description);
  if (error) return { error };

  await prisma.pageSeo.upsert({ where: { path }, create: { path, ...data }, update: data });
  refresh();
  return { ok: "Saved." };
}

export async function saveProductSeo(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("seo");
  const id = text(formData, "id");
  const seoTitle = text(formData, "title");
  const seoDescription = text(formData, "description");
  const error = tooLong(seoTitle, seoDescription);
  if (error) return { error };

  const updated = await prisma.product.updateMany({
    where: { id },
    data: { seoTitle: seoTitle || null, seoDescription: seoDescription || null },
  });
  if (!updated.count) return { error: "That product no longer exists." };
  updateTag("catalog");
  revalidatePath("/admin/seo");
  return {
    ok:
      seoDescription.length > DESCRIPTION_MAX
        ? `Saved. Google usually shows about ${DESCRIPTION_MAX} characters of a description.`
        : "Saved.",
  };
}

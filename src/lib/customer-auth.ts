// Who the signed-in shopper is. Customers and the admin share Supabase Auth; the admin is simply
// an account whose email is in ADMIN_EMAILS (see admin-auth.ts).
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { imageUrl } from "@/lib/catalog";
import { sessionExists } from "@/lib/sessions";

export const CONTACT_PREFS = ["call", "whatsapp", "email"] as const;
export type ContactPref = (typeof CONTACT_PREFS)[number];

export interface Customer {
  id: string;
  sessionId: string; // this login, in auth.sessions
  email: string; // lower case
  name: string;
  phone: string;
  avatarPath: string; // in the "products" bucket, under avatars/<id>/
  avatar: string; // public URL, or "" for none
  whatsapp: string;
  birthday: string; // YYYY-MM-DD, or ""
  contactPref: ContactPref;
}

// Shoppers can edit their own metadata straight from the browser, so only trust a photo path
// inside their own avatars folder
export const ownAvatarPath = (userId: string, path: unknown): path is string =>
  typeof path === "string" && path.startsWith(`avatars/${userId}/`) && !path.includes("..");

export const displayName = (c: Customer) => c.name || c.email.split("@")[0];

// Two letters for the round badge shown when there is no photo
export const initials = (c: Customer) =>
  displayName(c)
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const str = (v: unknown) => (typeof v === "string" ? v : "");

// getClaims() verifies the session token's signature, so a forged cookie is rejected. The token
// stays valid for up to an hour, so the login itself is looked up too: one removed from another
// device ("Where you're logged in") is signed out at once.
export const getCustomer = cache(async (): Promise<Customer | null> => {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub || typeof claims.email !== "string" || !claims.email) return null;
  const sessionId = str(claims.session_id);
  if (!(await sessionExists(sessionId))) return null;
  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const avatarPath = ownAvatarPath(claims.sub, meta.avatar_path) ? meta.avatar_path : "";
  const contactPref = CONTACT_PREFS.find((p) => p === meta.contact_pref) ?? "call";
  return {
    id: claims.sub,
    sessionId,
    email: claims.email.toLowerCase(),
    name: str(meta.full_name),
    phone: str(meta.phone),
    avatarPath,
    avatar: avatarPath ? imageUrl(avatarPath) : "",
    whatsapp: str(meta.whatsapp),
    birthday: /^\d{4}-\d{2}-\d{2}$/.test(str(meta.birthday)) ? str(meta.birthday) : "",
    contactPref,
  };
});

// For pages that need an account: sends visitors to the login page and back here afterwards
export async function requireCustomer(returnTo: string) {
  const customer = await getCustomer();
  if (!customer) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return customer;
}

// Only same-site paths are allowed as a place to return to after signing in
export function safeNext(value: unknown, fallback = "/account") {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

// Who the signed-in shopper is. Customers and the admin share Supabase Auth; the admin is simply
// an account whose email is in ADMIN_EMAILS (see admin-auth.ts).
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export interface Customer {
  id: string;
  email: string; // lower case
  name: string;
  phone: string;
}

// getClaims() verifies the session token's signature, so a forged cookie is rejected
export const getCustomer = cache(async (): Promise<Customer | null> => {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub || typeof claims.email !== "string" || !claims.email) return null;
  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: claims.sub,
    email: claims.email.toLowerCase(),
    name: typeof meta.full_name === "string" ? meta.full_name : "",
    phone: typeof meta.phone === "string" ? meta.phone : "",
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

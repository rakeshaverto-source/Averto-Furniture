// The one place that decides who may use the admin panel. Every admin page, Server Action and
// Route Handler calls one of these itself; the proxy redirect is only a convenience.
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

function allowedEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// The signed-in admin's email, or null. getUser() asks Supabase Auth, so a forged cookie fails.
export const getAdmin = cache(async (): Promise<{ email: string } | null> => {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (!email || !allowedEmails().includes(email)) return null;
  return { email };
});

// For admin pages and Server Actions: sends anyone else to the login page
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

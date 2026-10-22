// The one place that decides who may use the admin panel, and which parts of it. Every admin page,
// Server Action and Route Handler calls one of these itself; the proxy redirect is only a convenience.
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSupabaseServer } from "@/lib/supabase/server";
import { SECTION_HOME, canUse, type AdminSection, type StaffRole } from "@/lib/admin-roles";

export type { AdminSection, StaffRole };

function ownerEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export interface Admin {
  email: string;
  role: StaffRole;
}

// The signed-in admin and their role, or null. getUser() asks Supabase Auth, so a forged cookie fails.
// ADMIN_EMAILS are always owners; anyone else needs a row in the Team list.
export const getAdmin = cache(async (): Promise<Admin | null> => {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (!email) return null;
  if (ownerEmails().includes(email)) return { email, role: "owner" };
  const member = await prisma.staffMember.findUnique({ where: { email }, select: { role: true } });
  return member ? { email, role: member.role } : null;
});

// The admin, only if their role includes this section
export async function getAdminFor(section: AdminSection) {
  const admin = await getAdmin();
  return admin && canUse(admin.role, section) ? admin : null;
}

// For admin pages and Server Actions: sends signed-out visitors to the login page, and staff
// without this section to the first page their role does have
export async function requireAdmin(section: AdminSection) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (!canUse(admin.role, section)) redirect(SECTION_HOME[admin.role]);
  return admin;
}

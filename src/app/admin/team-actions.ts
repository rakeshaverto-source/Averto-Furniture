"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { ROLES } from "@/lib/admin-roles";
import type { StaffRole } from "@/generated/prisma/client";
import type { FormState } from "@/app/admin/store-actions";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const isRole = (value: string): value is StaffRole => ROLES.some((r) => r.value === value);
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function ownerEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// Adds someone to the team, or changes the role of someone already on it
export async function saveStaffMember(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin("team");
  const email = text(formData, "email").toLowerCase();
  const role = text(formData, "role");
  if (!isEmail(email)) return { error: "Enter a valid email address." };
  if (!isRole(role)) return { error: "Choose a role." };
  if (ownerEmails().includes(email)) return { error: "This email is already an owner (set in ADMIN_EMAILS)." };
  if (email === admin.email) return { error: "You can't change your own role." };

  await prisma.staffMember.upsert({
    where: { email },
    create: { email, role, addedBy: admin.email },
    update: { role },
  });
  revalidatePath("/admin", "layout");
  return { ok: `Saved. ${email} can now sign in at /admin/login.` };
}

export async function removeStaffMember(formData: FormData) {
  const admin = await requireAdmin("team");
  const email = text(formData, "email").toLowerCase();
  if (email === admin.email) return; // never lock yourself out
  await prisma.staffMember.deleteMany({ where: { email } });
  revalidatePath("/admin", "layout");
}

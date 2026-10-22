import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin-auth";
import { SECTION_HOME } from "@/lib/admin-roles";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin sign in | Averto",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const admin = await getAdmin();
  if (admin) redirect(SECTION_HOME[admin.role]);

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500 text-center">Averto</p>
        <h1 className="mt-2 font-serif text-4xl text-[#111110] text-center">Admin</h1>
        <AdminLoginForm />
      </div>
    </main>
  );
}

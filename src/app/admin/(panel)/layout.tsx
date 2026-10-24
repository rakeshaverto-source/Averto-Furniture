import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/admin-auth";
import { canUse, roleLabel } from "@/lib/admin-roles";
import { PLACED_ORDER } from "@/lib/orders";
import AdminNav from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "Admin | Averto",
  robots: { index: false, follow: false },
};

// Shell only. Each page checks the admin itself with requireAdmin(), because a layout
// doesn't re-run on every navigation.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  const [pendingReviews, newOrders, newReturns] = admin
    ? await Promise.all([
        canUse(admin.role, "reviews") ? prisma.review.count({ where: { status: "pending" } }) : 0,
        canUse(admin.role, "orders") ? prisma.order.count({ where: { ...PLACED_ORDER, fulfillment: "new" } }) : 0,
        canUse(admin.role, "orders") ? prisma.returnRequest.count({ where: { status: "requested" } }) : 0,
      ])
    : [0, 0, 0];

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {admin && (
        <AdminNav
          email={admin.email}
          role={admin.role}
          roleName={roleLabel(admin.role)}
          pendingReviews={pendingReviews}
          newOrders={newOrders}
          newReturns={newReturns}
        />
      )}
      <main className="lg:pl-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CheckoutClient from "@/components/cart/CheckoutClient";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";

export const metadata: Metadata = {
  title: "Checkout | Averto",
  robots: { index: false, follow: false },
};

// Ordering needs an account: signed-out visitors go to the login page and come back here
export default async function CheckoutPage() {
  const customer = await requireCustomer("/checkout");
  // Saved addresses (default first) save typing for returning customers
  const addresses = await prisma.address.findMany({
    where: { userId: customer.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: { id: true, label: true, name: true, phone: true, address: true, city: true, state: true, pincode: true },
  });
  const first = addresses[0];
  const last = first
    ? { customerName: first.name, customerPhone: first.phone, ...first }
    : await prisma.order.findFirst({
        where: { userId: customer.id },
        orderBy: { createdAt: "desc" },
        select: { customerName: true, customerPhone: true, address: true, city: true, state: true, pincode: true },
      });

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <section className="px-6 sm:px-10 lg:px-16 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <CheckoutClient
            addresses={addresses}
            prefill={{
              email: customer.email,
              name: last?.customerName ?? customer.name,
              phone: last?.customerPhone ?? customer.phone,
              address: last?.address ?? "",
              city: last?.city ?? "",
              state: last?.state ?? "",
              pincode: last?.pincode ?? "",
            }}
          />
        </div>
      </section>
      <Footer />
    </main>
  );
}

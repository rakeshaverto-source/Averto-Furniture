import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CheckoutClient from "@/components/cart/CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout | Averto",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <section className="px-6 sm:px-10 lg:px-16 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <CheckoutClient />
        </div>
      </section>
      <Footer />
    </main>
  );
}

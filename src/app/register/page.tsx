import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RegisterForm from "@/components/auth/RegisterForm";
import { getCustomer, safeNext } from "@/lib/customer-auth";

export const metadata: Metadata = {
  title: "Create account | Averto",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getCustomer()) redirect(next);

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <Navbar />
      <section className="flex-1 px-6 py-16 sm:py-24">
        <RegisterForm next={next} />
      </section>
      <Footer />
    </main>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LoginForm from "@/components/auth/LoginForm";
import { getCustomer, safeNext } from "@/lib/customer-auth";

export const metadata: Metadata = {
  title: "Login | Averto",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; link?: string }> }) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getCustomer()) redirect(next);

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <Navbar />
      <section className="flex-1 px-6 py-16 sm:py-24">
        <LoginForm
          next={next}
          message={params.link ? "Your email is confirmed (or the link has expired). Please log in." : undefined}
        />
      </section>
      <Footer />
    </main>
  );
}

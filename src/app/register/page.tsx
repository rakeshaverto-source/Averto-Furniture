import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create account | Averto",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <Navbar />
      <section className="flex-1 px-6 py-16 sm:py-24">
        <RegisterForm />
      </section>
      <Footer />
    </main>
  );
}

import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ForgotPasswordForm } from "@/components/auth/PasswordForms";

export const metadata: Metadata = {
  title: "Forgot password | Averto",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <Navbar />
      <section className="flex-1 px-6 py-16 sm:py-24">
        <div className="w-full max-w-md mx-auto">
          <h1 className="font-serif text-4xl sm:text-5xl text-[#111110] text-center">Forgot password</h1>
          <p className="mt-3 text-sm text-stone-500 text-center">We will email you a code to set a new one.</p>
          <ForgotPasswordForm />
        </div>
      </section>
      <Footer />
    </main>
  );
}

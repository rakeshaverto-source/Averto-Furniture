"use client";

import { useState } from "react";
import Link from "next/link";

const inputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors";

export default function LoginForm() {
  const [notice, setNotice] = useState("");

  // Accounts are not built yet, so this form deliberately does not pretend to sign anyone in
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotice("Login is not switched on yet. You can still browse and place orders as a guest.");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="font-serif text-4xl sm:text-5xl text-[#111110] text-center">Login</h1>
      <p className="mt-3 text-sm text-stone-500 text-center">Sign in to see your orders and saved pieces.</p>

      <form onSubmit={submit} className="mt-10 space-y-5">
        {notice && (
          <p role="status" className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
            {notice}
          </p>
        )}
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-stone-900 mb-2">
            Email
          </label>
          <input id="login-email" type="email" autoComplete="email" required className={inputClass} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="login-password" className="text-sm font-medium text-stone-900">
              Password
            </label>
            <span className="text-xs text-stone-400">Forgot password?</span>
          </div>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-[#E08A50] hover:bg-[#cf7b43] text-white text-sm font-medium cursor-pointer transition-colors"
        >
          Login
        </button>
      </form>

      <p className="mt-8 text-sm text-stone-500 text-center">
        New to Averto?{" "}
        <Link href="/register" className="underline underline-offset-4 text-stone-900">
          Create an account
        </Link>
      </p>
    </div>
  );
}

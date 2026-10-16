"use client";

import { startTransition, useActionState } from "react";
import Link from "next/link";
import { signInCustomer, type AuthFormState } from "@/app/actions/account";

const inputClass =
  "w-full rounded-sm border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors";

export default function LoginForm({ next, message }: { next: string; message?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signInCustomer, {});
  const withNext = (path: string) => (next !== "/account" ? `${path}?next=${encodeURIComponent(next)}` : path);

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="font-serif text-4xl sm:text-5xl text-[#111110] text-center">Login</h1>
      <p className="mt-3 text-sm text-stone-500 text-center">
        {next === "/checkout" ? "Please log in to place your order." : "Sign in to see your orders."}
      </p>

      <form
        // onSubmit keeps what was typed if the password was wrong (form actions reset the fields)
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          startTransition(() => action(formData));
        }}
        className="mt-10 space-y-5"
      >
        <input type="hidden" name="next" value={next} />
        {(state.error || message) && (
          <p
            role={state.error ? "alert" : "status"}
            className={`rounded-sm px-4 py-3 text-sm border ${
              state.error ? "bg-red-50 border-red-200 text-red-800" : "bg-amber-50 border-amber-200 text-amber-900"
            }`}
          >
            {state.error ?? message}
          </p>
        )}
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-stone-900 mb-2">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.values?.email}
            required
            className={inputClass}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="login-password" className="text-sm font-medium text-stone-900">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-stone-500 hover:text-stone-900 underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full py-3.5 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] disabled:opacity-60 text-white text-sm font-medium cursor-pointer transition-colors"
        >
          {pending ? "Signing in…" : "Login"}
        </button>
      </form>

      <p className="mt-8 text-sm text-stone-500 text-center">
        New to Averto?{" "}
        <Link href={withNext("/register")} className="underline underline-offset-4 text-stone-900">
          Create an account
        </Link>
      </p>
    </div>
  );
}

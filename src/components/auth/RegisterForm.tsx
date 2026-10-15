"use client";

import { useState } from "react";
import Link from "next/link";

const inputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors";

type Errors = Partial<Record<"name" | "email" | "phone" | "password" | "confirm", string>>;

export default function RegisterForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState("");

  // Checks the form like a real one would, but does not create an account: that needs a backend
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (key: string) => String(data.get(key) ?? "").trim();

    const next: Errors = {};
    if (get("name").length < 2) next.name = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(get("email"))) next.email = "Please enter a valid email address.";
    const digits = get("phone").replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 13) next.phone = "Please enter a valid phone number.";
    if (String(data.get("password") ?? "").length < 8) next.password = "Use at least 8 characters.";
    if (data.get("password") !== data.get("confirm")) next.confirm = "The two passwords do not match.";

    setErrors(next);
    setNotice(
      Object.keys(next).length === 0
        ? "Registration is not switched on yet, so no account was created. You can still browse and place orders as a guest."
        : "",
    );
  };

  const field = (
    name: keyof Errors,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <div>
      <label htmlFor={`reg-${name}`} className="block text-sm font-medium text-stone-900 mb-2">
        {label}
      </label>
      <input id={`reg-${name}`} name={name} className={inputClass} aria-invalid={!!errors[name]} {...props} />
      {errors[name] && <p className="mt-1.5 text-xs text-red-700">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="font-serif text-4xl sm:text-5xl text-[#111110] text-center">Create account</h1>
      <p className="mt-3 text-sm text-stone-500 text-center">
        Keep track of your orders and save the pieces you love.
      </p>

      <form onSubmit={submit} noValidate className="mt-10 space-y-5">
        {notice && (
          <p role="status" className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
            {notice}
          </p>
        )}
        {field("name", "Full name", { type: "text", autoComplete: "name", maxLength: 80 })}
        {field("email", "Email", { type: "email", autoComplete: "email", maxLength: 120 })}
        {field("phone", "Phone", { type: "tel", autoComplete: "tel", inputMode: "tel", maxLength: 20 })}
        {field("password", "Password", { type: "password", autoComplete: "new-password", maxLength: 100 })}
        {field("confirm", "Confirm password", { type: "password", autoComplete: "new-password", maxLength: 100 })}
        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-[#E08A50] hover:bg-[#cf7b43] text-white text-sm font-medium cursor-pointer transition-colors"
        >
          Create account
        </button>
      </form>

      <p className="mt-8 text-sm text-stone-500 text-center">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-4 text-stone-900">
          Login
        </Link>
      </p>
    </div>
  );
}

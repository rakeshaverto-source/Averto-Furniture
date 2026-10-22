"use client";

import { startTransition, useActionState, useRef } from "react";
import Link from "next/link";
import { signUpCustomer, verifySignupCode, type AuthFormState } from "@/app/actions/account";
import { CodeInput, ResendButton } from "./CodeStep";

const inputClass =
  "w-full rounded-sm border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors";

type Field = "name" | "email" | "phone" | "password" | "confirm";

export default function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signUpCustomer, {});
  // The filled-in form, so "send a new code" can repeat the signup without retyping
  const lastForm = useRef<FormData | null>(null);
  const resend = () => {
    if (lastForm.current) startTransition(() => action(lastForm.current!));
  };
  const errors = state.fieldErrors ?? {};

  const field = (name: Field, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={`reg-${name}`} className="block text-sm font-medium text-stone-900 mb-2">
        {label}
      </label>
      <input
        id={`reg-${name}`}
        name={name}
        className={inputClass}
        aria-invalid={!!errors[name]}
        defaultValue={name === "name" || name === "email" || name === "phone" ? state.values?.[name] : undefined}
        {...props}
      />
      {errors[name] && <p className="mt-1.5 text-xs text-red-700">{errors[name]}</p>}
    </div>
  );

  if (state.step === "verify" && state.values?.email) {
    return <VerifyStep email={state.values.email} next={next} sendError={state.error} resend={resend} sending={pending} />;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="font-serif text-4xl sm:text-5xl text-[#111110] text-center">Create account</h1>
      <p className="mt-3 text-sm text-stone-500 text-center">You need an account to order and to track your orders.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          lastForm.current = formData;
          startTransition(() => action(formData));
        }}
        noValidate
        className="mt-10 space-y-5"
      >
        <input type="hidden" name="next" value={next} />
        {state.error && (
          <p role="alert" className="rounded-sm bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {state.error}
          </p>
        )}
        {field("name", "Full name", { type: "text", autoComplete: "name", maxLength: 80 })}
        {field("email", "Email", { type: "email", autoComplete: "email", maxLength: 120 })}
        {field("phone", "Phone", { type: "tel", autoComplete: "tel", inputMode: "tel", maxLength: 20 })}
        {field("password", "Password", { type: "password", autoComplete: "new-password", maxLength: 72 })}
        {field("confirm", "Confirm password", { type: "password", autoComplete: "new-password", maxLength: 72 })}
        <button
          type="submit"
          disabled={pending}
          className="w-full py-3.5 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] disabled:opacity-60 text-white text-sm font-medium cursor-pointer transition-colors"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-sm text-stone-500 text-center">
        Already have an account?{" "}
        <Link
          href={next !== "/account" ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="underline underline-offset-4 text-stone-900"
        >
          Login
        </Link>
      </p>
    </div>
  );
}

// Second step: the code from the email confirms the address and signs the customer in
function VerifyStep({
  email,
  next,
  sendError,
  resend,
  sending,
}: {
  email: string;
  next: string;
  sendError?: string;
  resend: () => void;
  sending: boolean;
}) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(verifySignupCode, {});

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="font-serif text-4xl sm:text-5xl text-[#111110] text-center">Check your email</h1>
      <p className="mt-3 text-sm text-stone-500 text-center">
        We sent a code to <span className="text-stone-900 font-medium">{email}</span>. It can take a minute; look in spam
        too.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          startTransition(() => action(formData));
        }}
        noValidate
        className="mt-10 space-y-5"
      >
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        {(state.error ?? sendError) && (
          <p role="alert" className="rounded-sm bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {state.error ?? sendError}
          </p>
        )}
        <CodeInput error={state.fieldErrors?.code} />
        <button
          type="submit"
          disabled={pending}
          className="w-full py-3.5 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] disabled:opacity-60 text-white text-sm font-medium cursor-pointer transition-colors"
        >
          {pending ? "Checking…" : "Confirm and continue"}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between gap-4">
        <ResendButton onResend={resend} pending={sending} />
        <a href="/register" className="text-sm text-stone-500 hover:text-stone-900">
          Use a different email
        </a>
      </div>
    </div>
  );
}

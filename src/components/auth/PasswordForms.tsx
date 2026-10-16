"use client";

import { startTransition, useActionState } from "react";
import { requestPasswordReset, updatePassword, type AuthFormState } from "@/app/actions/account";

const inputClass =
  "w-full rounded-sm border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors";
const buttonClass =
  "w-full py-3.5 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] disabled:opacity-60 text-white text-sm font-medium cursor-pointer transition-colors";

function Messages({ state }: { state: AuthFormState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-sm bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
        {state.error}
      </p>
    );
  }
  if (state.notice) {
    return (
      <p role="status" className="rounded-sm bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900">
        {state.notice}
      </p>
    );
  }
  return null;
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(requestPasswordReset, {});
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="mt-10 space-y-5"
    >
      <Messages state={state} />
      <div>
        <label htmlFor="fp-email" className="block text-sm font-medium text-stone-900 mb-2">
          Email
        </label>
        <input id="fp-email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} className={inputClass} />
      </div>
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Sending…" : "Send me a link"}
      </button>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(updatePassword, {});
  const errors = state.fieldErrors ?? {};
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="mt-10 space-y-5"
    >
      <Messages state={state} />
      {(["password", "confirm"] as const).map((name) => (
        <div key={name}>
          <label htmlFor={`np-${name}`} className="block text-sm font-medium text-stone-900 mb-2">
            {name === "password" ? "New password" : "Confirm new password"}
          </label>
          <input
            id={`np-${name}`}
            name={name}
            type="password"
            autoComplete="new-password"
            required
            maxLength={72}
            aria-invalid={!!errors[name]}
            className={inputClass}
          />
          {errors[name] && <p className="mt-1.5 text-xs text-red-700">{errors[name]}</p>}
        </div>
      ))}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}

"use client";

import { startTransition, useActionState } from "react";
import { requestPasswordReset, resetPasswordWithCode, updatePassword, type AuthFormState } from "@/app/actions/account";
import { CodeInput, ResendButton } from "./CodeStep";

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

  if (state.step === "verify" && state.values?.email) {
    const email = state.values.email;
    const resend = () => {
      const formData = new FormData();
      formData.set("email", email);
      startTransition(() => action(formData));
    };
    return <ResetWithCode email={email} sendState={state} resend={resend} sending={pending} />;
  }

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
        {pending ? "Sending…" : "Email me a code"}
      </button>
    </form>
  );
}

// Second step: the emailed code plus the new password, saved together
function ResetWithCode({
  email,
  sendState,
  resend,
  sending,
}: {
  email: string;
  sendState: AuthFormState;
  resend: () => void;
  sending: boolean;
}) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(resetPasswordWithCode, {});
  const errors = state.fieldErrors ?? {};

  return (
    <>
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
        <Messages state={state.error ? state : sendState} />
        <CodeInput error={errors.code} />
        {(["password", "confirm"] as const).map((name) => (
          <div key={name}>
            <label htmlFor={`rp-${name}`} className="block text-sm font-medium text-stone-900 mb-2">
              {name === "password" ? "New password" : "Confirm new password"}
            </label>
            <input
              id={`rp-${name}`}
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
      <div className="mt-6 flex items-center justify-between gap-4">
        <ResendButton onResend={resend} pending={sending} />
        <a href="/forgot-password" className="text-sm text-stone-500 hover:text-stone-900">
          Use a different email
        </a>
      </div>
    </>
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

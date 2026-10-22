"use client";

import { useEffect, useState } from "react";

const RESEND_AFTER_SECONDS = 60;

// The 6-digit code box shared by signup and password reset
export function CodeInput({ error }: { error?: string }) {
  return (
    <div>
      <label htmlFor="otp-code" className="block text-sm font-medium text-stone-900 mb-2">
        Code from the email
      </label>
      <input
        id="otp-code"
        name="code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]*"
        maxLength={12}
        required
        autoFocus
        aria-invalid={!!error}
        placeholder="Code"
        className="w-full rounded-sm border border-stone-300 bg-white px-4 py-3 text-center text-2xl tracking-[0.4em] text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 transition-colors"
      />
      {error && <p className="mt-1.5 text-xs text-red-700">{error}</p>}
    </div>
  );
}

// "Send a new code", available a minute after the last one was sent
export function ResendButton({ onResend, pending }: { onResend: () => void; pending: boolean }) {
  const [sentAt, setSentAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);
  const wait = Math.max(0, RESEND_AFTER_SECONDS - Math.floor((now - sentAt) / 1000));

  return (
    <button
      type="button"
      onClick={() => {
        setSentAt(Date.now());
        setNow(Date.now());
        onResend();
      }}
      disabled={pending || wait > 0}
      className="text-sm text-stone-900 underline underline-offset-4 disabled:text-stone-400 disabled:no-underline cursor-pointer disabled:cursor-default"
    >
      {pending ? "Sending…" : wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
    </button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const input =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3.5 text-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900";

export default function DriverLoginForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/driver/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: form.get("phone"), pin: form.get("pin"), web: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not sign in.");
        return;
      }
      router.replace("/driver");
      router.refresh();
    } catch {
      setError("No internet connection. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="dl-phone" className="mb-1.5 block font-medium text-stone-900">
          Mobile number
        </label>
        <input id="dl-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="98xxxxxxxx" className={input} />
      </div>
      <div>
        <label htmlFor="dl-pin" className="mb-1.5 block font-medium text-stone-900">
          PIN
        </label>
        <input
          id="dl-pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          required
          minLength={4}
          maxLength={6}
          className={`${input} tracking-[0.5em]`}
        />
      </div>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-[#E08A50] py-4 text-lg font-semibold text-white hover:bg-[#cf7b43] disabled:opacity-60 cursor-pointer"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

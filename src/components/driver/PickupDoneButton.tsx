"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// "Picked up" on a return pickup in the website version of the driver app
export default function PickupDoneButton({ orderRef, customerName }: { orderRef: string; customerName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function done() {
    if (!window.confirm(`Mark as picked up? You have collected the piece from ${customerName}.`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/driver/pickups/${encodeURIComponent(orderRef)}/picked-up`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/driver/login");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
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
    <div className="space-y-3 pb-8">
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={done}
        disabled={busy}
        className="w-full rounded-2xl bg-indigo-700 py-4 text-lg font-bold text-white hover:bg-indigo-800 disabled:opacity-60 cursor-pointer"
      >
        {busy ? "Saving…" : "✓ Picked up"}
      </button>
    </div>
  );
}

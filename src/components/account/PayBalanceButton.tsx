"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import { confirmBalancePayment, startBalancePayment } from "@/app/actions/account-data";
import { loadRazorpay, type RazorpayResponse } from "@/lib/razorpay-client";

export default function PayBalanceButton({
  orderRef,
  label,
  prefill,
}: {
  orderRef: string;
  label: string;
  prefill: { name: string; email: string; contact: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const pay = async () => {
    setBusy(true);
    setMessage(null);
    const started = await startBalancePayment(orderRef);
    if (!started.ok) {
      setMessage({ ok: false, text: started.error });
      setBusy(false);
      return;
    }
    if (!(await loadRazorpay()) || !window.Razorpay) {
      setMessage({ ok: false, text: "We could not load the payment window. Please check your connection." });
      setBusy(false);
      return;
    }
    new window.Razorpay({
      key: started.keyId,
      amount: started.amountPaise,
      currency: "INR",
      order_id: started.razorpayOrderId,
      name: "Averto Furniture",
      description: `Balance for order ${orderRef}`,
      prefill,
      theme: { color: "#1A1A18" },
      handler: async (response: RazorpayResponse) => {
        const result = await confirmBalancePayment({ ref: orderRef, ...response });
        setMessage(
          result.ok
            ? { ok: true, text: "Payment received. Thank you!" }
            : { ok: false, text: `${result.error} If money was deducted, please contact us with order ${orderRef}.` },
        );
        setBusy(false);
        if (result.ok) router.refresh();
      },
      modal: { ondismiss: () => setBusy(false) },
    }).open();
  };

  return (
    <div>
      <button
        type="button"
        onClick={pay}
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] disabled:opacity-60 px-6 py-3 text-sm font-medium text-white cursor-pointer transition-colors"
      >
        <CreditCard className="w-4 h-4" /> {busy ? "Opening payment…" : label}
      </button>
      {message && (
        <p role="status" className={`mt-2 text-sm ${message.ok ? "text-emerald-800" : "text-red-700"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}

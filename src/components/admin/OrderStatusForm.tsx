"use client";

import { startTransition, useActionState } from "react";
import { updateOrder, type FormState } from "@/app/admin/store-actions";
import { FULFILLMENT } from "@/lib/admin-format";
import type { FulfillmentStatus } from "@/generated/prisma/client";
import { inputClass, labelClass, primaryButton } from "./ui";

export default function OrderStatusForm({
  id,
  fulfillment,
  balancePaid,
  adminNote,
  balanceLabel,
}: {
  id: string;
  fulfillment: FulfillmentStatus;
  balancePaid: boolean;
  adminNote: string;
  balanceLabel: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateOrder, {});

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="space-y-4"
    >
      <input type="hidden" name="id" value={id} />
      <div>
        <label htmlFor="o-status" className={labelClass}>
          Status
        </label>
        <select id="o-status" name="fulfillment" defaultValue={fulfillment} className={inputClass}>
          {FULFILLMENT.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" name="balancePaid" defaultChecked={balancePaid} className="mt-0.5 w-4 h-4 accent-[#E08A50]" />
        <span className="text-sm text-stone-900">
          Balance received
          <span className="block text-xs text-stone-500">{balanceLabel}</span>
        </span>
      </label>
      <div>
        <label htmlFor="o-note" className={labelClass}>
          Team note <span className="font-normal text-stone-400">(only you see this)</span>
        </label>
        <textarea
          id="o-note"
          name="adminNote"
          defaultValue={adminNote}
          rows={3}
          maxLength={2000}
          placeholder="e.g. Called on 12 Oct, delivery fixed for 2 Nov"
          className={inputClass}
        />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : "Save"}
        </button>
        <p role="status" className={`text-sm ${state.error ? "text-red-700" : "text-emerald-800"}`}>
          {!pending && (state.error ?? state.ok)}
        </p>
      </div>
    </form>
  );
}

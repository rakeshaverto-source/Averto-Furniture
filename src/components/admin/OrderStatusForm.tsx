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
  expectedDelivery,
  courierName,
  trackingNumber,
  trackingUrl,
}: {
  id: string;
  fulfillment: FulfillmentStatus;
  balancePaid: boolean;
  adminNote: string;
  balanceLabel: string;
  expectedDelivery: string; // yyyy-mm-dd or ""
  courierName: string;
  trackingNumber: string;
  trackingUrl: string;
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

      <fieldset className="space-y-3 border-t border-stone-200 pt-4">
        <legend className="text-xs uppercase tracking-wider text-stone-500">
          Delivery <span className="normal-case tracking-normal">(the customer sees this)</span>
        </legend>
        <div>
          <label htmlFor="o-date" className={labelClass}>
            Expected delivery date
          </label>
          <input id="o-date" type="date" name="expectedDelivery" defaultValue={expectedDelivery} className={inputClass} />
        </div>
        <div>
          <label htmlFor="o-courier" className={labelClass}>
            Courier / transporter
          </label>
          <input
            id="o-courier"
            name="courierName"
            defaultValue={courierName}
            maxLength={80}
            placeholder="e.g. Delhivery, own van"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="o-tracking" className={labelClass}>
            Tracking number
          </label>
          <input id="o-tracking" name="trackingNumber" defaultValue={trackingNumber} maxLength={80} className={inputClass} />
        </div>
        <div>
          <label htmlFor="o-tracking-url" className={labelClass}>
            Tracking link
          </label>
          <input
            id="o-tracking-url"
            name="trackingUrl"
            type="url"
            defaultValue={trackingUrl}
            maxLength={500}
            placeholder="https://"
            className={inputClass}
          />
        </div>
      </fieldset>

      <div className="border-t border-stone-200 pt-4">
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

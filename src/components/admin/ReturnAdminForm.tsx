"use client";

import { startTransition, useActionState, useState } from "react";
import { updateReturn, type FormState } from "@/app/admin/store-actions";
import { RETURN_STATUSES } from "@/data/returns";
import type { ReturnStatus } from "@/generated/prisma/client";
import { inputClass, labelClass, primaryButton } from "./ui";

export default function ReturnAdminForm({
  id,
  status,
  teamMessage,
  adminNote,
  pickupDate,
  pickupSlot,
  driverId,
  drivers,
  refundAmount,
  orderTotal,
}: {
  id: string;
  status: ReturnStatus;
  teamMessage: string;
  adminNote: string;
  pickupDate: string; // yyyy-mm-dd or ""
  pickupSlot: string;
  driverId: string | null;
  drivers: { id: string; name: string; vehicleNumber: string; isActive: boolean }[];
  refundAmount: number | null;
  orderTotal: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateReturn, {});
  // Pickup and refund fields only matter from the step where they are needed
  const [chosen, setChosen] = useState<ReturnStatus>(status);
  const showPickup = chosen === "approved" || chosen === "pickup_scheduled" || chosen === "picked_up" || chosen === "refunded";
  const showRefund = chosen === "picked_up" || chosen === "refunded";

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
        <label htmlFor="r-status" className={labelClass}>
          Return status
        </label>
        <select
          id="r-status"
          name="status"
          value={chosen}
          onChange={(e) => setChosen(e.target.value as ReturnStatus)}
          className={inputClass}
        >
          {RETURN_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className={showPickup ? "space-y-3 border-t border-stone-200 pt-4" : "hidden"}>
        <p className="text-xs uppercase tracking-wider text-stone-500">
          Pickup <span className="normal-case tracking-normal">(the customer sees this)</span>
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="r-date" className={labelClass}>
              Date
            </label>
            <input id="r-date" type="date" name="pickupDate" defaultValue={pickupDate} className={inputClass} />
          </div>
          <div>
            <label htmlFor="r-slot" className={labelClass}>
              Time
            </label>
            <input id="r-slot" name="pickupSlot" defaultValue={pickupSlot} maxLength={40} placeholder="e.g. 10am – 1pm" className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="r-driver" className={labelClass}>
            Driver
          </label>
          <select id="r-driver" name="driverId" defaultValue={driverId ?? ""} className={inputClass}>
            <option value="">None (courier or the office arranges it)</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
                {d.vehicleNumber ? ` · ${d.vehicleNumber}` : ""}
                {d.isActive ? "" : " (turned off)"}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-stone-500">The pickup shows in their driver app once the status is &ldquo;Pickup scheduled&rdquo;.</p>
        </div>
      </div>

      <div className={showRefund ? "border-t border-stone-200 pt-4" : "hidden"}>
        <label htmlFor="r-refund" className={labelClass}>
          Refund amount (₹)
        </label>
        <input
          id="r-refund"
          name="refundAmount"
          type="number"
          min={1}
          step={1}
          defaultValue={refundAmount ?? ""}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-stone-500">Order total {orderTotal}. Send the money first, then mark it Refunded.</p>
      </div>

      <div className="border-t border-stone-200 pt-4">
        <label htmlFor="r-message" className={labelClass}>
          Message to the customer
        </label>
        <textarea
          id="r-message"
          name="teamMessage"
          defaultValue={teamMessage}
          maxLength={1000}
          rows={3}
          placeholder={chosen === "rejected" ? "Why it can't be returned" : "Optional, shown on their order page"}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="r-note" className={labelClass}>
          Note for the team
        </label>
        <textarea id="r-note" name="adminNote" defaultValue={adminNote} maxLength={2000} rows={2} className={inputClass} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : "Save return"}
        </button>
        <p role="status" className={`text-sm ${state.error ? "text-red-700" : "text-emerald-800"}`}>
          {!pending && (state.error ?? state.ok)}
        </p>
      </div>
    </form>
  );
}

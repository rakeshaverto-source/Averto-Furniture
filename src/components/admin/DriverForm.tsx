"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { saveDriver, type FormState } from "@/app/admin/store-actions";
import { inputClass, labelClass, primaryButton } from "./ui";

// Adds a driver, or edits one when `driver` is given. The PIN is never shown again after saving.
export default function DriverForm({
  driver,
}: {
  driver?: { id: string; name: string; phone: string; vehicleNumber: string; isActive: boolean };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveDriver, {});
  const form = useRef<HTMLFormElement>(null);
  const key = driver?.id ?? "new";

  // After a successful save, clear the PIN box, and the whole form when someone new was added
  useEffect(() => {
    if (!state.ok || !form.current) return;
    if (!driver) form.current.reset();
    else {
      const pin = form.current.elements.namedItem("pin");
      if (pin instanceof HTMLInputElement) pin.value = "";
    }
  }, [state, driver]);

  return (
    <form
      ref={form}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="space-y-4"
    >
      {driver && <input type="hidden" name="id" value={driver.id} />}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`d-name-${key}`} className={labelClass}>
            Name
          </label>
          <input id={`d-name-${key}`} name="name" required maxLength={80} defaultValue={driver?.name} className={inputClass} />
        </div>
        <div>
          <label htmlFor={`d-phone-${key}`} className={labelClass}>
            Mobile number <span className="font-normal text-stone-400">(used to sign in)</span>
          </label>
          <input
            id={`d-phone-${key}`}
            name="phone"
            type="tel"
            inputMode="tel"
            required
            maxLength={20}
            defaultValue={driver?.phone}
            placeholder="98xxxxxxxx"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`d-pin-${key}`} className={labelClass}>
            {driver ? "New PIN" : "PIN"} <span className="font-normal text-stone-400">(4 to 6 digits{driver ? ", leave empty to keep" : ""})</span>
          </label>
          <input
            id={`d-pin-${key}`}
            name="pin"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            pattern="\d{4,6}"
            required={!driver}
            maxLength={6}
            className={`${inputClass} font-mono tracking-widest`}
          />
        </div>
        <div>
          <label htmlFor={`d-vehicle-${key}`} className={labelClass}>
            Vehicle no.
          </label>
          <input
            id={`d-vehicle-${key}`}
            name="vehicleNumber"
            maxLength={20}
            defaultValue={driver?.vehicleNumber}
            placeholder="PB 10 AB 1234"
            className={inputClass}
          />
        </div>
      </div>
      {driver && (
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="isActive" defaultChecked={driver.isActive} className="mt-0.5 w-4 h-4 accent-[#E08A50]" />
          <span className="text-sm text-stone-900">
            Can use the driver app
            <span className="block text-xs text-stone-500">Turning this off signs them out straight away.</span>
          </span>
        </label>
      )}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : driver ? "Save" : "Add driver"}
        </button>
        <p role="status" className={`text-sm ${state.error ? "text-red-700" : "text-emerald-800"}`}>
          {!pending && (state.error ?? state.ok)}
        </p>
      </div>
    </form>
  );
}

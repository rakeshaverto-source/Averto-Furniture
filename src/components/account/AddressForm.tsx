"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { saveAddress, type FormResult } from "@/app/actions/account-data";

const inputClass =
  "w-full rounded-sm border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors";

export interface AddressValues {
  id?: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export default function AddressForm({ address, onDone }: { address?: AddressValues; onDone?: () => void }) {
  const [state, action, pending] = useActionState<FormResult, FormData>(saveAddress, {});
  const errors = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.ok) return;
    if (!address?.id) formRef.current?.reset(); // a new address was added: ready for the next one
    onDone?.();
  }, [state, address, onDone]);

  const field = (name: keyof AddressValues, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block text-sm font-medium text-stone-900">
      {label}
      <input name={name} defaultValue={address?.[name] ?? ""} className={`${inputClass} mt-1.5`} aria-invalid={!!errors[name]} {...props} />
      {errors[name] && <span className="mt-1 block text-xs font-normal text-red-700">{errors[name]}</span>}
    </label>
  );

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="grid sm:grid-cols-2 gap-4"
    >
      {address?.id && <input type="hidden" name="id" value={address.id} />}
      {field("label", "Label (optional)", { placeholder: "Home, Office…", maxLength: 30 })}
      {field("name", "Full name", { autoComplete: "name", maxLength: 80 })}
      {field("phone", "Phone", { type: "tel", autoComplete: "tel", inputMode: "tel", maxLength: 20 })}
      {field("pincode", "Pincode", { inputMode: "numeric", autoComplete: "postal-code", maxLength: 6 })}
      <div className="sm:col-span-2">{field("address", "Address", { autoComplete: "street-address", maxLength: 240 })}</div>
      {field("city", "City", { autoComplete: "address-level2", maxLength: 60 })}
      {field("state", "State", { autoComplete: "address-level1", maxLength: 60 })}
      <div className="sm:col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] disabled:opacity-60 text-white text-sm font-medium cursor-pointer transition-colors"
        >
          {pending ? "Saving…" : address?.id ? "Save changes" : "Add address"}
        </button>
        <p role="status" className={`text-sm ${state.error ? "text-red-700" : "text-emerald-800"}`}>
          {!pending && (state.error ?? state.ok)}
        </p>
      </div>
    </form>
  );
}

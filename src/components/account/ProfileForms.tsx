"use client";

import { startTransition, useActionState } from "react";
import { deleteAccount, updateProfile, type FormResult } from "@/app/actions/account-data";

const inputClass =
  "w-full rounded-sm border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors";

const submitWith = (action: (formData: FormData) => void) => (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  startTransition(() => action(formData));
};

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const [state, action, pending] = useActionState<FormResult, FormData>(updateProfile, {});
  const errors = state.fieldErrors ?? {};
  return (
    <form onSubmit={submitWith(action)} className="grid sm:grid-cols-2 gap-4">
      <label className="block text-sm font-medium text-stone-900">
        Full name
        <input name="name" defaultValue={name} autoComplete="name" maxLength={80} className={`${inputClass} mt-1.5`} />
        {errors.name && <span className="mt-1 block text-xs font-normal text-red-700">{errors.name}</span>}
      </label>
      <label className="block text-sm font-medium text-stone-900">
        Phone
        <input name="phone" type="tel" defaultValue={phone} autoComplete="tel" maxLength={20} className={`${inputClass} mt-1.5`} />
        {errors.phone && <span className="mt-1 block text-xs font-normal text-red-700">{errors.phone}</span>}
      </label>
      <label className="block text-sm font-medium text-stone-900 sm:col-span-2">
        Email
        <input value={email} readOnly className={`${inputClass} mt-1.5 bg-stone-50 text-stone-500`} />
        <span className="mt-1 block text-xs font-normal text-stone-500">Your email is your login and can&apos;t be changed here.</span>
      </label>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] disabled:opacity-60 text-white text-sm font-medium cursor-pointer transition-colors"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <p role="status" className={`text-sm ${state.error ? "text-red-700" : "text-emerald-800"}`}>
          {!pending && (state.error ?? state.ok)}
        </p>
      </div>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<FormResult, FormData>(deleteAccount, {});
  return (
    <form onSubmit={submitWith(action)} className="space-y-3">
      <label className="block text-sm text-stone-700">
        Type <strong>DELETE</strong> to confirm
        <input name="confirm" autoComplete="off" className={`${inputClass} mt-1.5 max-w-xs`} />
      </label>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="px-5 py-2.5 rounded-sm border border-red-300 bg-white text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 cursor-pointer"
      >
        {pending ? "Deleting…" : "Delete my account"}
      </button>
    </form>
  );
}

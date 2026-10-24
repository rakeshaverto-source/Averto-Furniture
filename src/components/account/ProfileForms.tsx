"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import Image from "next/image";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Camera, LogOut, Monitor, Smartphone } from "lucide-react";
import {
  deleteAccount,
  removeLoginSession,
  signOutEverywhere,
  updateProfile,
  type FormResult,
} from "@/app/actions/account-data";

const inputClass =
  "w-full rounded-sm border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors";

const submitWith = (action: (formData: FormData) => void) => (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  startTransition(() => action(formData));
};

const contactOptions = [
  { value: "call", label: "Phone call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
];

// Upload or remove the profile photo; the server crops it to a square
export function AvatarForm({ avatar, initials }: { avatar: string; initials: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [error, setError] = useState("");

  async function send(method: "POST" | "DELETE", body?: FormData) {
    setBusy(method === "POST" ? "upload" : "remove");
    setError("");
    try {
      const res = await fetch("/api/account/avatar", { method, body });
      if (!res.ok) setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Something went wrong.");
      else router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    }
    setBusy(null);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return setError("This photo is over 10 MB.");
    const body = new FormData();
    body.append("file", file);
    send("POST", body);
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[#111110] text-white font-serif text-2xl flex items-center justify-center">
        {avatar ? <Image src={avatar} alt="Your profile photo" fill sizes="80px" className="object-cover" /> : initials || "A"}
      </span>
      <div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={!!busy}
            className="inline-flex items-center gap-2 rounded-sm border border-stone-300 px-4 py-2 text-sm font-medium text-stone-900 hover:border-stone-900 disabled:opacity-60 cursor-pointer transition-colors"
          >
            <Camera className="w-4 h-4" />
            {busy === "upload" ? "Uploading…" : avatar ? "Change photo" : "Upload photo"}
          </button>
          {avatar && (
            <button
              type="button"
              onClick={() => send("DELETE")}
              disabled={!!busy}
              className="rounded-sm px-4 py-2 text-sm text-stone-600 hover:text-stone-900 disabled:opacity-60 cursor-pointer"
            >
              {busy === "remove" ? "Removing…" : "Remove photo"}
            </button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-stone-500">JPG, PNG or WebP, up to 10 MB.</p>
        {error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
        <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
      </div>
    </div>
  );
}

export function ProfileForm({
  name,
  phone,
  email,
  whatsapp,
  birthday,
  contactPref,
}: {
  name: string;
  phone: string;
  email: string;
  whatsapp: string;
  birthday: string;
  contactPref: string;
}) {
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
      <label className="block text-sm font-medium text-stone-900">
        WhatsApp number <span className="font-normal text-stone-500">(if different)</span>
        <input name="whatsapp" type="tel" defaultValue={whatsapp} autoComplete="tel" maxLength={20} className={`${inputClass} mt-1.5`} />
        {errors.whatsapp && <span className="mt-1 block text-xs font-normal text-red-700">{errors.whatsapp}</span>}
      </label>
      <label className="block text-sm font-medium text-stone-900">
        Birthday <span className="font-normal text-stone-500">(optional)</span>
        <input name="birthday" type="date" defaultValue={birthday} autoComplete="bday" className={`${inputClass} mt-1.5`} />
        {errors.birthday && <span className="mt-1 block text-xs font-normal text-red-700">{errors.birthday}</span>}
      </label>
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-medium text-stone-900">How should we contact you about your order?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {contactOptions.map((o) => (
            <label
              key={o.value}
              className="cursor-pointer rounded-sm border border-stone-300 px-4 py-2 text-sm text-stone-700 has-[:checked]:border-stone-900 has-[:checked]:bg-stone-900 has-[:checked]:text-white transition-colors"
            >
              <input type="radio" name="contactPref" value={o.value} defaultChecked={o.value === contactPref} className="sr-only" />
              {o.label}
            </label>
          ))}
        </div>
        {errors.contactPref && <span className="mt-1 block text-xs text-red-700">{errors.contactPref}</span>}
      </fieldset>
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

export interface SessionRow {
  id: string;
  device: string;
  mobile: boolean;
  current: boolean;
  signedIn: string; // already formatted for India time
  lastActive: string;
}

function RemoveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-sm border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:border-red-300 hover:text-red-700 disabled:opacity-60 cursor-pointer transition-colors"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}

// Every login of the account, this device first; any other one can be logged out from here
export function SessionList({ sessions }: { sessions: SessionRow[] }) {
  return (
    <ul className="divide-y divide-stone-100 rounded-sm border border-stone-200">
      {sessions.map((s) => {
        const Icon = s.mobile ? Smartphone : Monitor;
        return (
          <li key={s.id} className="flex items-center gap-3 px-4 py-3">
            <Icon className="w-5 h-5 shrink-0 text-stone-500" strokeWidth={1.6} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-stone-900">
                {s.device}
                {s.current && (
                  <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">This device</span>
                )}
              </p>
              <p className="text-xs text-stone-500">
                {s.current ? "Active now" : `Last active ${s.lastActive}`} · Logged in {s.signedIn}
              </p>
            </div>
            {!s.current && (
              <form action={removeLoginSession}>
                <input type="hidden" name="id" value={s.id} />
                <RemoveButton />
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function SignOutEverywhereButton() {
  return (
    <form action={signOutEverywhere}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-sm border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-900 hover:border-stone-900 cursor-pointer transition-colors"
      >
        <LogOut className="w-4 h-4" /> Log out of all devices
      </button>
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

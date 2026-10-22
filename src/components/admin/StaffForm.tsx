"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { saveStaffMember } from "@/app/admin/team-actions";
import type { FormState } from "@/app/admin/store-actions";
import { ROLES, type StaffRole } from "@/lib/admin-roles";
import { inputClass, labelClass, primaryButton } from "./ui";

// Adds a team member, or (with `member`) changes an existing one's role
export default function StaffForm({ member }: { member?: { email: string; role: StaffRole } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveStaffMember, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && !member) formRef.current?.reset();
  }, [state, member]);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className={member ? "flex flex-wrap items-center gap-3" : "grid sm:grid-cols-[2fr_1.4fr_auto] gap-3 items-end"}
    >
      {member ? (
        <input type="hidden" name="email" value={member.email} />
      ) : (
        <label className={labelClass}>
          Email
          <input name="email" type="email" required placeholder="name@example.com" className={`${inputClass} mt-1.5`} />
        </label>
      )}
      <label className={member ? "sr-only" : labelClass}>
        Role
        <select
          name="role"
          defaultValue={member?.role ?? "seo"}
          aria-label={member ? `Role for ${member.email}` : undefined}
          className={`${inputClass} ${member ? "w-auto" : "mt-1.5"}`}
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label} ({r.help})
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Saving…" : member ? "Change role" : "Add to team"}
      </button>
      <p role="status" className={`text-sm sm:col-span-3 ${state.error ? "text-red-700" : "text-emerald-800"}`}>
        {!pending && (state.error ?? state.ok)}
      </p>
    </form>
  );
}

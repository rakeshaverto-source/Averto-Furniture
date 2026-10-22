"use client";

import { startTransition, useActionState } from "react";
import type { FormState } from "@/app/admin/store-actions";
import { primaryButton } from "./ui";

// A form around a Server Action that shows "Saving…" and the action's message under the button
export default function ActionForm({
  action,
  submitLabel = "Save",
  className = "space-y-4",
  children,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [state, run, pending] = useActionState<FormState, FormData>(action, {});

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => run(formData));
      }}
      className={className}
    >
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : submitLabel}
        </button>
        <p role="status" className={`text-sm ${state.error ? "text-red-700" : "text-emerald-800"}`}>
          {!pending && (state.error ?? state.ok)}
        </p>
      </div>
    </form>
  );
}

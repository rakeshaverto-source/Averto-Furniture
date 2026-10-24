"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, PackageOpen, X } from "lucide-react";
import { MAX_RETURN_PHOTOS, RETURN_REASONS } from "@/data/returns";

// "Return / pickup" on a delivered order: the reason, a few words and photos, sent to the team
export default function ReturnRequestForm({ orderRef, deadline }: { orderRef: string; deadline: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const needsPhoto = reason === "damaged" || reason === "defective";

  // Let the browser free the previews once the form goes away
  const latest = useRef(photos);
  useEffect(() => {
    latest.current = photos;
  }, [photos]);
  useEffect(() => () => latest.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  function remove(index: number) {
    URL.revokeObjectURL(photos[index].url);
    setPhotos((current) => current.filter((_, j) => j !== index));
  }

  function add(files: FileList | null) {
    if (!files) return;
    const room = MAX_RETURN_PHOTOS - photos.length;
    const picked = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, room)
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPhotos((current) => [...current, ...picked]);
    if (input.current) input.current.value = "";
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.delete("photos");
    photos.forEach((p) => form.append("photos", p.file));
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/account/orders/${encodeURIComponent(orderRef)}/return`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("No internet connection. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <section className="rounded-sm bg-white border border-stone-200 p-5 sm:p-6 flex flex-wrap items-center gap-4">
        <PackageOpen className="w-6 h-6 text-stone-500 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-stone-900">Something not right?</h3>
          <p className="text-sm text-stone-500">You can ask us to collect this order and return it until {deadline}.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full sm:w-auto rounded-sm border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-900 hover:border-stone-900 cursor-pointer"
        >
          Request return & pickup
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-sm bg-white border border-stone-200 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-stone-900">Return & pickup request</h3>
          <p className="mt-1 text-sm text-stone-500">
            Tell us what happened. We&rsquo;ll reply within a day or two and arrange to collect the piece from your address.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-900 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-5">
        <fieldset>
          <legend className="text-sm font-medium text-stone-900">Reason</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {RETURN_REASONS.map((r) => (
              <label
                key={r.value}
                className="cursor-pointer rounded-full border border-stone-300 px-3.5 py-2 text-sm text-stone-700 hover:border-stone-900 has-[:checked]:border-stone-900 has-[:checked]:bg-stone-900 has-[:checked]:text-white"
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  required
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="sr-only"
                />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="text-sm font-medium text-stone-900">What happened?</span>
          <textarea
            name="details"
            required
            minLength={10}
            maxLength={1500}
            rows={4}
            placeholder="E.g. the left leg of the chair arrived cracked."
            className="mt-2 w-full rounded-sm border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
          />
        </label>

        <div>
          <p className="text-sm font-medium text-stone-900">
            Photos{" "}
            <span className="font-normal text-stone-500">
              {needsPhoto ? "(at least one, please)" : "(optional)"} · up to {MAX_RETURN_PHOTOS}
            </span>
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            {photos.map((p, i) => (
              <div key={p.url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- a local preview before upload */}
                <img src={p.url} alt="" className="h-20 w-20 rounded-sm object-cover border border-stone-200" />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="Remove photo"
                  className="absolute -top-2 -right-2 h-6 w-6 inline-flex items-center justify-center rounded-full bg-white border border-stone-300 hover:border-stone-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {photos.length < MAX_RETURN_PHOTOS && (
              <button
                type="button"
                onClick={() => input.current?.click()}
                className="h-20 w-20 inline-flex flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-stone-300 text-xs text-stone-500 hover:border-stone-900 hover:text-stone-900 cursor-pointer"
              >
                <ImagePlus className="w-5 h-5" />
                Add
              </button>
            )}
          </div>
          <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => add(e.target.files)} />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3">
          <button
            type="submit"
            disabled={busy || (needsPhoto && photos.length === 0)}
            className="rounded-sm bg-[#111110] px-5 py-3 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50 cursor-pointer"
          >
            {busy ? "Sending…" : "Send request"}
          </button>
          <p className="text-xs text-stone-500">Bespoke and made-to-measure pieces can be returned only for damage or a fault.</p>
        </div>
      </form>
    </section>
  );
}

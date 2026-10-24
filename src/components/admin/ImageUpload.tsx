"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { secondaryButton } from "./ui";

// Sends one image to the media upload route and keeps its storage path in a hidden form field
export type MediaFolder = "blog" | "seo" | "categories";

export async function uploadMedia(file: File, folder: MediaFolder) {
  const body = new FormData();
  body.append("folder", folder);
  body.append("file", file);
  const res = await fetch("/api/admin/upload/media", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "The upload failed. Please try again.");
  return data as { path: string; url: string };
}

export default function ImageUpload({
  name,
  folder,
  initial,
  label,
  help,
}: {
  name: string;
  folder: MediaFolder;
  initial?: { path: string; url: string };
  label: string;
  help?: string;
}) {
  const [image, setImage] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function choose(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      setImage(await uploadMedia(file, folder));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <p className="block text-sm font-medium text-stone-900 mb-1.5">{label}</p>
      <input type="hidden" name={name} value={image?.path ?? ""} />
      <div className="flex flex-wrap items-center gap-4">
        {image && (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- a just-uploaded preview */}
            <img src={image.url} alt="" className="h-24 w-40 rounded-xl object-cover border border-stone-200" />
            <button
              type="button"
              onClick={() => setImage(undefined)}
              aria-label="Remove image"
              className="absolute -top-2 -right-2 h-7 w-7 inline-flex items-center justify-center rounded-full bg-white border border-stone-300 hover:border-stone-900 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className={secondaryButton}>
          <ImagePlus className="w-4 h-4" />
          {busy ? "Uploading…" : image ? "Replace" : "Upload image"}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => choose(e.target.files?.[0])}
        />
      </div>
      {help && <p className="mt-1.5 text-xs text-stone-500">{help}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

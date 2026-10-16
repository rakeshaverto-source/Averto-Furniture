"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import { deleteImage, moveImage, updateImage } from "@/app/admin/actions";
import { inputClass, primaryButton, secondaryButton } from "./ui";

export interface AdminPhoto {
  id: string;
  url: string;
  label: string;
  fit: "cover" | "contain";
  colorId: string | null;
}

interface UploadRow {
  name: string;
  status: "waiting" | "uploading" | "done" | "failed";
  note?: string;
}

const MAX_MB = 15;

export default function PhotoManager({
  productId,
  photos,
  colors,
}: {
  productId: string;
  photos: AdminPhoto[];
  colors: { id: string; name: string }[];
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const busy = uploads.some((u) => u.status === "waiting" || u.status === "uploading");
  const mainId = photos.find((p) => !p.colorId)?.id;

  const setRow = (i: number, patch: Partial<UploadRow>) =>
    setUploads((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  // One file per request, so a big batch never hits a size limit and each file reports its own result
  const upload = async (files: File[]) => {
    setUploads(files.map((f) => ({ name: f.name, status: "waiting" })));
    for (const [i, file] of files.entries()) {
      if (file.size > MAX_MB * 1024 * 1024) {
        setRow(i, { status: "failed", note: `Over ${MAX_MB} MB` });
        continue;
      }
      setRow(i, { status: "uploading" });
      try {
        const body = new FormData();
        body.append("productId", productId);
        body.append("file", file);
        const response = await fetch("/api/admin/upload", { method: "POST", body });
        const result = (await response.json().catch(() => ({}))) as { error?: string; sizeKb?: number };
        if (response.ok) {
          setRow(i, { status: "done", note: `Saved as WebP, ${result.sizeKb} KB` });
        } else {
          setRow(i, { status: "failed", note: result.error ?? "Upload failed" });
        }
      } catch {
        setRow(i, { status: "failed", note: "No connection. Please try again." });
      }
    }
    router.refresh();
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-medium text-stone-900">Photos</h2>
          <p className="mt-0.5 text-xs text-stone-500 max-w-md">
            Best: portrait 4:5 (1600 × 2000 px), product in the centre on a plain background. Any JPG, PNG or WebP up
            to {MAX_MB} MB is fine: it is resized and converted to WebP automatically.
          </p>
        </div>
        <button type="button" disabled={busy} onClick={() => fileInput.current?.click()} className={primaryButton}>
          <ImagePlus className="w-4 h-4" /> {busy ? "Uploading…" : "Upload photos"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (files.length) void upload(files);
          }}
        />
      </div>

      {uploads.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-sm" aria-live="polite">
          {uploads.map((u, i) => (
            <li key={i} className="flex items-center justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2">
              <span className="truncate text-stone-700">{u.name}</span>
              <span
                className={`shrink-0 text-xs ${
                  u.status === "failed" ? "text-red-700" : u.status === "done" ? "text-emerald-700" : "text-stone-500"
                }`}
              >
                {u.status === "waiting" ? "Waiting" : u.status === "uploading" ? "Uploading…" : u.note}
              </span>
            </li>
          ))}
        </ul>
      )}

      {photos.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-stone-500">
          No photos yet. The product stays off the shop until it has one.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {photos.map((photo, i) => (
            <li key={photo.id} className="rounded-xl border border-stone-200 overflow-hidden">
              <div className="relative aspect-[4/5] bg-stone-100">
                <Image
                  src={photo.url}
                  alt={photo.label}
                  fill
                  sizes="(max-width: 640px) 100vw, 300px"
                  className={photo.fit === "contain" ? "object-contain" : "object-cover"}
                />
                {photo.id === mainId && (
                  <span className="absolute top-2 left-2 rounded-full bg-[#111110]/85 px-2.5 py-1 text-[11px] font-medium text-white">
                    Main photo
                  </span>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {(["up", "down"] as const).map((direction) => {
                    const disabled = direction === "up" ? i === 0 : i === photos.length - 1;
                    return (
                      <form key={direction} action={moveImage}>
                        <input type="hidden" name="id" value={photo.id} />
                        <input type="hidden" name="direction" value={direction} />
                        <button
                          type="submit"
                          disabled={disabled}
                          aria-label={`Move photo ${direction === "up" ? "earlier" : "later"}`}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white/90 text-stone-800 hover:bg-white disabled:opacity-30 cursor-pointer"
                        >
                          {direction === "up" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                        </button>
                      </form>
                    );
                  })}
                </div>
              </div>

              <form action={updateImage} className="p-3 space-y-2">
                <input type="hidden" name="id" value={photo.id} />
                <input
                  name="label"
                  defaultValue={photo.label}
                  aria-label="Photo description"
                  placeholder="Short description (for search engines)"
                  maxLength={120}
                  className={inputClass}
                />
                <div className="grid grid-cols-2 gap-2">
                  <select name="fit" defaultValue={photo.fit} aria-label="How the photo fills its frame" className={inputClass}>
                    <option value="cover">Fill frame</option>
                    <option value="contain">Show whole photo</option>
                  </select>
                  <select name="colorId" defaultValue={photo.colorId ?? ""} aria-label="Colour this photo shows" className={inputClass}>
                    <option value="">All colours</option>
                    {colors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button type="submit" className={secondaryButton}>
                    Save
                  </button>
                  <button
                    type="submit"
                    formAction={deleteImage}
                    onClick={(e) => {
                      if (!window.confirm("Delete this photo? This can't be undone.")) e.preventDefault();
                    }}
                    aria-label="Delete photo"
                    className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-stone-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

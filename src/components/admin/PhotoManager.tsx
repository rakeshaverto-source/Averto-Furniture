"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2 } from "lucide-react";
import { deleteImage, makeMainImage, moveImage, updateImage } from "@/app/admin/actions";
import { inputClass } from "./ui";

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
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/avif"];

// Photos save on their own, as soon as they are uploaded or changed: no separate Save needed
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
  const [dragging, setDragging] = useState(false);
  const busy = uploads.some((u) => u.status === "waiting" || u.status === "uploading");
  const mainId = photos.find((p) => !p.colorId)?.id;

  const setRow = (i: number, patch: Partial<UploadRow>) =>
    setUploads((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  // One file per request, so a big batch never hits a size limit and each file reports its own result
  const upload = async (files: File[]) => {
    setUploads(files.map((f) => ({ name: f.name, status: "waiting" })));
    for (const [i, file] of files.entries()) {
      if (!ACCEPT.includes(file.type)) {
        setRow(i, { status: "failed", note: "Not a JPG, PNG or WebP photo" });
        continue;
      }
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
          setRow(i, { status: "done", note: `Added (${result.sizeKb} KB)` });
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
    <div>
      {/* Click or drop photos here */}
      <button
        type="button"
        disabled={busy}
        onClick={() => fileInput.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const files = Array.from(e.dataTransfer.files);
          if (files.length && !busy) void upload(files);
        }}
        className={`w-full rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors cursor-pointer disabled:cursor-wait ${
          dragging ? "border-[#E08A50] bg-orange-50" : "border-stone-300 hover:border-stone-500 bg-stone-50"
        }`}
      >
        <ImagePlus className="mx-auto w-7 h-7 text-stone-500" aria-hidden />
        <span className="mt-2 block text-sm font-medium text-stone-900">
          {busy ? "Uploading…" : "Click to choose photos, or drag them here"}
        </span>
        <span className="mt-1 block text-xs text-stone-500">
          JPG, PNG or WebP, up to {MAX_MB} MB each. Several at once is fine. Best: upright photos, product in the
          middle, plain background.
        </span>
      </button>
      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT.join(",")}
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) void upload(files);
        }}
      />

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
        <p className="mt-4 text-sm text-amber-800">No photos yet. The product stays off the shop until it has one.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {photos.map((photo, i) => (
            <PhotoCard
              // starts again from what is stored when "Make main photo" changes its colour
              key={`${photo.id}-${photo.colorId ?? ""}`}
              photo={photo}
              isMain={photo.id === mainId}
              first={i === 0}
              last={i === photos.length - 1}
              colors={colors}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function PhotoCard({
  photo,
  isMain,
  first,
  last,
  colors,
}: {
  photo: AdminPhoto;
  isMain: boolean;
  first: boolean;
  last: boolean;
  colors: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [fit, setFit] = useState(photo.fit);
  const [colorId, setColorId] = useState(photo.colorId ?? "");
  const [label, setLabel] = useState(photo.label);

  const run = (act: (formData: FormData) => Promise<void>, extra: Record<string, string> = {}) => {
    const formData = new FormData();
    formData.set("id", photo.id);
    for (const [k, v] of Object.entries(extra)) formData.set(k, v);
    setSaved(false);
    startTransition(async () => {
      await act(formData);
      setSaved(true);
    });
  };
  // Saves the photo's settings; called whenever one of them changes
  const save = (next: Partial<{ fit: string; colorId: string; label: string }>) =>
    run(updateImage, { fit, colorId, label, ...next });

  const iconButton =
    "h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white/90 text-stone-800 hover:bg-white disabled:opacity-30 cursor-pointer";

  return (
    <li className="rounded-xl border border-stone-200 overflow-hidden bg-white">
      <div className="relative aspect-[4/5] bg-stone-100">
        <Image
          src={photo.url}
          alt={photo.label}
          fill
          sizes="(max-width: 640px) 100vw, 300px"
          className={fit === "contain" ? "object-contain" : "object-cover"}
        />
        {isMain && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#111110]/85 px-2.5 py-1 text-[11px] font-medium text-white">
            <Star className="w-3 h-3 fill-current" aria-hidden /> Main photo
          </span>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          <button type="button" disabled={first || pending} onClick={() => run(moveImage, { direction: "up" })} aria-label="Move photo earlier" title="Move earlier" className={iconButton}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button type="button" disabled={last || pending} onClick={() => run(moveImage, { direction: "down" })} aria-label="Move photo later" title="Move later" className={iconButton}>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-3 text-sm">
        {!isMain && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(makeMainImage)}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-stone-900 hover:border-stone-900 cursor-pointer disabled:opacity-50"
          >
            <Star className="w-3.5 h-3.5" aria-hidden /> Make main photo
          </button>
        )}

        <div>
          <span className="block text-xs text-stone-500 mb-1">How it fits the frame</span>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-stone-100 p-1" role="group" aria-label="How the photo fits its frame">
            {(
              [
                ["cover", "Fill frame"],
                ["contain", "Whole photo"],
              ] as const
            ).map(([value, text]) => (
              <button
                key={value}
                type="button"
                aria-pressed={fit === value}
                onClick={() => {
                  if (fit === value) return;
                  setFit(value);
                  save({ fit: value });
                }}
                className={`rounded-md px-2 py-1 text-xs cursor-pointer ${fit === value ? "bg-white text-stone-900 shadow-sm font-medium" : "text-stone-600"}`}
              >
                {text}
              </button>
            ))}
          </div>
        </div>

        {colors.length > 0 && (
          <label className="block">
            <span className="block text-xs text-stone-500 mb-1">Which colour is this photo?</span>
            <select
              value={colorId}
              onChange={(e) => {
                setColorId(e.target.value);
                save({ colorId: e.target.value });
              }}
              className={inputClass}
            >
              <option value="">All colours</option>
              {colors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="block text-xs text-stone-500 mb-1">Short description (optional)</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => {
              if (label.trim() !== photo.label) save({ label });
            }}
            placeholder="e.g. Table from the side"
            maxLength={120}
            className={inputClass}
          />
        </label>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-stone-500" aria-live="polite">
            {pending ? "Saving…" : saved ? "✓ Saved" : ""}
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (window.confirm("Delete this photo? This can't be undone.")) run(deleteImage);
            }}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-stone-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>
    </li>
  );
}

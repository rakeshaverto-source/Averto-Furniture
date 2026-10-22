"use client";

import { useState } from "react";
import { inputClass, labelClass } from "./ui";

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;

function Counter({ length, max }: { length: number; max: number }) {
  const tone = length === 0 ? "text-stone-400" : length > max ? "text-red-700" : "text-emerald-800";
  return (
    <span className={`text-xs font-normal tabular-nums ${tone}`}>
      {length}/{max}
    </span>
  );
}

// Search title and description with live length counters and a preview of the Google result.
// Empty fields fall back to the page's own text, shown greyed out as the placeholder.
export default function SeoFields({
  path,
  titleName = "title",
  descriptionName = "description",
  initialTitle = "",
  initialDescription = "",
  fallbackTitle,
  fallbackDescription,
  siteUrl,
}: {
  path: string;
  titleName?: string;
  descriptionName?: string;
  initialTitle?: string;
  initialDescription?: string;
  fallbackTitle: string;
  fallbackDescription: string;
  siteUrl: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const shownTitle = title || fallbackTitle;
  const shownDescription = description || fallbackDescription;
  const host = siteUrl.replace(/^https?:\/\//, "");

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="space-y-4">
        <label className={labelClass}>
          <span className="flex items-center justify-between">
            Search title <Counter length={shownTitle.length} max={TITLE_MAX} />
          </span>
          <input
            name={titleName}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder={fallbackTitle}
            className={`${inputClass} mt-1.5`}
          />
        </label>
        <label className={labelClass}>
          <span className="flex items-center justify-between">
            Search description <Counter length={shownDescription.length} max={DESCRIPTION_MAX} />
          </span>
          <textarea
            name={descriptionName}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={320}
            rows={3}
            placeholder={fallbackDescription}
            className={`${inputClass} mt-1.5`}
          />
        </label>
      </div>

      <div aria-label="Google preview" className="rounded-xl border border-stone-200 bg-white p-4 self-start">
        <p className="text-[11px] uppercase tracking-wider text-stone-400 mb-2">Google preview</p>
        <p className="text-xs text-stone-600 truncate">
          {host}
          {path === "/" ? "" : ` › ${path.split("/").filter(Boolean).join(" › ")}`}
        </p>
        <p className="mt-1 text-lg leading-snug text-[#1a0dab] line-clamp-1">
          {shownTitle.length > TITLE_MAX ? `${shownTitle.slice(0, TITLE_MAX - 1)}…` : shownTitle}
        </p>
        <p className="mt-1 text-sm text-stone-600 leading-snug line-clamp-2">
          {shownDescription.length > DESCRIPTION_MAX ? `${shownDescription.slice(0, DESCRIPTION_MAX - 1)}…` : shownDescription}
        </p>
      </div>
    </div>
  );
}

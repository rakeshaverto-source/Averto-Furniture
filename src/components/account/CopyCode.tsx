"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // clipboard blocked: the code is still visible to type in
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-stone-400 bg-white px-3 py-1.5 font-mono text-sm font-semibold text-stone-900 hover:bg-stone-50 cursor-pointer"
      aria-label={`Copy coupon code ${code}`}
    >
      {code}
      {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4 text-stone-500" />}
      <span className="sr-only" role="status">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}

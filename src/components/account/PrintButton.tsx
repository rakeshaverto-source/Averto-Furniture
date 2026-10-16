"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-sm bg-[#111110] px-5 py-2.5 text-sm font-medium text-white cursor-pointer print:hidden"
    >
      <Printer className="w-4 h-4" /> Print / Save as PDF
    </button>
  );
}

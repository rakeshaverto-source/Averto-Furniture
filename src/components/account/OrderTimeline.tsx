import { Check, CircleX } from "lucide-react";
import { JOURNEY, journeyStep } from "@/lib/account";
import type { FulfillmentStatus } from "@/generated/prisma/client";

// Where an order is on its way to the customer. Done steps are filled, the current one is
// outlined in ink, later ones are outlined. Status also reads in text, not only colour.
const shortDate = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" });

export default function OrderTimeline({
  status,
  compact = false,
  dates = {},
}: {
  status: FulfillmentStatus;
  compact?: boolean;
  dates?: Partial<Record<FulfillmentStatus, Date>>; // when each step was reached
}) {
  if (status === "cancelled") {
    return (
      <p className="flex items-center gap-2 rounded-sm bg-stone-100 px-4 py-3 text-sm text-stone-700">
        <CircleX className="w-4 h-4 text-stone-500" /> This order was cancelled.
      </p>
    );
  }
  const current = journeyStep(status);

  return (
    <div>
      <ol className="grid grid-cols-6" aria-label="Order progress">
        {JOURNEY.map((step, i) => {
          const done = i < current;
          const now = i === current;
          return (
            <li key={step.value} className="relative flex flex-col items-center text-center" aria-current={now ? "step" : undefined}>
              {/* connector to the previous step */}
              {i > 0 && (
                <span
                  className={`absolute top-3.5 right-1/2 w-full h-0.5 -translate-y-1/2 ${i <= current ? "bg-[#111110]" : "bg-stone-200"}`}
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-[#111110] text-white"
                    : now
                      ? "bg-white text-stone-900 ring-2 ring-[#1A1A18]"
                      : "bg-white text-stone-400 ring-1 ring-inset ring-stone-300"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={`mt-2 text-[11px] sm:text-xs leading-tight ${
                  now ? "font-semibold text-stone-900" : done ? "text-stone-700" : "text-stone-400"
                }`}
              >
                {step.label}
              </span>
              {!compact && i <= current && dates[step.value] && (
                <span className="mt-0.5 text-[11px] text-stone-500">{shortDate.format(dates[step.value])}</span>
              )}
            </li>
          );
        })}
      </ol>
      {!compact && current >= 0 && <p className="mt-4 text-sm text-stone-600 text-center">{JOURNEY[current].hint}</p>}
    </div>
  );
}

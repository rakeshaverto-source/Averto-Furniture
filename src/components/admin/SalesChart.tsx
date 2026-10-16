"use client";

import { useState } from "react";

// Daily sales as columns. One series, so no legend: the card title names it. Bars are HTML so
// text stays crisp at any width; each bar is focusable and shows its own tooltip.
const BAR = "#C76F35"; // brand orange, one step darker so it clears 3:1 on white
const BAR_ACTIVE = "#A85A26";

const compact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});
const full = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const dayLabel = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const longDay = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

// Rounded axis maximum and ticks: 0 and 4 even steps
function niceTicks(max: number) {
  if (max <= 0) return [0, 25000, 50000, 75000, 100000];
  const rough = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough)!;
  return [0, 1, 2, 3, 4].map((i) => i * step);
}

export default function SalesChart({ data }: { data: { day: string; sales: number; orders: number }[] }) {
  const [active, setActive] = useState<number | null>(null);
  const ticks = niceTicks(Math.max(...data.map((d) => d.sales)));
  const top = ticks[ticks.length - 1];
  const labelEvery = data.length <= 7 ? 1 : data.length <= 31 ? 7 : 15;
  const hovered = active !== null ? data[active] : null;
  const empty = data.every((d) => d.sales === 0);

  return (
    <div>
      <div className="relative h-56 sm:h-64 pl-12">
        {/* gridlines + y-axis ticks, recessive */}
        {ticks.map((t) => (
          <div
            key={t}
            className="absolute left-12 right-0 border-t border-stone-200"
            style={{ bottom: `${(t / top) * 100}%` }}
            aria-hidden
          >
            <span className="absolute -left-12 w-10 -translate-y-1/2 text-right text-[11px] tabular-nums text-stone-500">
              {compact.format(t)}
            </span>
          </div>
        ))}

        <div className="absolute inset-0 left-12 flex items-end" onPointerLeave={() => setActive(null)}>
          {data.map((d, i) => {
            const height = d.sales > 0 ? Math.max((d.sales / top) * 100, 1.5) : 0;
            return (
              <button
                key={d.day}
                type="button"
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                aria-label={`${longDay.format(new Date(d.day))}: ${full.format(d.sales)}, ${d.orders} order${d.orders === 1 ? "" : "s"}`}
                // the whole column slot is the hit target, not just the painted bar
                className="relative h-full flex-1 flex items-end justify-center px-px focus:outline-none group"
              >
                <span
                  className="block w-full max-w-6 rounded-t-[4px] transition-colors group-focus-visible:ring-2 group-focus-visible:ring-stone-900 group-focus-visible:ring-offset-2"
                  style={{ height: `${height}%`, background: active === i ? BAR_ACTIVE : BAR }}
                />
              </button>
            );
          })}
        </div>

        {hovered && active !== null && (
          <div
            role="tooltip"
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-stone-900 px-3 py-2 text-xs text-white shadow-lg whitespace-nowrap"
            style={{ left: `calc(3rem + (100% - 3rem) * ${(active + 0.5) / data.length})` }}
          >
            <p className="text-sm font-semibold tabular-nums">{full.format(hovered.sales)}</p>
            <p className="text-white/70">
              {longDay.format(new Date(hovered.day))} · {hovered.orders} order{hovered.orders === 1 ? "" : "s"}
            </p>
          </div>
        )}

        {empty && (
          <p className="absolute inset-0 left-12 flex items-center justify-center text-sm text-stone-500">
            No sales in this period yet.
          </p>
        )}
      </div>

      {/* x-axis: a few dates, not every day */}
      <div className="relative h-5 ml-12 mt-1.5" aria-hidden>
        {data.map((d, i) =>
          i % labelEvery === 0 || i === data.length - 1 ? (
            <span
              key={d.day}
              className="absolute -translate-x-1/2 text-[11px] text-stone-500 whitespace-nowrap"
              style={{ left: `${((i + 0.5) / data.length) * 100}%` }}
            >
              {dayLabel.format(new Date(d.day))}
            </span>
          ) : null,
        )}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-stone-500 hover:text-stone-900">Show as table</summary>
        <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-stone-200">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-stone-50 text-left text-xs text-stone-500">
              <tr>
                <th className="px-3 py-2 font-medium">Day</th>
                <th className="px-3 py-2 font-medium text-right">Orders</th>
                <th className="px-3 py-2 font-medium text-right">Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {[...data].reverse().map((d) => (
                <tr key={d.day}>
                  <td className="px-3 py-1.5">{longDay.format(new Date(d.day))}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{d.orders}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{full.format(d.sales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

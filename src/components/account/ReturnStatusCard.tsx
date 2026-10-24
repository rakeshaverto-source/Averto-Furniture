import { Phone } from "lucide-react";
import { formatPrice } from "@/data/collections";
import { formatDate, formatDateTime } from "@/lib/admin-format";
import { imageUrl } from "@/lib/catalog";
import { RETURN_STEPS, returnReasonLabel, returnStatusInfo } from "@/data/returns";
import { withdrawReturnRequest } from "@/app/actions/account-data";
import type { ReturnRequest } from "@/generated/prisma/client";

// Where the customer's return stands, on their order page
export default function ReturnStatusCard({ orderRef, request }: { orderRef: string; request: ReturnRequest }) {
  const info = returnStatusInfo(request.status);
  const rejected = request.status === "rejected";
  const step = RETURN_STEPS.indexOf(request.status);
  const scheduled = request.status === "pickup_scheduled";

  return (
    <section className="rounded-sm bg-white border border-stone-200 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-medium text-stone-900">Return & pickup</h3>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${info.tone}`}>{info.label}</span>
      </div>

      {!rejected && (
        <ol className="mt-5 grid grid-cols-5 gap-1.5" aria-label="Return progress">
          {RETURN_STEPS.map((s, i) => (
            <li key={s} className="min-w-0">
              <span className={`block h-1.5 rounded-full ${i <= step ? "bg-[#111110]" : "bg-stone-200"}`} />
              <span className={`mt-1.5 hidden sm:block truncate text-xs ${i <= step ? "text-stone-900" : "text-stone-400"}`}>
                {returnStatusInfo(s).label.replace("Return ", "")}
              </span>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-4 text-sm text-stone-700">{info.hint}</p>
      {request.teamMessage && (
        <p className="mt-3 rounded-sm bg-stone-50 px-4 py-3 text-sm text-stone-800 whitespace-pre-line">
          <span className="block text-xs uppercase tracking-wider text-stone-500 mb-1">From our team</span>
          {request.teamMessage}
        </p>
      )}

      {(scheduled || request.status === "picked_up") && (request.pickupDate || request.pickupSlot || request.driverName) && (
        <div className="mt-4 flex flex-wrap items-center gap-x-10 gap-y-3 border-t border-stone-200 pt-4 text-sm">
          {(request.pickupDate || request.pickupSlot) && (
            <p>
              <span className="block text-xs uppercase tracking-wider text-stone-500">Pickup</span>
              <span className="font-medium text-stone-900">
                {[request.pickupDate && formatDate(request.pickupDate), request.pickupSlot].filter(Boolean).join(", ")}
              </span>
            </p>
          )}
          {scheduled && request.driverName && (
            <p>
              <span className="block text-xs uppercase tracking-wider text-stone-500">Collected by</span>
              <span className="text-stone-900">{[request.driverName, request.vehicleNumber].filter(Boolean).join(" · ")}</span>
            </p>
          )}
          {scheduled && request.driverPhone && (
            <a
              href={`tel:${request.driverPhone.replace(/[\s-]/g, "")}`}
              className="inline-flex items-center gap-2 rounded-sm bg-[#111110] px-4 py-2 font-medium text-white hover:bg-stone-800"
            >
              <Phone className="w-4 h-4" /> Call driver
            </a>
          )}
        </div>
      )}

      {request.status === "refunded" && request.refundAmount !== null && (
        <p className="mt-4 border-t border-stone-200 pt-4 text-sm text-emerald-800">
          Refunded {formatPrice(request.refundAmount)}
          {request.refundedAt ? ` on ${formatDate(request.refundedAt)}` : ""}.
        </p>
      )}

      <details className="mt-4 border-t border-stone-200 pt-4 text-sm group">
        <summary className="cursor-pointer list-none text-stone-600 hover:text-stone-900">
          Your request <span className="text-stone-400">· {formatDateTime(request.createdAt)}</span>
          <span className="ml-1 group-open:hidden">▸</span>
        </summary>
        <p className="mt-3 font-medium text-stone-900">{returnReasonLabel(request.reason)}</p>
        <p className="mt-1 text-stone-700 whitespace-pre-line">{request.details}</p>
        {request.photos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {request.photos.map((path) => (
              <a key={path} href={imageUrl(path)} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- small thumbnails of the customer's own photos */}
                <img src={imageUrl(path)} alt="Photo you sent" className="h-16 w-16 rounded-sm object-cover border border-stone-200" />
              </a>
            ))}
          </div>
        )}
      </details>

      {request.status === "requested" && (
        <form action={withdrawReturnRequest} className="mt-4">
          <input type="hidden" name="ref" value={orderRef} />
          <button type="submit" className="text-sm text-stone-500 underline underline-offset-4 hover:text-stone-900 cursor-pointer">
            Withdraw this request
          </button>
        </form>
      )}
    </section>
  );
}

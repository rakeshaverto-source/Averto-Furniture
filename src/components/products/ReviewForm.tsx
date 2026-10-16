"use client";

import { useActionState, useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { submitReview, type ReviewFormState } from "@/app/actions/reviews";

const EASE = [0.22, 1, 0.36, 1] as const;
const initialState: ReviewFormState = { status: "idle" };

const inputClass =
  "w-full rounded-sm border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-700">{message}</p>;
}

function ReviewDialog({
  productId,
  productName,
  onClose,
}: {
  productId: string;
  productName: string;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(submitReview, initialState);
  const [rating, setRating] = useState(Number(state.values?.rating) || 0);
  const [hover, setHover] = useState(0);

  // Esc closes; page scroll is locked while the dialog is open
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const errors = state.errors ?? {};
  const values = state.values;

  return (
    <div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/55"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-dialog-title"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-t-sm sm:rounded-sm shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 sm:pt-8">
          <div>
            <h2 id="review-dialog-title" className="font-serif text-2xl sm:text-3xl text-[#111110]">
              Write a review
            </h2>
            <p className="text-sm text-stone-500 mt-1">{productName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 shrink-0 rounded-full hover:bg-stone-100 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {state.status === "success" ? (
          <div className="px-6 sm:px-8 py-12 text-center">
            <p className="font-serif text-2xl text-stone-900">Thank you</p>
            <p className="mt-3 text-sm text-stone-600 leading-relaxed">
              We have received your review. It will appear on this page once our team has read it.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 px-7 py-3 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] text-white text-sm font-medium cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form action={formAction} className="px-6 sm:px-8 pt-6 pb-8 space-y-5" noValidate>
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="rating" value={rating || ""} />
            {/* Honeypot for bots; hidden from people and screen readers */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />

            {state.status === "error" && state.message && (
              <p className="rounded-sm bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                {state.message}
              </p>
            )}

            <fieldset>
              <legend className="text-sm font-medium text-stone-900 mb-2">Your rating</legend>
              <div
                role="radiogroup"
                aria-label="Star rating"
                className="flex items-center gap-1"
                onMouseLeave={() => setHover(0)}
              >
                {[1, 2, 3, 4, 5].map((n) => {
                  const filled = n <= (hover || rating);
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHover(n)}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          filled ? "fill-[#E08A50] text-[#E08A50]" : "text-stone-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <FieldError message={errors.rating} />
            </fieldset>

            <div>
              <label htmlFor="review-title" className="block text-sm font-medium text-stone-900 mb-2">
                Title
              </label>
              <input
                id="review-title"
                name="title"
                type="text"
                maxLength={80}
                defaultValue={values?.title}
                placeholder="Sum it up in a few words"
                className={inputClass}
              />
              <FieldError message={errors.title} />
            </div>

            <div>
              <label htmlFor="review-text" className="block text-sm font-medium text-stone-900 mb-2">
                Your review
              </label>
              <textarea
                id="review-text"
                name="text"
                rows={5}
                maxLength={1000}
                defaultValue={values?.text}
                placeholder="What did you like? How does it look and feel in your home?"
                className={`${inputClass} resize-y`}
              />
              <FieldError message={errors.text} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="review-name" className="block text-sm font-medium text-stone-900 mb-2">
                  Name
                </label>
                <input
                  id="review-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  maxLength={60}
                  defaultValue={values?.name}
                  className={inputClass}
                />
                <FieldError message={errors.name} />
              </div>
              <div>
                <label htmlFor="review-location" className="block text-sm font-medium text-stone-900 mb-2">
                  City <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <input
                  id="review-location"
                  name="location"
                  type="text"
                  autoComplete="address-level2"
                  maxLength={60}
                  defaultValue={values?.location}
                  className={inputClass}
                />
                <FieldError message={errors.location} />
              </div>
            </div>

            <div>
              <label htmlFor="review-email" className="block text-sm font-medium text-stone-900 mb-2">
                Email <span className="text-stone-400 font-normal">(optional, never shown)</span>
              </label>
              <input
                id="review-email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={120}
                defaultValue={values?.email}
                className={inputClass}
              />
              <FieldError message={errors.email} />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full py-3.5 rounded-sm bg-[#1A1A18] hover:bg-[#3b3732] disabled:opacity-60 text-white text-sm font-medium cursor-pointer transition-colors"
            >
              {pending ? "Sending…" : "Submit review"}
            </button>
            <p className="text-xs text-stone-500 text-center">
              Reviews are read by our team before they appear on the site.
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default function WriteReviewButton({
  productId,
  productName,
  className,
  children = "Write a review",
}: {
  productId: string;
  productName: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <AnimatePresence>
        {open && <ReviewDialog productId={productId} productName={productName} onClose={close} />}
      </AnimatePresence>
    </>
  );
}

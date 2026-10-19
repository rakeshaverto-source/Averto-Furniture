// A numbered section of a step-by-step admin form, with one line of help under the title
export default function Step({
  n,
  title,
  help,
  aside,
  children,
}: {
  n: number;
  title: string;
  help?: React.ReactNode;
  aside?: React.ReactNode; // e.g. a button on the right of the title
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span
            className="mt-0.5 h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-full bg-[#111110] text-xs font-semibold text-white"
            aria-hidden
          >
            {n}
          </span>
          <div>
            <h2 className="font-medium text-stone-900">
              <span className="sr-only">Step {n}: </span>
              {title}
            </h2>
            {help && <p className="mt-0.5 text-sm text-stone-500 max-w-xl">{help}</p>}
          </div>
        </div>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

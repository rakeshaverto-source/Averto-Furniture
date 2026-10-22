"use client";

import { startTransition, useActionState, useMemo, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { ExternalLink } from "lucide-react";
import { savePost, type PostFormState } from "@/app/admin/blog-actions";
import { slugify } from "@/lib/slug";
import BlogEditor from "./BlogEditor";
import ImageUpload from "./ImageUpload";
import SeoFields from "./SeoFields";
import { inputClass, labelClass, primaryButton, secondaryButton } from "./ui";

export interface PostFormValues {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: JSONContent;
  cover?: { path: string; url: string };
  coverAlt: string;
  tags: string;
  productIds: string[];
  status: "draft" | "published";
  publishedAt: string; // yyyy-mm-dd or ""
  authorName: string;
  seoTitle: string;
  seoDescription: string;
}

export default function PostForm({
  post,
  products,
  siteUrl,
  justSaved,
}: {
  post: PostFormValues;
  products: { id: string; name: string }[];
  siteUrl: string;
  justSaved?: boolean;
}) {
  const [state, action, pending] = useActionState<PostFormState, FormData>(
    savePost,
    justSaved ? { ok: post.status === "published" ? "Published." : "Draft saved." } : {},
  );
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [slugEdited, setSlugEdited] = useState(!!post.id);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [picked, setPicked] = useState<string[]>(post.productIds);
  const [productQuery, setProductQuery] = useState("");
  const [status, setStatus] = useState(post.status);
  const shownSlug = slugEdited ? slug : slugify(title);

  const matches = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    return products.filter((p) => !picked.includes(p.id) && (!q || p.name.toLowerCase().includes(q))).slice(0, 6);
  }, [products, picked, productQuery]);

  function submit(form: HTMLFormElement, nextStatus: "draft" | "published") {
    setStatus(nextStatus);
    const formData = new FormData(form);
    formData.set("status", nextStatus);
    startTransition(() => action(formData));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        submit(e.currentTarget, submitter?.value === "published" ? "published" : "draft");
      }}
      className="grid lg:grid-cols-[1fr_300px] gap-6 items-start"
    >
      {post.id && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="productIds" value={picked.join(",")} />

      {/* Writing column */}
      <div className="space-y-5 min-w-0">
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={150}
          placeholder="Post title"
          aria-label="Post title"
          className="w-full bg-transparent font-serif text-4xl text-[#111110] placeholder:text-stone-300 focus:outline-none"
        />
        <label className={labelClass}>
          Summary
          <textarea
            name="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            maxLength={400}
            placeholder="One or two sentences shown on the blog list and under the title"
            className={`${inputClass} mt-1.5`}
          />
        </label>
        <BlogEditor name="content" initial={post.content} />

        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-medium text-stone-900 mb-1">Search engines</h2>
          <p className="text-sm text-stone-500 mb-4">Optional. Empty fields use the title and summary.</p>
          <SeoFields
            path={`/blog/${shownSlug || "…"}`}
            titleName="seoTitle"
            descriptionName="seoDescription"
            initialTitle={post.seoTitle}
            initialDescription={post.seoDescription}
            fallbackTitle={`${title || "Post title"} | Averto Journal`}
            fallbackDescription={excerpt || "Add a summary above, or write a search description here."}
            siteUrl={siteUrl}
          />
        </section>
      </div>

      {/* Settings column */}
      <aside className="space-y-4 lg:sticky lg:top-6">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3">
          <p className="text-sm text-stone-600">
            Status:{" "}
            <span className={`font-medium ${post.status === "published" ? "text-emerald-800" : "text-stone-900"}`}>
              {post.status === "published" ? "Published" : "Draft"}
            </span>
          </p>
          <div className="flex flex-col gap-2">
            <button type="submit" name="intent" value="published" disabled={pending} className={primaryButton}>
              {pending && status === "published" ? "Publishing…" : post.status === "published" ? "Update" : "Publish"}
            </button>
            <button type="submit" name="intent" value="draft" disabled={pending} className={secondaryButton}>
              {pending && status === "draft" ? "Saving…" : post.status === "published" ? "Unpublish (back to draft)" : "Save draft"}
            </button>
          </div>
          <p role="status" className={`text-sm ${state.error ? "text-red-700" : "text-emerald-800"}`}>
            {!pending && (state.error ?? state.ok)}
          </p>
          {post.id && post.status === "published" && (
            <a
              href={`/blog/${post.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900"
            >
              View post <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
          <label className={labelClass}>
            Web address
            <span className="mt-1.5 flex items-center rounded-xl border border-stone-300 bg-white focus-within:border-stone-900">
              <span className="pl-3 text-sm text-stone-400">/blog/</span>
              <input
                name="slug"
                value={shownSlug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(e.target.value);
                }}
                className="min-w-0 flex-1 bg-transparent py-2.5 pr-3 text-sm text-stone-900 focus:outline-none"
              />
            </span>
          </label>
          <label className={labelClass}>
            Date
            <input name="publishedAt" type="date" defaultValue={post.publishedAt} className={`${inputClass} mt-1.5`} />
            <span className="mt-1 block text-xs font-normal text-stone-500">
              Empty means today when published. A future date schedules it.
            </span>
          </label>
          <label className={labelClass}>
            Author
            <input name="authorName" defaultValue={post.authorName} maxLength={60} className={`${inputClass} mt-1.5`} />
          </label>
          <label className={labelClass}>
            Topics
            <input
              name="tags"
              defaultValue={post.tags}
              placeholder="e.g. Care guide, Slate"
              className={`${inputClass} mt-1.5`}
            />
            <span className="mt-1 block text-xs font-normal text-stone-500">Separate with commas.</span>
          </label>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
          <ImageUpload name="coverImage" folder="blog" initial={post.cover} label="Cover photo" help="Wide photos work best (16 × 9)." />
          <label className={labelClass}>
            Cover photo description
            <input
              name="coverAlt"
              defaultValue={post.coverAlt}
              maxLength={150}
              placeholder="e.g. Slate dining table in a sunlit room"
              className={`${inputClass} mt-1.5`}
            />
          </label>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-sm font-medium text-stone-900">Products in this post</p>
          <p className="text-xs text-stone-500 mt-0.5">Shown as cards under the post.</p>
          {picked.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {picked.map((id) => (
                <li key={id} className="flex items-center justify-between gap-2 rounded-lg bg-stone-50 px-3 py-1.5 text-sm">
                  <span className="truncate">{products.find((p) => p.id === id)?.name ?? id}</span>
                  <button
                    type="button"
                    onClick={() => setPicked(picked.filter((p) => p !== id))}
                    className="text-xs text-red-700 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <input
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            placeholder="Search products to add"
            aria-label="Search products to add"
            className={`${inputClass} mt-3`}
          />
          {matches.length > 0 && (
            <ul className="mt-2 max-h-48 overflow-y-auto">
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPicked([...picked, p.id]);
                      setProductQuery("");
                    }}
                    className="w-full text-left rounded-lg px-3 py-1.5 text-sm hover:bg-stone-100 cursor-pointer"
                  >
                    + {p.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </form>
  );
}

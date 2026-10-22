"use client";

import { useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from "@tiptap/react";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Underline,
  Undo2,
} from "lucide-react";
import { blogExtensions } from "@/lib/blog-extensions";
import { uploadMedia } from "./ImageUpload";

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // keep the text selection
      onClick={onClick}
      className={`h-9 w-9 inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
        active ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();

  function setLink() {
    const current = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link address (leave empty to remove the link)", current ?? "https://");
    if (url === null) return;
    if (!url.trim() || url.trim() === "https://") chain().extendMarkRange("link").unsetLink().run();
    else chain().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  function addImage() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const alt = window.prompt("Describe the photo in a few words (for Google and screen readers)", "") ?? "";
      setUploading(true);
      setError("");
      try {
        const { url } = await uploadMedia(file, "blog");
        chain().setImage({ src: url, alt: alt.trim() }).run();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }

  return (
    <div className="sticky top-14 lg:top-0 z-10 bg-white border-b border-stone-200 rounded-t-xl">
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 p-1.5">
        <ToolButton label="Heading" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton label="Sub-heading" active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="w-4 h-4" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-stone-200" aria-hidden />
        <ToolButton label="Bold" active={state.bold} onClick={() => chain().toggleBold().run()}>
          <Bold className="w-4 h-4" />
        </ToolButton>
        <ToolButton label="Italic" active={state.italic} onClick={() => chain().toggleItalic().run()}>
          <Italic className="w-4 h-4" />
        </ToolButton>
        <ToolButton label="Underline" active={state.underline} onClick={() => chain().toggleUnderline().run()}>
          <Underline className="w-4 h-4" />
        </ToolButton>
        <ToolButton label="Link" active={state.link} onClick={setLink}>
          <Link2 className="w-4 h-4" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-stone-200" aria-hidden />
        <ToolButton label="Bullet list" active={state.bullet} onClick={() => chain().toggleBulletList().run()}>
          <List className="w-4 h-4" />
        </ToolButton>
        <ToolButton label="Numbered list" active={state.ordered} onClick={() => chain().toggleOrderedList().run()}>
          <ListOrdered className="w-4 h-4" />
        </ToolButton>
        <ToolButton label="Quote" active={state.quote} onClick={() => chain().toggleBlockquote().run()}>
          <Quote className="w-4 h-4" />
        </ToolButton>
        <ToolButton label="Divider line" onClick={() => chain().setHorizontalRule().run()}>
          <Minus className="w-4 h-4" />
        </ToolButton>
        <ToolButton label={uploading ? "Uploading photo…" : "Add photo"} disabled={uploading} onClick={addImage}>
          <ImagePlus className="w-4 h-4" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-stone-200" aria-hidden />
        <ToolButton label="Undo" disabled={!state.canUndo} onClick={() => chain().undo().run()}>
          <Undo2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton label="Redo" disabled={!state.canRedo} onClick={() => chain().redo().run()}>
          <Redo2 className="w-4 h-4" />
        </ToolButton>
        {uploading && <span className="ml-2 text-xs text-stone-500">Uploading photo…</span>}
      </div>
      {error && (
        <p role="alert" className="px-3 pb-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

// Word-like editor for a blog post's body. The document is kept as JSON in a hidden field named
// `name`, which the server checks against the same extensions before saving.
export default function BlogEditor({ name, initial }: { name: string; initial?: JSONContent }) {
  const [json, setJson] = useState(() => JSON.stringify(initial ?? { type: "doc", content: [{ type: "paragraph" }] }));
  const editor = useEditor({
    extensions: blogExtensions,
    content: initial ?? "",
    immediatelyRender: false, // rendered on the server first; the editor starts in the browser
    editorProps: {
      attributes: {
        class: "blog-content min-h-[420px] px-5 sm:px-8 py-6 focus:outline-none",
        "aria-label": "Post body",
      },
    },
    onUpdate: ({ editor: e }) => setJson(JSON.stringify(e.getJSON())),
  });

  return (
    <div className="rounded-xl border border-stone-300 bg-white focus-within:border-stone-900 transition-colors">
      <input type="hidden" name={name} value={json} />
      {editor ? (
        <>
          <Toolbar editor={editor} />
          <EditorContent editor={editor} />
        </>
      ) : (
        <div className="min-h-[470px] animate-pulse bg-stone-50 rounded-xl" />
      )}
    </div>
  );
}

// A blog post's body, turned from the saved Tiptap document into plain React elements on the
// server (no editor code is sent to the browser). Styling lives under .blog-content in globals.css.
import type { JSONContent } from "@tiptap/core";
import { renderToReactElement } from "@tiptap/static-renderer/pm/react";
import { blogExtensions } from "@/lib/blog-extensions";

export default function PostContent({ content }: { content: JSONContent }) {
  return <div className="blog-content">{renderToReactElement({ content, extensions: blogExtensions })}</div>;
}

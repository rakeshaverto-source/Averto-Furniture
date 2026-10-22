// The blog editor's building blocks, shared by the admin editor and the page that shows a post, so
// the shop can only ever render what the editor can make. Link's URL check drops javascript: links.
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

export const blogExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] }, // the post title is the page's only h1
    codeBlock: false,
    code: false,
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      HTMLAttributes: { rel: "noopener noreferrer", target: null },
    },
  }),
  Image.configure({ HTMLAttributes: { loading: "lazy" } }),
];

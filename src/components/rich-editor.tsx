"use client";
import { useEffect, useRef, useState } from "react";
import type QuillType from "quill";
import DOMPurify from "dompurify";

export default function RichEditor({ initialValue, onChange, invalid }: { initialValue: string; onChange: (value: string) => void; invalid?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const callback = useRef(onChange);
  const initial = useRef(initialValue);
  const [failed, setFailed] = useState(false);
  callback.current = onChange;
  useEffect(() => {
    let cancelled = false;
    let editor: QuillType | undefined;
    const change = () => callback.current(DOMPurify.sanitize(editor!.getSemanticHTML(), { USE_PROFILES: { html: true } }));
    void import("quill").then(({ default: Quill }) => {
      if (cancelled || !host.current) return;
      const container = document.createElement("div");
      host.current.appendChild(container);
      editor = new Quill(container, { theme: "snow", placeholder: "Write the story behind this item…", modules: { toolbar: [[{ header: [1, 2, 3, false] }], ["bold", "italic", "underline", "strike"], [{ list: "ordered" }, { list: "bullet" }], ["blockquote", "code-block", "link"], [{ align: [] }], ["clean"]] } });
      editor.clipboard.dangerouslyPasteHTML(DOMPurify.sanitize(initial.current, { USE_PROFILES: { html: true } }));
      editor.root.setAttribute("role", "textbox");
      editor.root.setAttribute("aria-label", "Description");
      editor.root.setAttribute("aria-multiline", "true");
      editor.on("text-change", change);
    }).catch(() => { if (!cancelled) setFailed(true); });
    const element = host.current;
    return () => { cancelled = true; editor?.off("text-change", change); element?.replaceChildren(); };
  }, []);
  return <div><div ref={host} className={`rich-editor ${invalid ? "invalid-editor" : ""}`}/>{failed && <p className="field-error" role="alert">The editor could not load. Refresh this page to try again.</p>}</div>;
}

"use client";
import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
export function RichContent({ html }: { html: string }) {
  const [safe, setSafe] = useState("");
  useEffect(() => { setSafe(DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })); }, [html]);
  return <div className="rich-content ql-editor" dangerouslySetInnerHTML={{ __html: safe }}/>;
}

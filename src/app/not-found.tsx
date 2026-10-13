import Link from "next/link";
export default function NotFound() { return <div className="empty-state"><p className="eyebrow">Page not found</p><h1>This page isn’t here.</h1><p>Choose a collection to find what you’re looking for.</p><Link className="button primary" href="/">Back to overview</Link></div>; }

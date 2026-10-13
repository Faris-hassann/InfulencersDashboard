"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Plus, BookOpen } from "lucide-react";
import { resources } from "@/lib/resources";
import { api } from "@/lib/api";
import { ErrorState } from "./ui";

export function Overview() {
  const [totals, setTotals] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setError("");
    api<Record<string, number>>("/api/summary", { signal: controller.signal }).then(setTotals).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [attempt]);
  const total = totals ? Object.values(totals).reduce((sum, count) => sum + count, 0) : null;
  return <>
    <div className="page-heading"><div><p className="eyebrow">Your publishing desk</p><h1>Good ideas deserve<br/>a home<span className="amber-text">.</span></h1><p className="page-description">Books, conversations, and everything you share.<br className="desktop-break"/> Keep your world of content in order.</p></div><Link className="button primary" href="/books/new"><Plus size={18}/> Create a book</Link></div>
    <div className="collection-band"><div><span className="band-label">Your library at a glance</span><strong>{total === null ? "—" : total.toLocaleString()} <span>records</span></strong></div><p>Six collections.<br/>One workspace.</p><BookOpen size={76} strokeWidth={1} aria-hidden="true"/></div>
    <div className="section-heading"><h2>Collections</h2><span>Choose a collection to get started</span></div>
    {error && <ErrorState message={error} retry={() => setAttempt(value => value + 1)}/>}
    <div className="collection-grid">{resources.map(resource => <Link href={`/${resource.slug}`} className="collection-card" key={resource.slug}><div className="card-top"><span className="collection-icon"><resource.icon size={23}/></span><span className="record-count">{totals ? totals[resource.slug] : "—"} records</span></div><h3>{resource.title}</h3><p>{resource.description}</p><span className="card-action">Open collection <ArrowRight size={18}/></span></Link>)}</div>
    <div className="desk-note"><span className="note-rule"/><p><strong>Make room for your next idea.</strong> Create a record in any collection, then add the details at your own pace.</p></div>
  </>;
}

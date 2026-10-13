"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Plus, Layers3, MessagesSquare, FolderOpen, Clock3 } from "lucide-react";
import { resources, type RecordData, type ListResponse, formatDate, recordName } from "@/lib/resources";
import { api } from "@/lib/api";
import { ErrorState, Loading } from "./ui";
type Recent = RecordData & { collection: string; label: string };
export function Overview() {
  const [totals, setTotals] = useState<Record<string, number> | null>(null); const [recent, setRecent] = useState<Recent[]>([]);
  const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setError(""); setLoading(true);
    void Promise.all([api<Record<string,number>>("/api/summary", { signal: controller.signal }), Promise.all(resources.map(async resource => {
      const result = await api<ListResponse>(`/api/${resource.slug}?pageSize=3`, { signal: controller.signal });
      return result.data.map(record => ({ ...record, collection: resource.slug, label: resource.title }));
    }))]).then(([summary, lists]) => { setTotals(summary); setRecent(lists.flat().sort((a,b) => new Date(b.publishedOn ?? b.createdOn!).getTime() - new Date(a.publishedOn ?? a.createdOn!).getTime()).slice(0,6)); }).catch(error => { if (!controller.signal.aborted) setError(error.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  const contentCount = totals ? Object.entries(totals).filter(([key]) => key !== "contacts").reduce((sum, [,count]) => sum + count, 0) : null;
  return <>
    <section className="overview-hero"><div><span className="label-tag">Influencers World / CMS</span><h1>Your world.<br/><span>Ready to publish.</span></h1><p>Manage the books, conversations, and stories<br className="desktop-break"/> that bring Influencers World to life.</p><Link href="/books/new" className="button primary"><Plus size={18}/>Create a book</Link></div><div className="hero-brand-card"><img src="/brand/crest.jpg" alt="Official Influencers World logo"/><span>Dr. Germien Amer</span><strong>Ideas worth sharing.</strong><div className="hero-brand-rule"/></div></section>
    <div className="overview-stats"><div><span className="stat-icon"><Layers3 size={22}/></span><div><span>Content records</span><strong>{contentCount === null ? "—" : contentCount.toLocaleString()}</strong></div></div><div><span className="stat-icon"><MessagesSquare size={22}/></span><div><span>Contact messages</span><strong>{totals ? totals.contacts.toLocaleString() : "—"}</strong></div></div><div><span className="stat-icon"><FolderOpen size={22}/></span><div><span>Collections</span><strong>6</strong></div></div></div>
    <div className="section-heading"><div><p className="eyebrow">Content & community</p><h2>Your collections</h2></div><span>Everything you manage, in one place.</span></div>
    {error && <ErrorState message={error} retry={() => setAttempt(value => value + 1)}/>}
    <div className="collection-grid">{resources.map(resource => <article className="collection-card" key={resource.slug}><div className="card-top"><span className="collection-icon"><resource.icon size={23}/></span><span className="record-count">{totals ? totals[resource.slug] : "—"} records</span></div><h3><Link href={`/${resource.slug}`}>{resource.title}</Link></h3><p>{resource.description}</p><div className="card-footer"><Link href={`/${resource.slug}`} className="card-action">Manage collection<ArrowRight size={16}/></Link><Link href={`/${resource.slug}/new`} className="collection-create" aria-label={`Create ${resource.singular}`} title={`Create ${resource.singular}`}><Plus size={17}/></Link></div></article>)}</div>
    <section className="latest-panel"><div className="latest-heading"><div><Clock3 size={18}/><h2>Latest records</h2></div><span>By publication or creation date</span></div>{loading ? <Loading/> : error ? <p className="latest-empty">Records will appear here when the server is available.</p> : recent.length ? <div className="table-scroll"><table className="latest-table"><thead><tr><th>Record</th><th>Collection</th><th>Date</th><th/></tr></thead><tbody>{recent.map(record => <tr key={`${record.collection}-${record.id}`}><td><Link className="latest-title" href={`/${record.collection}/${record.id}`}>{recordName(record)}</Link></td><td><span className="collection-label">{record.label}</span></td><td className="date-cell">{formatDate(record.publishedOn ?? record.createdOn)}</td><td><Link className="icon-button" href={`/${record.collection}/${record.id}`} aria-label={`View ${recordName(record)}`}><ArrowRight size={17}/></Link></td></tr>)}</tbody></table></div> : <div className="latest-empty"><FolderOpen size={26}/><p>Your first record starts the story.<br/>Create an item in any collection to see it here.</p></div>}</section>
  </>;
}

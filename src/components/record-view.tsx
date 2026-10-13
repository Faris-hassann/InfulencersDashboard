"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, ArrowUpRight, ImageIcon, Mail, Phone, CalendarDays } from "lucide-react";
import { api } from "@/lib/api";
import { resources, type RecordData, recordName, formatDate } from "@/lib/resources";
import { Loading, ErrorState } from "./ui";
import { RichContent } from "./rich-content";
export function RecordView({ slug, id }: { slug: string; id: string }) {
  const resource = resources.find(resource => resource.slug === slug)!;
  const contact = slug === "contacts";
  const [record, setRecord] = useState<RecordData | null>(null); const [error, setError] = useState(""); const [attempt, setAttempt] = useState(0); const [imageError, setImageError] = useState(false);
  useEffect(() => {
    const controller = new AbortController(); setError(""); setRecord(null); setImageError(false);
    api<RecordData>(`/api/${slug}/${id}`, { signal: controller.signal }).then(setRecord).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [slug, id, attempt]);
  return <><Link className="back-link" href={`/${slug}`}><ArrowLeft size={16}/>Back to {resource.title.toLowerCase()}</Link>{error ? <ErrorState message={error} retry={() => setAttempt(value => value + 1)}/> : !record ? <Loading label="Loading record…"/> : <>
    <div className="page-heading compact"><div><p className="eyebrow">{resource.title} <span className="eyebrow-id">/ #{record.id}</span></p><h1 className="record-title">{recordName(record)}</h1><p className="view-date"><CalendarDays size={15}/>{contact ? "Created" : "Published"} {formatDate(record.publishedOn ?? record.createdOn)} · {new Date((record.publishedOn ?? record.createdOn)!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p></div><Link className="button primary" href={`/${slug}/${id}/edit`}><Pencil size={17}/>Edit {resource.singular}</Link></div>
    <div className="view-layout"><section className="view-content"><div className="form-section-heading"><h2>{contact ? "Message" : "Description"}</h2></div>{contact ? <p className="contact-message">{record.description}</p> : <RichContent html={record.description}/>}</section><aside className="view-aside">{contact ? <section className="detail-panel"><h2>Contact information</h2><div className="contact-detail"><Mail size={18}/><div><span>Email address</span><a href={`mailto:${record.email}`}>{record.email}</a></div></div><div className="contact-detail"><Phone size={18}/><div><span>Phone number</span><a href={`tel:${record.phoneNumber}`}>{record.phoneNumber}</a></div></div></section> : <><div className="image-preview">{!imageError ? <img src={record.imageUrl} alt={record.title ?? "Content image"} onError={() => setImageError(true)}/> : <div className="image-fallback"><ImageIcon size={35}/><p>Image could not load</p></div>}</div><section className="detail-panel"><h2>Media links</h2><a href={record.imageUrl} target="_blank" rel="noopener noreferrer" className="media-link"><ImageIcon size={18}/>Open original image<ArrowUpRight size={16}/></a><a href={record.youtubeUrl} target="_blank" rel="noopener noreferrer" className="media-link"><span className="video-dot"/>Watch on YouTube<ArrowUpRight size={16}/></a></section></>}</aside></div>
  </>}</>;
}

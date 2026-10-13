"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, ArrowRight, LoaderCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { resources, type RecordData } from "@/lib/resources";
import RichEditor from "./rich-editor";
import { Loading, ErrorState } from "./ui";
import { useToast } from "./shell";

type Values = Record<string, string>;
function localDate(iso: string) { const date = new Date(iso); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,19); }
function valuesFor(record: RecordData | null, contact: boolean): Values {
  if (contact) return { firstName: record?.firstName ?? "", lastName: record?.lastName ?? "", description: record?.description ?? "", email: record?.email ?? "", phoneNumber: record?.phoneNumber ?? "", createdOn: localDate(record?.createdOn ?? new Date().toISOString()) };
  return { title: record?.title ?? "", description: record?.description ?? "", imageUrl: record?.imageUrl ?? "", youtubeUrl: record?.youtubeUrl ?? "", publishedOn: localDate(record?.publishedOn ?? new Date().toISOString()) };
}
export function RecordForm({ slug, id }: { slug: string; id?: string }) {
  const contact = slug === "contacts"; const resource = resources.find(resource => resource.slug === slug)!;
  const [record, setRecord] = useState<RecordData | null>(null); const [ready, setReady] = useState(!id); const [loadError, setLoadError] = useState(""); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!id) return; const controller = new AbortController(); setReady(false); setLoadError("");
    api<RecordData>(`/api/${slug}/${id}`, { signal: controller.signal }).then(value => { setRecord(value); setReady(true); }).catch(error => { if (!controller.signal.aborted) setLoadError(error.message); });
    return () => controller.abort();
  }, [slug, id, attempt]);
  return <>
    <Link className="back-link" href={`/${slug}`}><ArrowLeft size={16}/>Back to {resource.title.toLowerCase()}</Link><div className="page-heading compact"><div><p className="eyebrow">{resource.title}</p><h1>{id ? "Edit" : "Create"} {resource.singular}<span className="amber-text">.</span></h1><p className="page-description">{id ? "Refine the details, then save your changes." : "Add the details and make this collection your own."}</p></div></div>
    {loadError ? <ErrorState message={loadError} retry={() => setAttempt(value => value + 1)}/> : !ready ? <Loading label="Loading record…"/> : <EditorForm key={`${slug}-${id ?? "new"}-${attempt}`} slug={slug} id={id} record={record} contact={contact}/>}
  </>;
}
function EditorForm({ slug, id, record, contact }: { slug: string; id?: string; record: RecordData | null; contact: boolean }) {
  const router = useRouter(); const toast = useToast();
  const [initial] = useState(() => valuesFor(record, contact)); const [values, setValues] = useState<Values>(initial);
  const [busy, setBusy] = useState<"POST" | "PUT" | "PATCH" | null>(null); const [error, setError] = useState(""); const [fields, setFields] = useState<Values>({});
  const changed = Object.keys(values).filter(key => values[key] !== initial[key]);
  const update = (key: string, value: string) => { setValues(current => ({ ...current, [key]: value })); setFields(current => ({ ...current, [key]: "" })); };
  async function save(method: "POST" | "PUT" | "PATCH") {
    setError(""); setFields({});
    if (method === "PATCH" && changed.length === 0) { setError("Change at least one field before saving."); return; }
    const keys = method === "PATCH" ? changed : Object.keys(values);
    const payload: Record<string, string> = {};
    for (const key of keys) {
      const value = values[key];
      if (key === "publishedOn" || key === "createdOn") {
        if (!value || Number.isNaN(new Date(value).getTime())) { setFields({ [key]: "Choose a valid date and time" }); return; }
        payload[key] = record && value === initial[key] ? (record[key] as string) : new Date(value).toISOString();
      } else payload[key] = value;
    }
    setBusy(method);
    try { const result = await api<RecordData>(`/api/${slug}${id ? `/${id}` : ""}`, { method, body: JSON.stringify(payload) }); toast(id ? "Changes saved" : "Record created"); router.push(`/${slug}/${result.id}`); }
    catch (error) { setError((error as Error).message); if (error instanceof ApiError) setFields(error.fields); }
    finally { setBusy(null); }
  }
  const field = (key: string, label: string, type = "text", placeholder = "", maxLength?: number) => <div className="field"><label htmlFor={key}>{label}<span className="required">*</span></label><input id={key} name={key} type={type} step={type === "datetime-local" ? 1 : undefined} maxLength={maxLength} required value={values[key]} disabled={!!busy} onChange={event => update(key, event.target.value)} placeholder={placeholder} aria-invalid={!!fields[key]} aria-describedby={fields[key] ? `${key}-error` : undefined}/>{fields[key] && <p className="field-error" id={`${key}-error`}>{fields[key]}</p>}</div>;
  return <form className="record-form" onSubmit={event => { event.preventDefault(); void save(id ? "PUT" : "POST"); }}>
    <div className="form-main"><section className="form-section"><div className="form-section-heading"><h2>{contact ? "Contact details" : "The essentials"}</h2><p>{contact ? "Who is getting in touch?" : "Give this item a title and a story."}</p></div>
      <div className="form-fields">{contact ? <><div className="field-row">{field("firstName", "First name", "text", "First name", 100)}{field("lastName", "Last name", "text", "Last name", 100)}</div><div className="field-row">{field("email", "Email address", "email", "name@example.com", 254)}{field("phoneNumber", "Phone number", "tel", "+20 100 000 0000", 32)}</div></> : field("title", "Title", "text", "Give your idea a title", 250)}
      <div className="field"><label htmlFor={contact ? "description" : undefined}>Description<span className="required">*</span></label>{contact ? <textarea id="description" required maxLength={10000} rows={9} value={values.description} disabled={!!busy} onChange={event => update("description", event.target.value)} placeholder="Write the contact message…" aria-invalid={!!fields.description}/> : <RichEditor initialValue={initial.description} onChange={value => update("description", value)} invalid={!!fields.description}/>}<p className="field-hint">{contact ? "The message is saved as plain text." : "Format your description with headings, lists, and links."}</p>{fields.description && <p className="field-error" role="alert">{fields.description}</p>}</div></div></section>
      {!contact && <section className="form-section"><div className="form-section-heading"><h2>Media & links</h2><p>Connect an image and a YouTube video.</p></div><div className="form-fields">{field("imageUrl", "Image URL", "url", "https://example.com/cover.jpg", 2048)}{field("youtubeUrl", "YouTube URL", "url", "https://www.youtube.com/watch?v=…", 2048)}</div></section>}
    </div><aside className="form-side"><section className="form-section"><div className="form-section-heading"><h2>{contact ? "Record date" : "Publication"}</h2><p>{contact ? "When this message was created." : "Set the publication date and time."}</p></div><div className="form-fields">{field(contact ? "createdOn" : "publishedOn", contact ? "Created on" : "Published on", "datetime-local")}<p className="field-hint">Time is shown in your local timezone.</p></div></section><section className="save-panel"><h3>{id ? "Ready to save?" : "Ready to add it?"}</h3><p>{id ? `${changed.length} ${changed.length === 1 ? "field has" : "fields have"} changed.` : "Required fields are marked with an asterisk."}</p>{error && <p className="field-error" role="alert">{error}</p>}<button className="button primary full-width" type="submit" disabled={!!busy}>{busy ? <LoaderCircle size={17} className="spin"/> : <Save size={17}/>} {busy ? "Saving…" : id ? "Save changes" : "Create record"}</button>{id && <><button className="button secondary full-width" type="button" disabled={!!busy || changed.length === 0} onClick={() => void save("PATCH")}><ArrowRight size={16}/>Save changed fields</button><p className="save-help">Save changes updates the full record. Save changed fields updates only the fields you edited.</p></>}<Link className={`cancel-link ${busy ? "disabled-link" : ""}`} href={id ? `/${slug}/${id}` : `/${slug}`}>Cancel</Link></section></aside>
  </form>;
}

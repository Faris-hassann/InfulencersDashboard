"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Plus, Search, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, ArrowDownUp, X, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { resources, type ListResponse, type RecordData, formatDate, recordName, plainText } from "@/lib/resources";
import { useToast } from "./shell";
import { ErrorState, Loading } from "./ui";

export function ResourceTable({ slug }: { slug: string }) {
  const resource = resources.find(resource => resource.slug === slug)!;
  const contact = slug === "contacts";
  const toast = useToast();
  const [query, setQuery] = useState(""); const [search, setSearch] = useState("");
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState(contact ? "createdOn" : "publishedOn"); const [order, setOrder] = useState("desc");
  const [data, setData] = useState<ListResponse | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [version, setVersion] = useState(0);
  const [deleting, setDeleting] = useState<RecordData | null>(null); const [busy, setBusy] = useState(false); const [deleteError, setDeleteError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const timer = setTimeout(() => { setSearch(query); setPage(1); }, 300); return () => clearTimeout(timer); }, [query]);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), search, sortBy: sort, order });
    api<ListResponse>(`/api/${slug}?${params}`, { signal: controller.signal }).then(result => {
      if (result.pagination.totalPages > 0 && page > result.pagination.totalPages) { setPage(result.pagination.totalPages); return; }
      setData(result);
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [slug, search, page, pageSize, sort, order, version]);
  useEffect(() => { if (deleting) dialog.current?.showModal(); else dialog.current?.close(); }, [deleting]);
  async function deleteRecord() {
    if (!deleting) return; setBusy(true); setDeleteError("");
    try { await api(`/api/${slug}/${deleting.id}`, { method: "DELETE" }); setDeleting(null); setVersion(value => value + 1); toast("Record deleted"); }
    catch (error) { setDeleteError((error as Error).message); }
    finally { setBusy(false); }
  }
  const toggleSort = (field: string) => { setPage(1); if (sort === field) setOrder(value => value === "asc" ? "desc" : "asc"); else { setSort(field); setOrder("asc"); } };
  const pagination = data?.pagination;
  return <>
    <div className="page-heading compact"><div><p className="eyebrow">Your collections</p><h1>{resource.title}<span className="amber-text">.</span></h1><p className="page-description">{resource.description}</p></div><Link href={`/${slug}/new`} className="button primary"><Plus size={18}/> Create {resource.singular}</Link></div>
    <div className="table-panel"><div className="table-toolbar"><div className="search-box"><Search size={18}/><input aria-label={`Search ${resource.title}`} value={query} onChange={event => setQuery(event.target.value)} placeholder={contact ? "Search names, email, or messages…" : "Search titles or descriptions…"}/>{query && <button className="icon-button" aria-label="Clear search" onClick={() => setQuery("")}><X size={16}/></button>}</div><div className="table-controls"><span className="record-count">{pagination ? `${pagination.total} records` : "Records"}</span><button className="icon-button" aria-label="Refresh records" onClick={() => setVersion(value => value + 1)} disabled={loading}><RefreshCw size={17}/></button></div></div>
    {loading ? <Loading/> : error ? <ErrorState message={error} retry={() => setVersion(value => value + 1)}/> : data && data.data.length > 0 ? <>
      <div className="table-scroll"><table><thead><tr><th className="id-cell"><button className="sort-button" onClick={() => toggleSort("id")}>ID <ArrowDownUp size={13}/></button></th><th><button className="sort-button" onClick={() => toggleSort(contact ? "firstName" : "title")}>{contact ? "Name & message" : "Title & description"}<ArrowDownUp size={13}/></button></th>{contact ? <><th>Email</th><th>Phone</th></> : <><th>Image</th><th>Video</th></>}<th><button className="sort-button" onClick={() => toggleSort(contact ? "createdOn" : "publishedOn")}>{contact ? "Created on" : "Published on"}<ArrowDownUp size={13}/></button></th><th className="actions-heading">Actions</th></tr></thead><tbody>{data.data.map(record => <tr key={record.id}><td className="id-cell">#{record.id}</td><td className="title-cell"><Link href={`/${slug}/${record.id}`}>{recordName(record)}</Link><p>{contact ? record.description : plainText(record.description)}</p></td>{contact ? <><td><a className="table-link" href={`mailto:${record.email}`}>{record.email}</a></td><td className="nowrap">{record.phoneNumber}</td></> : <><td><a className="table-link" href={record.imageUrl} target="_blank" rel="noopener noreferrer">Open image ↗</a></td><td><a className="video-link" href={record.youtubeUrl} target="_blank" rel="noopener noreferrer"><span className="video-dot"/> YouTube ↗</a></td></>}<td className="date-cell">{formatDate(record.publishedOn ?? record.createdOn)}</td><td><div className="row-actions"><Link className="icon-button" href={`/${slug}/${record.id}`} aria-label={`View ${recordName(record)}`} title="View"><Eye size={17}/></Link><Link className="icon-button" href={`/${slug}/${record.id}/edit`} aria-label={`Edit ${recordName(record)}`} title="Edit"><Pencil size={16}/></Link><button className="icon-button danger" onClick={() => { setDeleteError(""); setDeleting(record); }} aria-label={`Delete ${recordName(record)}`} title="Delete"><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>
      <div className="pagination"><span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.pagination.total)} of {data.pagination.total}</span><div><label>Rows <select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}><option>10</option><option>25</option><option>50</option></select></label><button className="icon-button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(value => value - 1)}><ChevronLeft size={18}/></button><span>{page} / {Math.max(1, data.pagination.totalPages)}</span><button className="icon-button" aria-label="Next page" disabled={page >= data.pagination.totalPages} onClick={() => setPage(value => value + 1)}><ChevronRight size={18}/></button></div></div>
    </> : <div className="empty-state"><span className="empty-icon"><resource.icon size={30}/></span><h2>{search ? "No matching records" : `Your ${resource.title.toLowerCase()} collection starts here`}</h2><p>{search ? "Try another title, name, or keyword." : `Create your first ${resource.singular} to fill this collection.`}</p>{search ? <button className="button secondary" onClick={() => setQuery("")}>Clear search</button> : <Link className="button primary" href={`/${slug}/new`}><Plus size={17}/>Create {resource.singular}</Link>}</div>}
    </div>
    <dialog ref={dialog} className="confirm-dialog" onCancel={event => { if (busy) event.preventDefault(); else setDeleting(null); }} onClose={() => { if (!busy) setDeleting(null); }} aria-labelledby="delete-title"><div className="delete-icon"><Trash2 size={25}/></div><h2 id="delete-title">Delete this {resource.singular}?</h2><p>“{deleting ? recordName(deleting) : ""}” will be permanently removed.</p>{deleteError && <p className="field-error" role="alert">{deleteError}</p>}<div className="dialog-actions"><button autoFocus className="button secondary" disabled={busy} onClick={() => setDeleting(null)}>Cancel</button><button className="button destructive" disabled={busy} onClick={deleteRecord}>{busy ? "Deleting…" : "Delete record"}</button></div></dialog>
  </>;
}

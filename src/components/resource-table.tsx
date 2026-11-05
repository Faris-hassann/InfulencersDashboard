"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Plus, Search, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, ArrowDownUp, X, RefreshCw, Filter, FolderTree } from "lucide-react";
import { api } from "@/lib/api";
import { resources, type ListResponse, type RecordData, formatDate, recordName, recordArabicName, plainText } from "@/lib/resources";
import { useToast } from "./shell";
import { ErrorState, Loading } from "./ui";

export function ResourceTable({ slug, initialCategory }: { slug: string; initialCategory?: string }) {
  const resource = resources.find(r => r.slug === slug)!;
  const isContact = slug === "contacts";
  const isCategory = slug === "article-categories";
  const isArticle = slug === "articles";
  const isAward = slug === "awards";

  const defaultSortField = isContact || isCategory ? "createdOn" : "publishedOn";
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState(defaultSortField);
  const [order, setOrder] = useState("desc");

  // Dynamic JSON filter initialized with initialCategory if provided
  const initialFilterStr = isArticle && initialCategory ? JSON.stringify({ articleCategoryId: Number(initialCategory) }) : "";
  const [showFilter, setShowFilter] = useState(false);
  const [filterText, setFilterText] = useState(initialFilterStr);
  const [appliedFilter, setAppliedFilter] = useState<string>(initialFilterStr);
  const [filterError, setFilterError] = useState("");
  const [categories, setCategories] = useState<{ id: number; nameEn: string; nameAr: string }[]>([]);

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  const [deleting, setDeleting] = useState<RecordData | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isArticle) {
      api<{ data: { id: number; nameEn: string; nameAr: string }[] }>("/api/article-categories?pageSize=100")
        .then(res => setCategories(res.data))
        .catch(() => {});
    }
  }, [isArticle]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      search,
      sortBy: sort,
      order,
    });
    if (appliedFilter) {
      params.set("filter", appliedFilter);
    }

    api<ListResponse>(`/api/${slug}?${params}`, { signal: controller.signal })
      .then(result => {
        if (result.pagination.totalPages > 0 && page > result.pagination.totalPages) {
          setPage(result.pagination.totalPages);
          return;
        }
        setData(result);
      })
      .catch(err => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [slug, search, page, pageSize, sort, order, version, appliedFilter]);

  useEffect(() => {
    if (deleting) dialog.current?.showModal();
    else dialog.current?.close();
  }, [deleting]);

  async function deleteRecord() {
    if (!deleting) return;
    setBusy(true);
    setDeleteError("");
    try {
      await api(`/api/${slug}/${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      setVersion(v => v + 1);
      toast("Record deleted");
    } catch (err) {
      setDeleteError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const toggleSort = (field: string) => {
    setPage(1);
    if (sort === field) {
      setOrder(o => (o === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setOrder("desc"); // Default to descending order as requested
    }
  };

  const applyJsonFilter = (rawJson: string) => {
    if (!rawJson.trim()) {
      setFilterError("");
      setAppliedFilter("");
      setPage(1);
      return;
    }
    try {
      const parsed = JSON.parse(rawJson);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setFilterError("Filter must be a valid JSON object e.g. {\"field\": \"value\"}");
        return;
      }
      setFilterError("");
      setAppliedFilter(JSON.stringify(parsed));
      setPage(1);
    } catch {
      setFilterError("Invalid JSON syntax");
    }
  };

  const pagination = data?.pagination;

  const primaryTitleSortKey = isContact ? "firstName" : isCategory ? "nameEn" : isArticle || isAward ? "titleEn" : "title";
  const dateSortKey = isContact || isCategory ? "createdOn" : "publishedOn";

  const currentCategoryObj = isArticle && initialCategory ? categories.find(c => String(c.id) === String(initialCategory)) : null;
  const createLink = isArticle && initialCategory ? `/articles/new?category=${initialCategory}` : `/${slug}/new`;

  return (
    <>
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">
            {currentCategoryObj ? (
              <>
                <Link href="/articles" style={{ color: "var(--muted)" }}>Articles</Link>
                <span style={{ margin: "0 6px" }}>/</span>
                <span style={{ color: "var(--ink)", fontWeight: 700 }}>{currentCategoryObj.nameEn}</span>
                <span className="arabic-badge" style={{ marginLeft: 6 }}>{currentCategoryObj.nameAr}</span>
              </>
            ) : (
              "Your collections"
            )}
          </p>
          <h1>
            {currentCategoryObj ? currentCategoryObj.nameEn : resource.title}
            <span className="amber-text">.</span>
          </h1>
          <p className="page-description">
            {currentCategoryObj
              ? `Viewing all articles filtered by ${currentCategoryObj.nameEn} (${currentCategoryObj.nameAr}).`
              : resource.description}
          </p>
        </div>
        <Link href={createLink} className="button primary">
          <Plus size={18}/> Create {resource.singular}
        </Link>
      </div>

      <div className="table-panel">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18}/>
            <input
              aria-label={`Search ${resource.title}`}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={isContact ? "Search names, email, or messages…" : "Search titles, Arabic text, descriptions…"}
            />
            {query && (
              <button className="icon-button" aria-label="Clear search" onClick={() => setQuery("")}>
                <X size={16}/>
              </button>
            )}
          </div>
          <div className="table-controls">
            {currentCategoryObj && (
              <div className="active-category-pill">
                <FolderTree size={13}/>
                <span>{currentCategoryObj.nameEn}</span>
                <Link href="/articles" title="Show all articles">
                  <X size={13}/>
                </Link>
              </div>
            )}
            <button
              className={`filter-toolbar-btn ${appliedFilter ? "active" : ""}`}
              onClick={() => setShowFilter(!showFilter)}
              title="Dynamic JSON filter"
            >
              <Filter size={15}/>
              <span>Filter {appliedFilter ? "(Active)" : ""}</span>
            </button>
            <span className="record-count">{pagination ? `${pagination.total} records` : "Records"}</span>
            <button
              className="icon-button"
              aria-label="Refresh records"
              onClick={() => setVersion(v => v + 1)}
              disabled={loading}
            >
              <RefreshCw size={17}/>
            </button>
          </div>
        </div>

        {/* Dynamic JSON Filter Panel */}
        {showFilter && (
          <div className="json-filter-panel">
            {isArticle && (
              <select
                className="category-select-filter"
                onChange={e => {
                  const val = e.target.value;
                  if (!val) {
                    setFilterText("");
                    applyJsonFilter("");
                  } else {
                    const jsonStr = JSON.stringify({ articleCategoryId: Number(val) });
                    setFilterText(jsonStr);
                    applyJsonFilter(jsonStr);
                  }
                }}
              >
                <option value="">Quick filter by Category…</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nameEn} ({c.nameAr})
                  </option>
                ))}
              </select>
            )}
            <input
              className="json-filter-input"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder={
                isArticle
                  ? 'JSON filter: {"articleCategoryId": 1} or {"titleEn": "Trends"}'
                  : isCategory
                  ? 'JSON filter: {"nameEn": "Tech"}'
                  : isContact
                  ? 'JSON filter: {"email": "..."}'
                  : 'JSON filter: {"title": "..."}'
              }
              onKeyDown={e => { if (e.key === "Enter") applyJsonFilter(filterText); }}
            />
            <button className="button secondary" style={{ minHeight: 34, padding: "5px 12px" }} onClick={() => applyJsonFilter(filterText)}>
              Apply JSON
            </button>
            {appliedFilter && (
              <button
                className="button secondary"
                style={{ minHeight: 34, padding: "5px 10px" }}
                onClick={() => { setFilterText(""); applyJsonFilter(""); }}
              >
                Clear
              </button>
            )}
            {filterError && <p className="field-error" style={{ margin: 0, width: "100%" }}>{filterError}</p>}
          </div>
        )}

        {loading ? (
          <Loading/>
        ) : error ? (
          <ErrorState message={error} retry={() => setVersion(v => v + 1)}/>
        ) : data && data.data.length > 0 ? (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th className="id-cell">
                      <button className="sort-button" onClick={() => toggleSort("id")}>
                        ID <ArrowDownUp size={13}/>
                      </button>
                    </th>
                    <th>
                      <button className="sort-button" onClick={() => toggleSort(primaryTitleSortKey)}>
                        {isContact ? "Name & message" : isCategory ? "Category name & description" : "Title & description"}
                        <ArrowDownUp size={13}/>
                      </button>
                    </th>
                    {isContact ? (
                      <>
                        <th>Email</th>
                        <th>Phone</th>
                      </>
                    ) : isCategory ? (
                      <th>Name (Arabic)</th>
                    ) : isArticle ? (
                      <>
                        <th>Category</th>
                        <th>Images</th>
                      </>
                    ) : isAward ? (
                      <th>Images</th>
                    ) : (
                      <>
                        <th>Image</th>
                        <th>Video</th>
                      </>
                    )}
                    <th>
                      <button className="sort-button" onClick={() => toggleSort(dateSortKey)}>
                        {isContact || isCategory ? "Created on" : "Published on"}
                        <ArrowDownUp size={13}/>
                      </button>
                    </th>
                    <th className="actions-heading">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map(record => {
                    const ar = recordArabicName(record);
                    const descText = plainText(record.descriptionEn ?? record.description);
                    return (
                      <tr key={record.id}>
                        <td className="id-cell">#{record.id}</td>
                        <td className="title-cell">
                          <Link href={`/${slug}/${record.id}`}>{recordName(record)}</Link>
                          {ar && (
                            <p dir="rtl" style={{ color: "#925f16", fontSize: 10, marginTop: 2, fontWeight: 600 }}>
                              {ar}
                            </p>
                          )}
                          <p>{descText}</p>
                        </td>

                        {isContact ? (
                          <>
                            <td><a className="table-link" href={`mailto:${record.email}`}>{record.email}</a></td>
                            <td className="nowrap">{record.phoneNumber}</td>
                          </>
                        ) : isCategory ? (
                          <td dir="rtl" className="nowrap" style={{ fontWeight: 650, color: "#925f16" }}>
                            {record.nameAr}
                          </td>
                        ) : isArticle ? (
                          <>
                            <td>
                              {record.articleCategory ? (
                                <span className="collection-label">
                                  <FolderTree size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }}/>
                                  {record.articleCategory.nameEn}
                                </span>
                              ) : (
                                <span style={{ color: "var(--muted)" }}>—</span>
                              )}
                            </td>
                            <td>
                              {record.imageUrls && record.imageUrls.length > 0 ? (
                                <span className="collection-label">
                                  {record.imageUrls.length} image{record.imageUrls.length > 1 ? "s" : ""}
                                </span>
                              ) : (
                                <span style={{ color: "var(--muted)" }}>0</span>
                              )}
                            </td>
                          </>
                        ) : isAward ? (
                          <td>
                            {record.imageUrls && record.imageUrls.length > 0 ? (
                              <span className="collection-label">
                                {record.imageUrls.length} image{record.imageUrls.length > 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span style={{ color: "var(--muted)" }}>0</span>
                            )}
                          </td>
                        ) : (
                          <>
                            <td>
                              {record.imageUrl ? (
                                <a className="table-link" href={record.imageUrl} target="_blank" rel="noopener noreferrer">
                                  Open image ↗
                                </a>
                              ) : "—"}
                            </td>
                            <td>
                              {record.youtubeUrl ? (
                                <a className="video-link" href={record.youtubeUrl} target="_blank" rel="noopener noreferrer">
                                  <span className="video-dot"/> YouTube ↗
                                </a>
                              ) : (
                                <span style={{ color: "var(--muted)", fontSize: 10 }}>—</span>
                              )}
                            </td>
                          </>
                        )}

                        <td className="date-cell">{formatDate(record.publishedOn ?? record.createdOn)}</td>
                        <td>
                          <div className="row-actions">
                            <Link className="icon-button" href={`/${slug}/${record.id}`} aria-label={`View ${recordName(record)}`} title="View">
                              <Eye size={17}/>
                            </Link>
                            <Link className="icon-button" href={`/${slug}/${record.id}/edit`} aria-label={`Edit ${recordName(record)}`} title="Edit">
                              <Pencil size={16}/>
                            </Link>
                            <button
                              className="icon-button danger"
                              onClick={() => { setDeleteError(""); setDeleting(record); }}
                              aria-label={`Delete ${recordName(record)}`}
                              title="Delete"
                            >
                              <Trash2 size={16}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span>
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.pagination.total)} of {data.pagination.total}
              </span>
              <div>
                <label>
                  Rows{" "}
                  <select
                    value={pageSize}
                    onChange={e => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                  </select>
                </label>
                <button className="icon-button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(v => v - 1)}>
                  <ChevronLeft size={18}/>
                </button>
                <span>{page} / {Math.max(1, data.pagination.totalPages)}</span>
                <button className="icon-button" aria-label="Next page" disabled={page >= data.pagination.totalPages} onClick={() => setPage(v => v + 1)}>
                  <ChevronRight size={18}/>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <span className="empty-icon"><resource.icon size={30}/></span>
            <h2>{search || appliedFilter ? "No matching records" : `Your ${resource.title.toLowerCase()} collection starts here`}</h2>
            <p>{search || appliedFilter ? "Try adjusting your search or dynamic filter." : `Create your first ${resource.singular} to fill this collection.`}</p>
            {search || appliedFilter ? (
              <button
                className="button secondary"
                onClick={() => {
                  setQuery("");
                  setFilterText("");
                  setAppliedFilter("");
                }}
              >
                Clear search & filters
              </button>
            ) : (
              <Link className="button primary" href={createLink}>
                <Plus size={17}/>Create {resource.singular}
              </Link>
            )}
          </div>
        )}
      </div>

      <dialog
        ref={dialog}
        className="confirm-dialog"
        onCancel={e => { if (busy) e.preventDefault(); else setDeleting(null); }}
        onClose={() => { if (!busy) setDeleting(null); }}
        aria-labelledby="delete-title"
      >
        <div className="delete-icon"><Trash2 size={25}/></div>
        <h2 id="delete-title">Delete this {resource.singular}?</h2>
        <p>“{deleting ? recordName(deleting) : ""}” will be permanently removed.</p>
        {deleteError && <p className="field-error" role="alert">{deleteError}</p>}
        <div className="dialog-actions">
          <button autoFocus className="button secondary" disabled={busy} onClick={() => setDeleting(null)}>
            Cancel
          </button>
          <button className="button destructive" disabled={busy} onClick={deleteRecord}>
            {busy ? "Deleting…" : "Delete record"}
          </button>
        </div>
      </dialog>
    </>
  );
}

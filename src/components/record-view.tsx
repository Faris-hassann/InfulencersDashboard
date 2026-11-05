"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, ArrowUpRight, ImageIcon, Mail, Phone, CalendarDays, FolderTree } from "lucide-react";
import { api } from "@/lib/api";
import { resources, type RecordData, recordName, recordArabicName, formatDate } from "@/lib/resources";
import { Loading, ErrorState } from "./ui";
import { RichContent } from "./rich-content";

export function RecordView({ slug, id }: { slug: string; id: string }) {
  const resource = resources.find(r => r.slug === slug)!;
  const isContact = slug === "contacts";
  const isCategory = slug === "article-categories";
  const isArticle = slug === "articles";
  const isAward = slug === "awards";

  const [record, setRecord] = useState<RecordData | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setRecord(null);
    setImageError(false);
    api<RecordData>(`/api/${slug}/${id}`, { signal: controller.signal })
      .then(setRecord)
      .catch(err => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [slug, id, attempt]);

  const arTitle = record ? recordArabicName(record) : undefined;
  const hasMultipleImages = record?.imageUrls && record.imageUrls.length > 0;
  const descEn = record?.descriptionEn ?? record?.description;
  const descAr = record?.descriptionAr;

  return (
    <>
      <Link className="back-link" href={`/${slug}`}>
        <ArrowLeft size={16}/>Back to {resource.title.toLowerCase()}
      </Link>
      {error ? (
        <ErrorState message={error} retry={() => setAttempt(value => value + 1)}/>
      ) : !record ? (
        <Loading label="Loading record…"/>
      ) : (
        <>
          <div className="page-heading compact">
            <div>
              <p className="eyebrow">
                {resource.title} <span className="eyebrow-id">/ #{record.id}</span>
                {record.articleCategory && (
                  <span style={{ marginLeft: 12, display: "inline-flex", alignItems: "center", gap: 5, color: "#85631e", background: "#fdf5e6", padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 650 }}>
                    <FolderTree size={12}/>{record.articleCategory.nameEn}
                  </span>
                )}
              </p>
              <h1 className="record-title">{recordName(record)}</h1>
              {arTitle && (
                <p dir="rtl" style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#925f16" }}>
                  {arTitle}
                </p>
              )}
              <p className="view-date">
                <CalendarDays size={15}/>
                {isContact || isCategory ? "Created" : "Published"} {formatDate(record.publishedOn ?? record.createdOn)} ·{" "}
                {new Date((record.publishedOn ?? record.createdOn)!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <Link className="button primary" href={`/${slug}/${id}/edit`}>
              <Pencil size={17}/>Edit {resource.singular}
            </Link>
          </div>

          <div className="view-layout">
            <section className="view-content">
              {/* English Description / Message */}
              <div className="form-section-heading">
                <h2>{isContact ? "Message (English)" : "Description (English)"}</h2>
              </div>
              {isContact ? (
                <p className="contact-message">{descEn}</p>
              ) : (
                <RichContent html={descEn ?? ""}/>
              )}

              {/* Arabic Description / Message */}
              {descAr && (
                <>
                  <div className="form-section-heading" style={{ borderTop: "1px solid var(--line)" }}>
                    <h2 dir="rtl">{isContact ? "الرسالة (بالعربية)" : "الوصف (بالعربية)"}</h2>
                  </div>
                  <div dir="rtl">
                    {isContact ? (
                      <p className="contact-message rtl-content">{descAr}</p>
                    ) : (
                      <RichContent html={descAr}/>
                    )}
                  </div>
                </>
              )}
            </section>

            <aside className="view-aside">
              {isContact ? (
                <section className="detail-panel">
                  <h2>Contact information</h2>
                  <div className="contact-detail">
                    <Mail size={18}/>
                    <div>
                      <span>Email address</span>
                      <a href={`mailto:${record.email}`}>{record.email}</a>
                    </div>
                  </div>
                  <div className="contact-detail">
                    <Phone size={18}/>
                    <div>
                      <span>Phone number</span>
                      <a href={`tel:${record.phoneNumber}`}>{record.phoneNumber}</a>
                    </div>
                  </div>
                </section>
              ) : isCategory ? (
                <section className="detail-panel">
                  <h2>Category summary</h2>
                  <div className="contact-detail">
                    <FolderTree size={18}/>
                    <div>
                      <span>English & Arabic Name</span>
                      <strong>{record.nameEn}</strong>
                      <p dir="rtl" style={{ margin: "4px 0 0", color: "#925f16" }}>{record.nameAr}</p>
                    </div>
                  </div>
                </section>
              ) : hasMultipleImages ? (
                <section className="detail-panel">
                  <h2>Images Gallery ({record.imageUrls?.length})</h2>
                  <div className="image-gallery-grid">
                    {record.imageUrls?.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="image-gallery-item"
                        title={`Open Image ${idx + 1}`}
                      >
                        <img
                          src={url}
                          alt={`${recordName(record)} image ${idx + 1}`}
                          onError={e => { (e.currentTarget as HTMLElement).style.display = "none"; }}
                        />
                      </a>
                    ))}
                  </div>
                  <div style={{ marginTop: 18 }}>
                    {record.imageUrls?.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="media-link">
                        <ImageIcon size={16}/>Image {idx + 1}<ArrowUpRight size={15}/>
                      </a>
                    ))}
                  </div>
                </section>
              ) : (
                <>
                  <div className="image-preview">
                    {!imageError && record.imageUrl ? (
                      <img src={record.imageUrl} alt={record.title ?? "Content image"} onError={() => setImageError(true)}/>
                    ) : (
                      <div className="image-fallback">
                        <ImageIcon size={35}/>
                        <p>{record.imageUrl ? "Image could not load" : "No image attached"}</p>
                      </div>
                    )}
                  </div>
                  <section className="detail-panel">
                    <h2>Media links</h2>
                    {record.imageUrl && (
                      <a href={record.imageUrl} target="_blank" rel="noopener noreferrer" className="media-link">
                        <ImageIcon size={18}/>Open original image<ArrowUpRight size={16}/>
                      </a>
                    )}
                    {record.youtubeUrl && (
                      <a href={record.youtubeUrl} target="_blank" rel="noopener noreferrer" className="media-link">
                        <span className="video-dot"/>Watch on YouTube<ArrowUpRight size={16}/>
                      </a>
                    )}
                    {!record.youtubeUrl && (
                      <p style={{ fontSize: 11, color: "var(--muted)", margin: "10px 0 0" }}>
                        No YouTube video attached.
                      </p>
                    )}
                  </section>
                </>
              )}
            </aside>
          </div>
        </>
      )}
    </>
  );
}

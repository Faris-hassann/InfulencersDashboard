"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, ArrowRight, LoaderCircle, Plus, Trash2, ImageIcon } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { resources, type RecordData } from "@/lib/resources";
import RichEditor from "./rich-editor";
import { Loading, ErrorState } from "./ui";
import { useToast } from "./shell";

type Values = Record<string, any>;
function localDate(iso: string) {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
}

function valuesFor(record: RecordData | null, slug: string): Values {
  if (slug === "contacts") {
    return {
      firstName: record?.firstName ?? "",
      firstNameAr: record?.firstNameAr ?? "",
      lastName: record?.lastName ?? "",
      lastNameAr: record?.lastNameAr ?? "",
      description: record?.description ?? "",
      descriptionAr: record?.descriptionAr ?? "",
      email: record?.email ?? "",
      phoneNumber: record?.phoneNumber ?? "",
      createdOn: localDate(record?.createdOn ?? new Date().toISOString()),
    };
  }
  if (slug === "article-categories") {
    return {
      nameEn: record?.nameEn ?? "",
      nameAr: record?.nameAr ?? "",
      descriptionEn: record?.descriptionEn ?? "",
      descriptionAr: record?.descriptionAr ?? "",
      createdOn: localDate(record?.createdOn ?? new Date().toISOString()),
    };
  }
  if (slug === "articles") {
    return {
      titleEn: record?.titleEn ?? "",
      titleAr: record?.titleAr ?? "",
      descriptionEn: record?.descriptionEn ?? "",
      descriptionAr: record?.descriptionAr ?? "",
      articleCategoryId: record?.articleCategoryId ? String(record.articleCategoryId) : "",
      imageUrls: record?.imageUrls && record.imageUrls.length > 0 ? record.imageUrls : [""],
      publishedOn: localDate(record?.publishedOn ?? new Date().toISOString()),
    };
  }
  if (slug === "awards") {
    return {
      titleEn: record?.titleEn ?? "",
      titleAr: record?.titleAr ?? "",
      descriptionEn: record?.descriptionEn ?? "",
      descriptionAr: record?.descriptionAr ?? "",
      imageUrls: record?.imageUrls && record.imageUrls.length > 0 ? record.imageUrls : [""],
      publishedOn: localDate(record?.publishedOn ?? new Date().toISOString()),
    };
  }
  return {
    title: record?.title ?? "",
    titleAr: record?.titleAr ?? "",
    description: record?.description ?? "",
    descriptionAr: record?.descriptionAr ?? "",
    imageUrl: record?.imageUrl ?? "",
    youtubeUrl: record?.youtubeUrl ?? "",
    publishedOn: localDate(record?.publishedOn ?? new Date().toISOString()),
  };
}

export function RecordForm({ slug, id }: { slug: string; id?: string }) {
  const resource = resources.find(r => r.slug === slug)!;
  const [record, setRecord] = useState<RecordData | null>(null);
  const [ready, setReady] = useState(!id);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setReady(false);
    setLoadError("");
    api<RecordData>(`/api/${slug}/${id}`, { signal: controller.signal })
      .then(value => { setRecord(value); setReady(true); })
      .catch(error => { if (!controller.signal.aborted) setLoadError(error.message); });
    return () => controller.abort();
  }, [slug, id, attempt]);

  return (
    <>
      <Link className="back-link" href={`/${slug}`}><ArrowLeft size={16}/>Back to {resource.title.toLowerCase()}</Link>
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">{resource.title}</p>
          <h1>{id ? "Edit" : "Create"} {resource.singular}<span className="amber-text">.</span></h1>
          <p className="page-description">{id ? "Refine the details, then save your changes." : "Add the details and make this collection your own."}</p>
        </div>
      </div>
      {loadError ? (
        <ErrorState message={loadError} retry={() => setAttempt(value => value + 1)}/>
      ) : !ready ? (
        <Loading label="Loading record…"/>
      ) : (
        <EditorForm key={`${slug}-${id ?? "new"}-${attempt}`} slug={slug} id={id} record={record}/>
      )}
    </>
  );
}

function EditorForm({ slug, id, record }: { slug: string; id?: string; record: RecordData | null }) {
  const resource = resources.find(r => r.slug === slug)!;
  const router = useRouter();
  const toast = useToast();
  const isContact = slug === "contacts";
  const isCategory = slug === "article-categories";
  const isArticle = slug === "articles";
  const isAward = slug === "awards";
  const hasMultipleImages = isArticle || isAward;

  const [initial] = useState(() => valuesFor(record, slug));
  const [values, setValues] = useState<Values>(initial);
  const [busy, setBusy] = useState<"POST" | "PUT" | "PATCH" | null>(null);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<{ id: number; nameEn: string; nameAr: string }[]>([]);

  useEffect(() => {
    if (isArticle) {
      api<{ data: { id: number; nameEn: string; nameAr: string }[] }>("/api/article-categories?pageSize=100")
        .then(res => setCategories(res.data))
        .catch(() => {});
    }
  }, [isArticle]);

  const changed = Object.keys(values).filter(key => {
    if (Array.isArray(values[key]) && Array.isArray(initial[key])) {
      return JSON.stringify(values[key]) !== JSON.stringify(initial[key]);
    }
    return values[key] !== initial[key];
  });

  const update = (key: string, value: any) => {
    setValues(current => ({ ...current, [key]: value }));
    setFields(current => ({ ...current, [key]: "" }));
  };

  const updateImageUrl = (index: number, val: string) => {
    const list = [...(values.imageUrls ?? [])];
    list[index] = val;
    update("imageUrls", list);
  };

  const addImageUrl = () => {
    const list = [...(values.imageUrls ?? []), ""];
    update("imageUrls", list);
  };

  const removeImageUrl = (index: number) => {
    const list = (values.imageUrls ?? []).filter((_: any, i: number) => i !== index);
    update("imageUrls", list.length > 0 ? list : [""]);
  };

  async function save(method: "POST" | "PUT" | "PATCH") {
    setError("");
    setFields({});
    if (method === "PATCH" && changed.length === 0) {
      setError("Change at least one field before saving.");
      return;
    }

    const payload: Record<string, any> = {};
    const keys = method === "PATCH" ? changed : Object.keys(values);

    for (const key of keys) {
      const val = values[key];
      if (key === "publishedOn" || key === "createdOn") {
        if (!val || Number.isNaN(new Date(val).getTime())) {
          setFields(f => ({ ...f, [key]: "Choose a valid date and time" }));
          return;
        }
        payload[key] = record && val === initial[key] ? record[key] : new Date(val).toISOString();
      } else if (key === "imageUrls") {
        const cleanList = Array.isArray(val) ? val.filter((u: string) => typeof u === "string" && u.trim().length > 0) : [];
        payload[key] = cleanList;
      } else if (key === "articleCategoryId") {
        payload[key] = val && val !== "" ? Number(val) : null;
      } else if (key === "youtubeUrl") {
        payload[key] = val && val.trim() ? val.trim() : null;
      } else if (["titleAr", "descriptionAr", "firstNameAr", "lastNameAr"].includes(key)) {
        payload[key] = val && typeof val === "string" && val.trim() ? val.trim() : null;
      } else {
        payload[key] = val;
      }
    }

    setBusy(method);
    try {
      const result = await api<RecordData>(`/api/${slug}${id ? `/${id}` : ""}`, {
        method,
        body: JSON.stringify(payload),
      });
      toast(id ? "Changes saved" : "Record created");
      router.push(`/${slug}/${result.id}`);
    } catch (err) {
      setError((err as Error).message);
      if (err instanceof ApiError) setFields(err.fields);
    } finally {
      setBusy(null);
    }
  }

  const renderField = (
    key: string,
    label: string,
    type = "text",
    placeholder = "",
    maxLength?: number,
    required = true,
    isRtl = false
  ) => (
    <div className="field">
      <label htmlFor={key}>
        {label}
        {required && <span className="required">*</span>}
        {isRtl && <span className="arabic-badge">عربي</span>}
      </label>
      <input
        id={key}
        name={key}
        type={type}
        step={type === "datetime-local" ? 1 : undefined}
        maxLength={maxLength}
        required={required}
        value={values[key] ?? ""}
        disabled={!!busy}
        dir={isRtl ? "rtl" : undefined}
        className={isRtl ? "rtl-input" : undefined}
        onChange={event => update(key, event.target.value)}
        placeholder={placeholder}
        aria-invalid={!!fields[key]}
        aria-describedby={fields[key] ? `${key}-error` : undefined}
      />
      {fields[key] && <p className="field-error" id={`${key}-error`}>{fields[key]}</p>}
    </div>
  );

  return (
    <form className="record-form" onSubmit={event => { event.preventDefault(); void save(id ? "PUT" : "POST"); }}>
      <div className="form-main">
        {/* Contact details */}
        {isContact && (
          <section className="form-section">
            <div className="form-section-heading">
              <h2>Contact details</h2>
              <p>Who is getting in touch?</p>
            </div>
            <div className="form-fields">
              <div className="field-row">
                {renderField("firstName", "First name (English)", "text", "First name", 100, true)}
                {renderField("firstNameAr", "الاسم الأول (بالعربية)", "text", "الاسم الأول", 100, false, true)}
              </div>
              <div className="field-row">
                {renderField("lastName", "Last name (English)", "text", "Last name", 100, true)}
                {renderField("lastNameAr", "اسم العائلة (بالعربية)", "text", "اسم العائلة", 100, false, true)}
              </div>
              <div className="field-row">
                {renderField("email", "Email address", "email", "name@example.com", 254, true)}
                {renderField("phoneNumber", "Phone number", "tel", "+20 100 000 0000", 32, true)}
              </div>
              <div className="field">
                <label htmlFor="description">Message (English)<span className="required">*</span></label>
                <textarea
                  id="description"
                  required
                  maxLength={10000}
                  rows={6}
                  value={values.description ?? ""}
                  disabled={!!busy}
                  onChange={e => update("description", e.target.value)}
                  placeholder="Write the contact message…"
                  aria-invalid={!!fields.description}
                />
                {fields.description && <p className="field-error">{fields.description}</p>}
              </div>
              <div className="field">
                <label htmlFor="descriptionAr">الرسالة (بالعربية)<span className="arabic-badge">عربي</span></label>
                <textarea
                  id="descriptionAr"
                  maxLength={10000}
                  rows={6}
                  dir="rtl"
                  className="rtl-input"
                  value={values.descriptionAr ?? ""}
                  disabled={!!busy}
                  onChange={e => update("descriptionAr", e.target.value)}
                  placeholder="اكتب الرسالة بالعربية…"
                />
              </div>
            </div>
          </section>
        )}

        {/* Article Category */}
        {isCategory && (
          <section className="form-section">
            <div className="form-section-heading">
              <h2>Category details</h2>
              <p>Name and describe this article category in English and Arabic.</p>
            </div>
            <div className="form-fields">
              <div className="field-row">
                {renderField("nameEn", "Category Name (English)", "text", "e.g. Technology & Future", 250, true)}
                {renderField("nameAr", "اسم التصنيف (بالعربية)", "text", "مثال: التكنولوجيا والمستقبل", 250, true, true)}
              </div>
              <div className="field">
                <label>Description (English)<span className="required">*</span></label>
                <RichEditor initialValue={initial.descriptionEn ?? ""} onChange={v => update("descriptionEn", v)} invalid={!!fields.descriptionEn}/>
                {fields.descriptionEn && <p className="field-error">{fields.descriptionEn}</p>}
              </div>
              <div className="field">
                <label>الوصف (بالعربية)<span className="required">*</span><span className="arabic-badge">عربي</span></label>
                <div dir="rtl" className="rtl-editor">
                  <RichEditor initialValue={initial.descriptionAr ?? ""} onChange={v => update("descriptionAr", v)} invalid={!!fields.descriptionAr}/>
                </div>
                {fields.descriptionAr && <p className="field-error">{fields.descriptionAr}</p>}
              </div>
            </div>
          </section>
        )}

        {/* Articles & Awards */}
        {(isArticle || isAward) && (
          <>
            <section className="form-section">
              <div className="form-section-heading">
                <h2>{isArticle ? "Article title & category" : "Award details"}</h2>
                <p>Provide the English and Arabic titles and descriptions.</p>
              </div>
              <div className="form-fields">
                <div className="field-row">
                  {renderField("titleEn", "Title (English)", "text", "Enter English title…", 250, true)}
                  {renderField("titleAr", "العنوان (بالعربية)", "text", "اكتب العنوان بالعربية…", 250, true, true)}
                </div>

                {isArticle && (
                  <div className="field">
                    <label htmlFor="articleCategoryId">Article Category</label>
                    <select
                      id="articleCategoryId"
                      value={values.articleCategoryId ?? ""}
                      disabled={!!busy}
                      onChange={e => update("articleCategoryId", e.target.value)}
                      className="category-select-filter"
                      style={{ width: "100%", padding: "11px 12px", border: "1px solid #d8dbe1", borderRadius: 5 }}
                    >
                      <option value="">No category (unassigned)</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nameEn} ({cat.nameAr})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="field">
                  <label>Description (English)<span className="required">*</span></label>
                  <RichEditor initialValue={initial.descriptionEn ?? ""} onChange={v => update("descriptionEn", v)} invalid={!!fields.descriptionEn}/>
                  {fields.descriptionEn && <p className="field-error">{fields.descriptionEn}</p>}
                </div>
                <div className="field">
                  <label>الوصف (بالعربية)<span className="required">*</span><span className="arabic-badge">عربي</span></label>
                  <div dir="rtl">
                    <RichEditor initialValue={initial.descriptionAr ?? ""} onChange={v => update("descriptionAr", v)} invalid={!!fields.descriptionAr}/>
                  </div>
                  {fields.descriptionAr && <p className="field-error">{fields.descriptionAr}</p>}
                </div>
              </div>
            </section>

            {/* Multiple images for articles & awards */}
            <section className="form-section">
              <div className="form-section-heading">
                <h2>Images Gallery</h2>
                <p>Add one or multiple image URLs for this {resource.singular}.</p>
              </div>
              <div className="form-fields">
                <div className="image-urls-list">
                  {(values.imageUrls ?? [""]).map((imgUrl: string, idx: number) => (
                    <div key={idx} className="image-url-row">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={`Thumbnail ${idx + 1}`}
                          className="image-url-thumb"
                          onError={e => { (e.currentTarget as HTMLElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="image-url-thumb" style={{ display: "grid", placeItems: "center", color: "#9ca3af" }}>
                          <ImageIcon size={18}/>
                        </div>
                      )}
                      <input
                        type="url"
                        value={imgUrl}
                        disabled={!!busy}
                        onChange={e => updateImageUrl(idx, e.target.value)}
                        placeholder={`https://example.com/image-${idx + 1}.jpg`}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="icon-button danger"
                        onClick={() => removeImageUrl(idx)}
                        title="Remove image URL"
                        disabled={!!busy}
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="button secondary"
                  style={{ alignSelf: "flex-start", marginTop: 8 }}
                  onClick={addImageUrl}
                  disabled={!!busy}
                >
                  <Plus size={16}/> Add another image URL
                </button>
              </div>
            </section>
          </>
        )}

        {/* Standard content (books, podcasts, tips-and-tricks, news, newsletters) */}
        {!isContact && !isCategory && !isArticle && !isAward && (
          <>
            <section className="form-section">
              <div className="form-section-heading">
                <h2>The essentials</h2>
                <p>Give this item a title and story in English and optional Arabic.</p>
              </div>
              <div className="form-fields">
                <div className="field-row">
                  {renderField("title", "Title (English)", "text", "Give your idea a title", 250, true)}
                  {renderField("titleAr", "العنوان (بالعربية)", "text", "اكتب العنوان بالعربية (اختياري)", 250, false, true)}
                </div>
                <div className="field">
                  <label>Description (English)<span className="required">*</span></label>
                  <RichEditor initialValue={initial.description ?? ""} onChange={v => update("description", v)} invalid={!!fields.description}/>
                  <p className="field-hint">Format your description with headings, lists, and links.</p>
                  {fields.description && <p className="field-error">{fields.description}</p>}
                </div>
                <div className="field">
                  <label>الوصف (بالعربية)<span className="arabic-badge">عربي - اختياري</span></label>
                  <div dir="rtl">
                    <RichEditor initialValue={initial.descriptionAr ?? ""} onChange={v => update("descriptionAr", v)}/>
                  </div>
                </div>
              </div>
            </section>

            <section className="form-section">
              <div className="form-section-heading">
                <h2>Media & links</h2>
                <p>Connect a cover image and optional YouTube video.</p>
              </div>
              <div className="form-fields">
                {renderField("imageUrl", "Cover Image URL", "url", "https://example.com/cover.jpg", 2048, true)}
                {renderField("youtubeUrl", "YouTube URL (Optional)", "url", "https://www.youtube.com/watch?v=… (optional)", 2048, false)}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Aside panel for publication date & actions */}
      <aside className="form-side">
        <section className="form-section">
          <div className="form-section-heading">
            <h2>{isContact || isCategory ? "Record date" : "Publication"}</h2>
            <p>{isContact || isCategory ? "When this record was created." : "Set the publication date and time."}</p>
          </div>
          <div className="form-fields">
            {renderField(
              isContact || isCategory ? "createdOn" : "publishedOn",
              isContact || isCategory ? "Created on" : "Published on",
              "datetime-local",
              "",
              undefined,
              true
            )}
            <p className="field-hint">Time is shown in your local timezone.</p>
          </div>
        </section>

        <section className="save-panel">
          <h3>{id ? "Ready to save?" : "Ready to add it?"}</h3>
          <p>{id ? `${changed.length} ${changed.length === 1 ? "field has" : "fields have"} changed.` : "Required fields are marked with an asterisk."}</p>
          {error && <p className="field-error" role="alert">{error}</p>}
          <button className="button primary full-width" type="submit" disabled={!!busy}>
            {busy ? <LoaderCircle size={17} className="spin"/> : <Save size={17}/>} {busy ? "Saving…" : id ? "Save changes" : "Create record"}
          </button>
          {id && (
            <>
              <button
                className="button secondary full-width"
                type="button"
                disabled={!!busy || changed.length === 0}
                onClick={() => void save("PATCH")}
              >
                <ArrowRight size={16}/>Save changed fields
              </button>
              <p className="save-help">Save changes updates the full record. Save changed fields updates only the fields you edited.</p>
            </>
          )}
          <Link className={`cancel-link ${busy ? "disabled-link" : ""}`} href={id ? `/${slug}/${id}` : `/${slug}`}>Cancel</Link>
        </section>
      </aside>
    </form>
  );
}

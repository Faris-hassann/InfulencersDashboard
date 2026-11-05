"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  LayoutDashboard,
  Menu,
  X,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  FileText,
  Plus,
  FolderTree,
  FolderOpen,
} from "lucide-react";
import { resources } from "@/lib/resources";
import { api } from "@/lib/api";
import type { AdminUser } from "@/lib/auth-server";

const ToastContext = createContext<(message: string) => void>(() => {});
export function useToast() { return useContext(ToastContext); }

type CategoryItem = { id: number; nameEn: string; nameAr: string };

function isWomenCategory(nameEn?: string, nameAr?: string): boolean {
  const en = (nameEn ?? "").toLowerCase();
  const ar = nameAr ?? "";
  return (
    en.includes("women") ||
    en.includes("woman") ||
    ar.includes("المرأة") ||
    ar.includes("سيدات") ||
    ar.includes("نساء") ||
    ar.includes("حواء")
  );
}

function sortCategories(list: CategoryItem[]): CategoryItem[] {
  return [...list].sort((a, b) => {
    const aIsWomen = isWomenCategory(a.nameEn, a.nameAr);
    const bIsWomen = isWomenCategory(b.nameEn, b.nameAr);
    if (aIsWomen && !bIsWomen) return -1;
    if (!aIsWomen && bIsWomen) return 1;
    return a.nameEn.localeCompare(b.nameEn);
  });
}

export function Shell({ children, admin }: { children: React.ReactNode; admin: AdminUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [articlesOpen, setArticlesOpen] = useState(true);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (message: string) => {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 5000);
  };

  useEffect(() => {
    setOpen(false);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setCurrentCategory(params.get("category"));
    }
  }, [pathname]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // Fetch article categories to populate the sidebar accordion
  useEffect(() => {
    api<{ data: CategoryItem[] }>("/api/article-categories?pageSize=100")
      .then(res => setCategories(sortCategories(res.data)))
      .catch(() => {});
  }, [pathname]);

  const current = resources.find(resource => pathname.startsWith(`/${resource.slug}`));

  async function logout() {
    setLoggingOut(true);
    try {
      await api("/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch (error) {
      notify((error as Error).message);
      setLoggingOut(false);
    }
  }

  const isArticlesPath = pathname.startsWith("/articles");

  const navItem = (resource: typeof resources[number]) => {
    // If the resource is 'articles', we render the special accordion instead
    if (resource.slug === "articles") {
      return (
        <div key="articles-accordion" className="nav-accordion">
          <button
            type="button"
            className={`nav-accordion-header ${isArticlesPath ? "active" : ""}`}
            onClick={() => {
              if (!articlesOpen) {
                setArticlesOpen(true);
              } else {
                setArticlesOpen(!articlesOpen);
              }
            }}
            aria-expanded={articlesOpen}
          >
            <FileText size={19}/>
            <span>Articles</span>
            <ChevronDown
              size={14}
              className={`nav-accordion-chevron ${articlesOpen ? "is-open" : ""}`}
            />
          </button>

          {articlesOpen && (
            <div className="nav-sub-list">
              <Link
                href="/articles"
                className={`nav-sub-item ${isArticlesPath && !currentCategory ? "active" : ""}`}
                onClick={() => setCurrentCategory(null)}
              >
                <span>All Articles</span>
              </Link>

              {categories.map(cat => {
                const isActive = isArticlesPath && currentCategory === String(cat.id);
                const isWomen = isWomenCategory(cat.nameEn, cat.nameAr);
                return (
                  <div key={cat.id} style={{ display: "flex", alignItems: "center", position: "relative" }}>
                    <Link
                      href={`/articles?category=${cat.id}`}
                      className={`nav-sub-item ${isActive ? "active" : ""}`}
                      style={{ flex: 1 }}
                      onClick={() => setCurrentCategory(String(cat.id))}
                      title={`${cat.nameEn} (${cat.nameAr})`}
                    >
                      <span>
                        {cat.nameEn}
                        {isWomen && <span className="arabic-badge" style={{ marginLeft: 6 }}>★</span>}
                      </span>
                    </Link>
                    <Link
                      href={`/articles/new?category=${cat.id}`}
                      className="sub-quick-add"
                      title={`Create article in ${cat.nameEn}`}
                    >
                      <Plus size={13}/>
                    </Link>
                  </div>
                );
              })}

              <Link href="/article-categories" className="nav-sub-manage">
                <FolderTree size={12}/>
                <span>Manage Categories</span>
              </Link>
            </div>
          )}
        </div>
      );
    }

    // Hide article-categories from top level since it's nested under Articles
    if (resource.slug === "article-categories") return null;

    return (
      <Link
        key={resource.slug}
        href={`/${resource.slug}`}
        className={`nav-link ${current?.slug === resource.slug ? "active" : ""}`}
        aria-current={current?.slug === resource.slug ? "page" : undefined}
      >
        <resource.icon size={19}/>
        <span>{resource.title}</span>
        <ChevronRight className="nav-chevron" size={14}/>
      </Link>
    );
  };

  return (
    <ToastContext.Provider value={notify}>
      <a className="skip-link" href="#main">Skip to content</a>
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <Link href="/" className="brand">
          <img loading="lazy" decoding="async" src="/brand/logo.jpg" alt="Influencers World logo"/>
          <span>Influencers<strong>World<span className="brand-amber">.</span></strong></span>
        </Link>
        <div className="workspace-label"><span className="live-dot"/> Content management system</div>
        <nav aria-label="Main navigation">
          <Link
            href="/"
            className={`nav-link ${pathname === "/" ? "active" : ""}`}
            aria-current={pathname === "/" ? "page" : undefined}
          >
            <LayoutDashboard size={19}/>
            <span>Overview</span>
            <ChevronRight className="nav-chevron" size={14}/>
          </Link>
          <p className="nav-label">Publish & share</p>
          {resources.filter(resource => resource.slug !== "contacts").map(navItem)}
          <p className="nav-label">Your audience</p>
          {resources.filter(resource => resource.slug === "contacts").map(navItem)}
        </nav>
        <div className="sidebar-site">
          <img src="/brand/footer-logo.jpg" alt="Influencers World"/>
          <div>
            <strong>Dr. Germien Amer</strong>
            <span>Official publishing workspace</span>
          </div>
        </div>
        <div className="sidebar-bottom">
          <div className="editor-avatar"><ShieldCheck size={19}/></div>
          <div className="admin-identity">
            <strong>Administrator</strong>
            <span>{admin.email}</span>
          </div>
          <button className="icon-button" aria-label="Sign out" title="Sign out" onClick={logout} disabled={loggingOut}>
            <LogOut size={17}/>
          </button>
        </div>
      </aside>
      {open && <button className="nav-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)}/>}
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-toggle"
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={20}/> : <Menu size={20}/>}
            </button>
            <span>CMS</span>
            <ChevronRight size={13}/>
            <strong>{current?.title ?? "Overview"}</strong>
          </div>
          <div className="header-actions">
            <span className="admin-badge"><ShieldCheck size={14}/>Admin</span>
            <a className="website-button" href={process.env.NEXT_PUBLIC_WEBSITE_URL ?? "http://localhost:5173"} target="_blank" rel="noopener noreferrer">
              View website<ArrowUpRight size={15}/>
            </a>
            <button className="icon-button mobile-logout" aria-label="Sign out" onClick={logout} disabled={loggingOut}>
              <LogOut size={17}/>
            </button>
          </div>
        </header>
        <main id="main" tabIndex={-1}>{children}</main>
        <footer className="workspace-footer">
          <span><img src="/brand/crest.jpg" alt=""/>Influencers World CMS</span>
          <span>Books. Conversations. Ideas.</span>
        </footer>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19}/>
          {toast}
          <button className="icon-button" onClick={() => setToast("")} aria-label="Dismiss notification">
            <X size={16}/>
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

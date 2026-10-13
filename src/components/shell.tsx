"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ArrowUpRight, LayoutDashboard, Menu, X, CheckCircle2 } from "lucide-react";
import { resources } from "@/lib/resources";

const ToastContext = createContext<(message: string) => void>(() => {});
export function useToast() { return useContext(ToastContext); }
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (message: string) => { setToast(message); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setToast(""), 5000); };
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const current = resources.find(resource => pathname.startsWith(`/${resource.slug}`));
  return <ToastContext.Provider value={notify}>
    <a className="skip-link" href="#main">Skip to content</a>
    <aside className={`sidebar ${open ? "is-open" : ""}`}>
      <Link href="/" className="brand"><span className="brand-mark">iw<span>.</span></span><span>Influencers<br/><strong>World</strong></span></Link>
      <div className="workspace-label"><span className="live-dot"/> Publishing workspace</div>
      <nav aria-label="Main navigation"><Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`} aria-current={pathname === "/" ? "page" : undefined}><LayoutDashboard size={19}/> Overview</Link><p className="nav-label">Your collections</p>
        {resources.map(resource => <Link key={resource.slug} href={`/${resource.slug}`} className={`nav-link ${current?.slug === resource.slug ? "active" : ""}`} aria-current={current?.slug === resource.slug ? "page" : undefined}><resource.icon size={19}/>{resource.title}</Link>)}
      </nav>
      <div className="sidebar-bottom"><div className="editor-avatar">IW</div><div><strong>Content studio</strong><span>Influencers World</span></div></div>
    </aside>
    {open && <button className="nav-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)}/>}
    <div className="workspace"><header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-toggle" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={20}/> : <Menu size={20}/>}</button><span>Workspace</span><span className="breadcrumb-divider">/</span><strong>{current?.title ?? "Overview"}</strong></div><span className="topbar-label">Content management <ArrowUpRight size={14}/></span></header><main id="main" tabIndex={-1}>{children}</main><footer className="workspace-footer"><span>Influencers World</span><span>A place for ideas worth sharing.</span></footer></div>
    {toast && <div className="toast" role="status"><CheckCircle2 size={19}/>{toast}<button className="icon-button" onClick={() => setToast("")} aria-label="Dismiss notification"><X size={16}/></button></div>}
  </ToastContext.Provider>;
}

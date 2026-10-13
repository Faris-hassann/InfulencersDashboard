"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ArrowUpRight, LayoutDashboard, Menu, X, CheckCircle2, LogOut, ShieldCheck, ChevronRight } from "lucide-react";
import { resources } from "@/lib/resources";
import { api } from "@/lib/api";
import type { AdminUser } from "@/lib/auth-server";

const ToastContext = createContext<(message: string) => void>(() => {});
export function useToast() { return useContext(ToastContext); }
export function Shell({ children, admin }: { children: React.ReactNode; admin: AdminUser }) {
  const pathname = usePathname(); const router = useRouter();
  const [open, setOpen] = useState(false); const [toast, setToast] = useState(""); const [loggingOut, setLoggingOut] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (message: string) => { setToast(message); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setToast(""), 5000); };
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const current = resources.find(resource => pathname.startsWith(`/${resource.slug}`));
  async function logout() {
    setLoggingOut(true);
    try { await api("/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); }
    catch (error) { notify((error as Error).message); setLoggingOut(false); }
  }
  const navItem = (resource: typeof resources[number]) => <Link key={resource.slug} href={`/${resource.slug}`} className={`nav-link ${current?.slug === resource.slug ? "active" : ""}`} aria-current={current?.slug === resource.slug ? "page" : undefined}><resource.icon size={19}/><span>{resource.title}</span><ChevronRight className="nav-chevron" size={14}/></Link>;
  return <ToastContext.Provider value={notify}>
    <a className="skip-link" href="#main">Skip to content</a>
    <aside className={`sidebar ${open ? "is-open" : ""}`}>
      <Link href="/" className="brand"><img src="/brand/logo.jpg" alt="Influencers World logo"/><span>Influencers<strong>World<span className="brand-amber">.</span></strong></span></Link>
      <div className="workspace-label"><span className="live-dot"/> Content management system</div>
      <nav aria-label="Main navigation"><Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`} aria-current={pathname === "/" ? "page" : undefined}><LayoutDashboard size={19}/><span>Overview</span><ChevronRight className="nav-chevron" size={14}/></Link><p className="nav-label">Publish & share</p>{resources.filter(resource => resource.slug !== "contacts").map(navItem)}<p className="nav-label">Your audience</p>{resources.filter(resource => resource.slug === "contacts").map(navItem)}</nav>
      <div className="sidebar-site"><img src="/brand/footer-logo.jpg" alt="Influencers World"/><div><strong>Dr. Germien Amer</strong><span>Official publishing workspace</span></div></div>
      <div className="sidebar-bottom"><div className="editor-avatar"><ShieldCheck size={19}/></div><div className="admin-identity"><strong>Administrator</strong><span>{admin.email}</span></div><button className="icon-button" aria-label="Sign out" title="Sign out" onClick={logout} disabled={loggingOut}><LogOut size={17}/></button></div>
    </aside>
    {open && <button className="nav-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)}/>}
    <div className="workspace"><header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-toggle" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={20}/> : <Menu size={20}/>}</button><span>CMS</span><ChevronRight size={13}/><strong>{current?.title ?? "Overview"}</strong></div><div className="header-actions"><span className="admin-badge"><ShieldCheck size={14}/>Admin</span><a className="website-button" href={process.env.NEXT_PUBLIC_WEBSITE_URL ?? "http://localhost:5173"} target="_blank" rel="noopener noreferrer">View website<ArrowUpRight size={15}/></a><button className="icon-button mobile-logout" aria-label="Sign out" onClick={logout} disabled={loggingOut}><LogOut size={17}/></button></div></header><main id="main" tabIndex={-1}>{children}</main><footer className="workspace-footer"><span><img src="/brand/crest.jpg" alt=""/>Influencers World CMS</span><span>Books. Conversations. Ideas.</span></footer></div>
    {toast && <div className="toast" role="status"><CheckCircle2 size={19}/>{toast}<button className="icon-button" onClick={() => setToast("")} aria-label="Dismiss notification"><X size={16}/></button></div>}
  </ToastContext.Provider>;
}

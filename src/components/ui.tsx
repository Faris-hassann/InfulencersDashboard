"use client";
import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";
export function Loading({ label = "Loading records…" }: { label?: string }) { return <div className="state-panel" role="status"><LoaderCircle className="spin" size={25}/><p>{label}</p></div>; }
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) { return <div className="error-panel" role="alert"><AlertCircle size={22}/><div><strong>Unable to load this content</strong><p>{message}</p>{retry && <button className="button secondary" onClick={retry}><RefreshCw size={16}/>Try again</button>}</div></div>; }

import type { Metadata } from "next";
import { Shell } from "@/components/shell";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/syne";
import "quill/dist/quill.snow.css";
import "./globals.css";
export const metadata: Metadata = { title: { default: "Influencers World · Dashboard", template: "%s · Influencers World" }, description: "Manage books, podcasts, tips, news, newsletters, and contacts.", robots: { index: false, follow: false } };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><Shell>{children}</Shell></body></html>; }

import type { Metadata } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/syne";
import "quill/dist/quill.snow.css";
import "./globals.css";
export const metadata: Metadata = { title: { default: "Influencers World · CMS", template: "%s · Influencers World" }, description: "The official administrator workspace for Influencers World.", icons: { icon: "/brand/logo.jpg", apple: "/brand/crest.jpg" }, robots: { index: false, follow: false } };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }

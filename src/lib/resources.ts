import { BookOpen, Mic2, Lightbulb, Newspaper, Mail, MessagesSquare } from "lucide-react";
export const resources = [
  { slug: "books", title: "Books", singular: "book", icon: BookOpen, description: "Manage your reading collection and book features." },
  { slug: "podcasts", title: "Podcasts", singular: "podcast", icon: Mic2, description: "Manage episodes, conversations, and their stories." },
  { slug: "tips-and-tricks", title: "Tips & Tricks", singular: "tip", icon: Lightbulb, description: "Keep useful ideas and practical advice in one place." },
  { slug: "news", title: "News", singular: "news item", icon: Newspaper, description: "Manage the latest stories and announcements." },
  { slug: "contacts", title: "Contact Us", singular: "contact", icon: MessagesSquare, description: "Manage messages and the people behind them." },
  { slug: "newsletters", title: "News Letter", singular: "newsletter", icon: Mail, description: "Manage newsletter editions and their content." },
] as const;
export type Resource = (typeof resources)[number];
export function getResource(slug: string) { return resources.find(resource => resource.slug === slug); }
export type RecordData = { id: number; title?: string; firstName?: string; lastName?: string; description: string; imageUrl?: string; youtubeUrl?: string; publishedOn?: string; createdOn?: string; email?: string; phoneNumber?: string };
export type ListResponse = { data: RecordData[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } };
export function recordName(record: RecordData) { return record.title ?? `${record.firstName} ${record.lastName}`; }
export function formatDate(value?: string) { return value ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—"; }
export function plainText(html: string) { return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim(); }

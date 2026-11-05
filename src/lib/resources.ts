import { BookOpen, Mic2, Lightbulb, Newspaper, Mail, MessagesSquare, FileText, Trophy, FolderTree } from "lucide-react";

export const resources = [
  { slug: "books", title: "Books", singular: "book", icon: BookOpen, description: "Manage your reading collection and book features." },
  { slug: "podcasts", title: "Podcasts", singular: "podcast", icon: Mic2, description: "Manage episodes, conversations, and their stories." },
  { slug: "tips-and-tricks", title: "Tips & Tricks", singular: "tip", icon: Lightbulb, description: "Keep useful ideas and practical advice in one place." },
  { slug: "news", title: "News", singular: "news item", icon: Newspaper, description: "Manage the latest stories and announcements." },
  { slug: "newsletters", title: "News Letter", singular: "newsletter", icon: Mail, description: "Manage newsletter editions and their content." },
  { slug: "articles", title: "Articles", singular: "article", icon: FileText, description: "Manage articles, features, and in-depth stories." },
  { slug: "awards", title: "Awards", singular: "award", icon: Trophy, description: "Showcase honors, recognitions, and achievements." },
  { slug: "article-categories", title: "Article Categories", singular: "category", icon: FolderTree, description: "Organize articles into thematic categories." },
  { slug: "contacts", title: "Contact Us", singular: "contact", icon: MessagesSquare, description: "Manage messages and the people behind them." },
] as const;

export type Resource = (typeof resources)[number];
export function getResource(slug: string) { return resources.find(resource => resource.slug === slug); }

export type RecordData = {
  id: number;
  title?: string;
  titleEn?: string;
  titleAr?: string;
  nameEn?: string;
  nameAr?: string;
  description?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  firstName?: string;
  firstNameAr?: string;
  lastName?: string;
  lastNameAr?: string;
  imageUrl?: string;
  imageUrls?: string[];
  youtubeUrl?: string | null;
  publishedOn?: string;
  createdOn?: string;
  email?: string;
  phoneNumber?: string;
  articleCategoryId?: number | null;
  articleCategory?: { id: number; nameEn: string; nameAr: string } | null;
};

export type ListResponse = { data: RecordData[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } };

export function recordName(record: RecordData) {
  return record.title ?? record.titleEn ?? record.nameEn ?? (record.firstName ? `${record.firstName} ${record.lastName}` : `Item #${record.id}`);
}

export function recordArabicName(record: RecordData) {
  return record.titleAr ?? record.nameAr ?? (record.firstNameAr ? `${record.firstNameAr} ${record.lastNameAr ?? ""}`.trim() : undefined);
}

export function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—";
}

export function plainText(html?: string) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}

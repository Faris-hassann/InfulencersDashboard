import { notFound } from "next/navigation";
import { getResource } from "@/lib/resources";
import { RecordForm } from "@/components/record-form";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string }>;
  searchParams?: Promise<{ category?: string }>;
}) {
  const { resource } = await params;
  const sp = (await searchParams) ?? {};
  if (!getResource(resource)) notFound();
  return <RecordForm slug={resource} defaultCategoryId={sp.category}/>;
}

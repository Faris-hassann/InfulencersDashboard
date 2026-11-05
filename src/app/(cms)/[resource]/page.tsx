import { notFound } from "next/navigation";
import { getResource } from "@/lib/resources";
import { ResourceTable } from "@/components/resource-table";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string }>;
  searchParams?: Promise<{ category?: string; filter?: string }>;
}) {
  const { resource } = await params;
  const sp = (await searchParams) ?? {};
  if (!getResource(resource)) notFound();
  return (
    <ResourceTable
      key={`${resource}-${sp.category ?? "all"}-${sp.filter ?? ""}`}
      slug={resource}
      initialCategory={sp.category}
    />
  );
}

import { notFound } from "next/navigation";
import { getResource } from "@/lib/resources";
import { ResourceTable } from "@/components/resource-table";
export default async function Page({ params }: { params: Promise<{ resource: string }> }) { const { resource } = await params; if (!getResource(resource)) notFound(); return <ResourceTable key={resource} slug={resource}/>; }

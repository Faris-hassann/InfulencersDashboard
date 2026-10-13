import { notFound } from "next/navigation";
import { getResource } from "@/lib/resources";
import { RecordForm } from "@/components/record-form";
export default async function Page({ params }: { params: Promise<{ resource: string }> }) { const { resource } = await params; if (!getResource(resource)) notFound(); return <RecordForm slug={resource}/>; }

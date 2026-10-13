import { notFound } from "next/navigation";
import { getResource } from "@/lib/resources";
import { RecordForm } from "@/components/record-form";
export default async function Page({ params }: { params: Promise<{ resource: string; id: string }> }) { const { resource, id } = await params; if (!getResource(resource) || !/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) notFound(); return <RecordForm slug={resource} id={id}/>; }

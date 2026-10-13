import { notFound } from "next/navigation";
import { getResource } from "@/lib/resources";
import { RecordView } from "@/components/record-view";
export default async function Page({ params }: { params: Promise<{ resource: string; id: string }> }) { const { resource, id } = await params; if (!getResource(resource) || !/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) notFound(); return <RecordView slug={resource} id={id}/>; }

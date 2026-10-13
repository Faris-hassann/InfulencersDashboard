"use client";
import { ErrorState } from "@/components/ui";
export default function Error({ reset }: { reset: () => void }) { return <ErrorState message="This page could not load. Try again to continue." retry={reset}/>; }

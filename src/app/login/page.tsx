import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth-server";
import { LoginForm } from "@/components/login-form";
import { resources } from "@/lib/resources";

export const metadata = { title: "Administrator sign in" };
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const slugsPattern = resources.map(r => r.slug).join("|");
  const validNext = params.next && new RegExp(`^\\/(?:${slugsPattern})(?:\\/[a-zA-Z0-9/-]*)?$`).test(params.next);
  const target = validNext && params.next ? params.next : "/";
  const admin = await currentAdmin().catch(() => null);
  if (admin) redirect(target);
  return <LoginForm next={target}/>;
}

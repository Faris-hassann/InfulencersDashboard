import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth-server";
import { LoginForm } from "@/components/login-form";
export const metadata = { title: "Administrator sign in" };
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const target = params.next && /^\/(?:books|podcasts|tips-and-tricks|news|contacts|newsletters)(?:\/[a-zA-Z0-9/-]*)?$/.test(params.next) ? params.next : "/";
  const admin = await currentAdmin().catch(() => null);
  if (admin) redirect(target);
  return <LoginForm next={target}/>;
}

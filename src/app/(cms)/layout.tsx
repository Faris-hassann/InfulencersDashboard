import { requireAdmin } from "@/lib/auth-server";
import { Shell } from "@/components/shell";
export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return <Shell admin={admin}>{children}</Shell>;
}

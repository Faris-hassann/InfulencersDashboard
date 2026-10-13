import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const backendUrl = () => (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
export type AdminUser = { id: number; email: string; role: string };
export async function currentAdmin(): Promise<AdminUser | null> {
  const session = (await cookies()).get("iw_admin_session")?.value;
  if (!session || !/^[a-f0-9]{64}$/.test(session)) return null;
  const response = await fetch(`${backendUrl()}/auth/me`, { headers: { Cookie: `iw_admin_session=${session}` }, cache: "no-store", signal: AbortSignal.timeout(10000) });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error("Authentication service unavailable");
  const body = await response.json();
  return body.user?.role === "admin" ? body.user : null;
}
export async function requireAdmin() { const admin = await currentAdmin(); if (!admin) redirect("/login"); return admin; }

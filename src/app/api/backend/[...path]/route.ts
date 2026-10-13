import { NextResponse, type NextRequest } from "next/server";
import { backendUrl } from "@/lib/auth-server";
export const dynamic = "force-dynamic";
const collections = new Set(["books", "podcasts", "tips-and-tricks", "news", "contacts", "newsletters", "summary"]);
async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const allowed = (path[0] === "auth" && path.length === 2 && ["login", "logout", "me"].includes(path[1])) || (path[0] === "api" && collections.has(path[1]) && (path.length === 2 || (path.length === 3 && /^[1-9]\d*$/.test(path[2]))));
  if (!allowed) return NextResponse.json({ message: "Endpoint not found" }, { status: 404 });
  const mutating = !["GET", "HEAD"].includes(request.method);
  const origin = request.headers.get("origin");
  // Next's internal URL can use localhost behind a reverse proxy. Host is the
  // dashboard the browser actually addressed; the platform supplies its scheme.
  const publicUrl = new URL(request.nextUrl);
  publicUrl.host = request.headers.get("host") ?? publicUrl.host;
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  if (protocol === "http" || protocol === "https") publicUrl.protocol = `${protocol}:`;
  if (mutating && (request.headers.get("x-cms-request") !== "1" || (origin && origin !== publicUrl.origin))) return NextResponse.json({ message: "Request origin could not be verified" }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 1048576) return NextResponse.json({ message: "Request body exceeds 1 MB" }, { status: 413 });
  const headers = new Headers({ "X-CMS-Request": "1" });
  const cookie = request.cookies.get("iw_admin_session")?.value;
  if (cookie && /^[a-f0-9]{64}$/.test(cookie)) headers.set("Cookie", `iw_admin_session=${cookie}`);
  if (request.headers.get("content-type")) headers.set("Content-Type", request.headers.get("content-type")!);
  // The browser origin was verified above. This is now a server-to-server
  // request, so forwarding that origin would trigger the backend's separate
  // browser CORS/CSRF allowlist and reject valid dashboard sessions.
  try {
    const body = mutating ? await request.text() : undefined;
    if (body && Buffer.byteLength(body) > 1048576) return NextResponse.json({ message: "Request body exceeds 1 MB" }, { status: 413 });
    const response = await fetch(`${backendUrl()}/${path.join("/")}${request.nextUrl.search}`, { method: request.method, headers, body, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(15000) });
    const forwarded = new Headers({ "Cache-Control": "no-store" });
    for (const name of ["content-type", "set-cookie", "retry-after"]) { const value = response.headers.get(name); if (value) forwarded.set(name, value); }
    return new NextResponse(response.status === 204 ? null : await response.text(), { status: response.status, headers: forwarded });
  } catch { return NextResponse.json({ message: "The CMS server is unavailable. Check that the backend is running." }, { status: 503 }); }
}
export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };

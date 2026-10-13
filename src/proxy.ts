import { NextResponse, type NextRequest } from "next/server";
export function proxy(request: NextRequest) {
  const session = request.cookies.get("iw_admin_session")?.value;
  if (!session || !/^[a-f0-9]{64}$/.test(session)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ["/", "/books/:path*", "/podcasts/:path*", "/tips-and-tricks/:path*", "/news/:path*", "/contacts/:path*", "/newsletters/:path*"] };

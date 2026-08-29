import { NextResponse, type NextRequest } from "next/server";
import { decideRedirect, SESSION_COOKIE_NAME } from "@/lib/auth/route-guard";

/**
 * Cheap route guard: only checks that a session cookie exists.
 * Real verification happens in server components via getServerUser().
 */
export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const target = decideRedirect(request.nextUrl.pathname, hasSession);
  if (target) {
    return NextResponse.redirect(new URL(target, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/rooms", "/rooms/:path*", "/room/:path*", "/settings", "/settings/:path*", "/signin", "/signup"],
};

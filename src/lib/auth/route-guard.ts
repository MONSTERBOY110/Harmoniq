const PROTECTED_PREFIXES = ["/rooms", "/room/", "/settings"];
const AUTH_PAGES = new Set(["/signin", "/signup"]);

export const SESSION_COOKIE_NAME = "__session";

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) =>
      pathname === prefix ||
      pathname === prefix.replace(/\/$/, "") ||
      pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`),
  );
}

export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.has(pathname);
}

/**
 * Returns the path to redirect to, or null to let the request through.
 * `hasSession` only means a session cookie is present; real verification happens server-side.
 */
export function decideRedirect(pathname: string, hasSession: boolean): string | null {
  if (!hasSession && isProtectedPath(pathname)) {
    return `/signin?next=${encodeURIComponent(pathname)}`;
  }
  if (hasSession && isAuthPage(pathname)) {
    return "/rooms";
  }
  return null;
}

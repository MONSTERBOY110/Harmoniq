import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "./admin";
import { SESSION_COOKIE_NAME } from "@/lib/auth/route-guard";

/** Five days, in milliseconds. */
export const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;

export type ServerUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export async function createSessionCookieValue(idToken: string): Promise<string> {
  return adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
}

export function sessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
  };
}

/**
 * The signed-in user for the current request, verified against Firebase.
 * Cached per request so layouts and pages can both call it.
 */
export const getServerUser = cache(async (): Promise<ServerUser | null> => {
  const jar = await cookies();
  const value = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!value) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(value, false);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      displayName: typeof decoded.name === "string" ? decoded.name : null,
      photoURL: typeof decoded.picture === "string" ? decoded.picture : null,
    };
  } catch {
    return null;
  }
});

export async function requireServerUser(nextPath?: string): Promise<ServerUser> {
  const user = await getServerUser();
  if (!user) {
    redirect(nextPath ? `/signin?next=${encodeURIComponent(nextPath)}` : "/signin");
  }
  return user;
}

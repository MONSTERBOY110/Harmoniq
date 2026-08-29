import type { User } from "firebase/auth";

let lastSyncedToken: string | null = null;

/**
 * Sends the current ID token to the server so it can mint the httpOnly session cookie.
 * Deduplicated by token so the provider and the sign-in actions do not double-post.
 */
export async function syncSessionCookie(user: User, force = false): Promise<void> {
  const idToken = await user.getIdToken(force);
  if (!force && idToken === lastSyncedToken) return;
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Could not start a session.");
  }
  lastSyncedToken = idToken;
}

export async function clearSessionCookie(): Promise<void> {
  lastSyncedToken = null;
  await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
}

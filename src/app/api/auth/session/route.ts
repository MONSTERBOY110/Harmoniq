import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSessionCookieValue, sessionCookieOptions } from "@/lib/firebase/session";

/** Exchanges a Firebase ID token for an httpOnly session cookie. */
export async function POST(request: NextRequest) {
  let idToken: unknown;
  try {
    ({ idToken } = (await request.json()) as { idToken?: unknown });
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }
  if (typeof idToken !== "string" || idToken.length < 20) {
    return NextResponse.json({ error: "Missing idToken." }, { status: 400 });
  }

  try {
    const value = await createSessionCookieValue(idToken);
    const jar = await cookies();
    jar.set({ ...sessionCookieOptions(), value });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create a session.";
    const status = /not set|does not decode/.test(message) ? 500 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}

/** Clears the session cookie. */
export async function DELETE() {
  const jar = await cookies();
  const { name, ...options } = sessionCookieOptions();
  jar.set({ name, value: "", ...options, maxAge: 0 });
  return NextResponse.json({ ok: true });
}

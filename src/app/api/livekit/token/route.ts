import { NextResponse, type NextRequest } from "next/server";
import { memberRef } from "@/features/rooms/server";
import { getServerUser } from "@/lib/firebase/session";
import { livekitServerUrl, mintRoomToken } from "@/lib/livekit/token";
import { normalizeRoomCode } from "@/lib/rooms/code";
import type { MemberDoc } from "@/types/firestore";

/** GET /api/livekit/token?room=ABCDEF -> { token, serverUrl } for the signed-in room member. */
export async function GET(request: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const code = normalizeRoomCode(request.nextUrl.searchParams.get("room") ?? "");
  if (!code) return NextResponse.json({ error: "Invalid room code." }, { status: 400 });

  try {
    const member = await memberRef(code, user.uid).get();
    if (!member.exists) {
      return NextResponse.json({ error: "You are not in this room." }, { status: 403 });
    }
    const color = (member.data() as MemberDoc).color ?? null;
    const [token, serverUrl] = [await mintRoomToken(code, user, color), livekitServerUrl()];
    return NextResponse.json({ token, serverUrl }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[livekit] token failed", error);
    const message = error instanceof Error ? error.message : "Could not join the call.";
    return NextResponse.json({ error: message }, { status: /not set/.test(message) ? 500 : 502 });
  }
}

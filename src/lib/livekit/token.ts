import "server-only";
import { AccessToken } from "livekit-server-sdk";
import type { ServerUser } from "@/lib/firebase/session";
import { participantMetadata, roomGrant } from "./participant";

export function livekitServerUrl(): string {
  const url = process.env.LIVEKIT_URL;
  if (!url) throw new Error("LIVEKIT_URL is not set. See README.md, section LiveKit.");
  if (/your-project/i.test(url)) {
    throw new Error(
      "LIVEKIT_URL is not set: it still has the placeholder value. Copy the wss:// URL from your LiveKit Cloud project settings.",
    );
  }
  return url;
}

/** Mints a two-hour LiveKit token for one user in one room. Identity is the Firebase uid. */
export async function mintRoomToken(
  code: string,
  user: ServerUser,
  color: string | null = null,
): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("LIVEKIT_API_KEY or LIVEKIT_API_SECRET is not set. See README.md, section LiveKit.");
  }
  const token = new AccessToken(apiKey, apiSecret, {
    identity: user.uid,
    name: user.displayName ?? user.email?.split("@")[0] ?? "Singer",
    metadata: participantMetadata({ photoURL: user.photoURL, color }),
    ttl: "2h",
  });
  token.addGrant(roomGrant(code));
  return token.toJwt();
}

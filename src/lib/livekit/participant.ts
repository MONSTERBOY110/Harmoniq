import type { VideoGrant } from "livekit-server-sdk";

export type ParticipantMeta = { photoURL: string | null; color: string | null };

/** What a room member may do on the LiveKit room: join, publish media and data, subscribe. */
export function roomGrant(code: string): VideoGrant {
  return {
    room: code,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    canUpdateOwnMetadata: false,
  };
}

export function participantMetadata(meta: ParticipantMeta): string {
  return JSON.stringify({ photoURL: meta.photoURL ?? null, color: meta.color ?? null });
}

export function parseParticipantMetadata(raw: string | undefined | null): ParticipantMeta {
  if (!raw) return { photoURL: null, color: null };
  try {
    const parsed = JSON.parse(raw) as { photoURL?: unknown; color?: unknown };
    return {
      photoURL: typeof parsed.photoURL === "string" ? parsed.photoURL : null,
      color: typeof parsed.color === "string" ? parsed.color : null,
    };
  } catch {
    return { photoURL: null, color: null };
  }
}

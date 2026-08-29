/**
 * YouTube IFrame player error codes.
 * 2 is a bad parameter, 5 is an HTML5 player glitch, 100 is missing or private,
 * 101 and 150 both mean the owner disallowed playback outside YouTube.
 */
const FATAL_CODES = new Set([100, 101, 150]);

export type PlayerErrorKind = "fatal" | "transient";

/**
 * Whether a song is genuinely unplayable, or the player merely stumbled.
 * A stumble under load used to cost the room its song, so anything not definitively
 * fatal earns one retry.
 */
export function classifyPlayerError(code: number): PlayerErrorKind {
  return FATAL_CODES.has(code) ? "fatal" : "transient";
}

export function describePlayerError(code: number): string {
  if (code === 101 || code === 150) return "Its owner disabled playback outside YouTube.";
  if (code === 100) return "The video is private or no longer on YouTube.";
  return `YouTube error ${code}.`;
}

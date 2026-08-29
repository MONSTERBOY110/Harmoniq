/** Below this, a duration difference is rounding, not an intro. */
export const MIN_AUTO_OFFSET_MS = 1500;
/** Above this, the two recordings are probably not the same arrangement. */
export const MAX_AUTO_OFFSET_MS = 30_000;

/**
 * A first guess at how much later the karaoke version starts singing than the original.
 *
 * Karaoke uploads usually keep the song intact and add a count-in at the front, so the extra
 * length over the original is the intro. A shorter karaoke version tells us nothing (the cut is
 * usually the outro), so we leave the lyrics where they are. The host can always correct this
 * with the timing controls, and their correction is what gets saved.
 */
export function autoIntroOffsetMs(
  videoDurationMs: number | null | undefined,
  lrcDurationSec: number | null | undefined,
): number {
  if (!videoDurationMs || !lrcDurationSec) return 0;
  const difference = videoDurationMs - lrcDurationSec * 1000;
  if (difference < MIN_AUTO_OFFSET_MS) return 0;
  return Math.min(Math.round(difference), MAX_AUTO_OFFSET_MS);
}

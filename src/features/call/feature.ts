/**
 * The call is split in two so the laggy half can be switched off on its own.
 *
 * Voice is what singing together actually needs, so it stays on. The camera is off while its
 * latency is worked on. The LiveKit room stays connected either way: it carries the playback
 * ticks, the clock pings and the host handoff, so dropping the connection would put the singing
 * out of step.
 *
 * Flip VIDEO_ENABLED to true to bring the cameras back. Nothing else needs changing.
 */
export const AUDIO_ENABLED = true;
export const VIDEO_ENABLED = false;

/** Whether the call surface (tiles, controls) is worth showing at all. */
export const CALL_ENABLED = AUDIO_ENABLED || VIDEO_ENABLED;

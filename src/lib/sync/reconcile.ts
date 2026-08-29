import type { PlaybackStatus } from "@/types/firestore";

/**
 * Drift correction uses two thresholds rather than one deadband.
 *
 * A single deadband leaves a standing error: measured against the real player, followers settle
 * about 88 ms behind the host and stay there, because the offset is constant and never crosses the
 * threshold. Correcting above ENGAGE and only releasing below RELEASE pulls that bias out, and the
 * gap between the two stops the rate flapping around a single point.
 *
 * The step size is not a free choice: the YouTube player quantises setPlaybackRate, honouring 0.95
 * and 1.05 while silently ignoring 0.98 and 1.02. So corrections come in 5% steps, which is why
 * they must be rare and short rather than continuous.
 */
export const DRIFT_ENGAGE_MS = 60;
/** Once correcting, keep going until the drift is this small. */
export const DRIFT_RELEASE_MS = 20;
/** From SOFT to HARD the playback rate is nudged; at or above HARD the player seeks. */
export const HARD_SEEK_MS = 1200;
/** After a seek, ignore drift for this long (the player needs time to settle). */
export const SEEK_COOLDOWN_MS = 1500;
/** Never seek more often than this. */
export const MIN_SEEK_INTERVAL_MS = 5000;
export const RATE_NUDGE = 0.05;

export type PlaybackSnapshot = {
  status: PlaybackStatus;
  positionMs: number;
  /** Host-clock time at which positionMs was true. */
  updatedAtServerMs: number;
  rate: number;
};

export type CorrectionState = {
  /** Consecutive samples at or above HARD_SEEK_MS. */
  largeStreak: number;
  lastSeekAtMs: number | null;
  /** True while a rate nudge is in effect, so it can be undone once drift settles. */
  nudging: boolean;
};

export type CorrectionAction = { kind: "none" } | { kind: "rate"; rate: number } | { kind: "seek" };

export function initialCorrectionState(): CorrectionState {
  return { largeStreak: 0, lastSeekAtMs: null, nudging: false };
}

/** Where the host's timeline is right now, given the last snapshot and the current host-clock time. */
export function expectedPositionMs(snapshot: PlaybackSnapshot, nowHostMs: number): number {
  if (snapshot.status !== "playing") return snapshot.positionMs;
  const elapsed = Math.max(0, nowHostMs - snapshot.updatedAtServerMs);
  return Math.max(0, Math.round(snapshot.positionMs + elapsed * snapshot.rate));
}

/**
 * Decides how a follower should react to `driftMs` (local player position minus expected).
 * Positive drift means the local player is ahead and must slow down.
 */
export function decideCorrection(
  driftMs: number,
  state: CorrectionState,
  nowMs: number,
): { action: CorrectionAction; state: CorrectionState } {
  const magnitude = Math.abs(driftMs);

  const inCooldown = state.lastSeekAtMs !== null && nowMs - state.lastSeekAtMs < SEEK_COOLDOWN_MS;
  if (inCooldown) return { action: { kind: "none" }, state };

  // A correction already in flight runs to the tighter release point before handing the rate back.
  const threshold = state.nudging ? DRIFT_RELEASE_MS : DRIFT_ENGAGE_MS;
  if (magnitude < threshold) {
    const next = { ...state, largeStreak: 0, nudging: false };
    return state.nudging
      ? { action: { kind: "rate", rate: 1 }, state: next }
      : { action: { kind: "none" }, state: next };
  }

  const nudge: CorrectionAction = {
    kind: "rate",
    rate: driftMs > 0 ? 1 - RATE_NUDGE : 1 + RATE_NUDGE,
  };

  if (magnitude < HARD_SEEK_MS) {
    return { action: nudge, state: { ...state, largeStreak: 0, nudging: true } };
  }

  const seekIntervalOk =
    state.lastSeekAtMs === null || nowMs - state.lastSeekAtMs >= MIN_SEEK_INTERVAL_MS;
  if (!seekIntervalOk) {
    return { action: nudge, state: { ...state, largeStreak: 0, nudging: true } };
  }

  const streak = state.largeStreak + 1;
  if (streak >= 2) {
    return { action: { kind: "seek" }, state: { largeStreak: 0, lastSeekAtMs: nowMs, nudging: false } };
  }
  return { action: nudge, state: { ...state, largeStreak: streak, nudging: true } };
}

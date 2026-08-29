import { describe, expect, it } from "vitest";
import {
  decideCorrection,
  expectedPositionMs,
  HARD_SEEK_MS,
  initialCorrectionState,
  SOFT_DRIFT_MS,
  type CorrectionState,
  type PlaybackSnapshot,
} from "./reconcile";

const playing: PlaybackSnapshot = {
  status: "playing",
  positionMs: 60_000,
  updatedAtServerMs: 1_000_000,
  rate: 1,
};

describe("expectedPositionMs", () => {
  it("advances with wall clock while playing", () => {
    expect(expectedPositionMs(playing, 1_002_500)).toBe(62_500);
  });

  it("scales by the playback rate", () => {
    expect(expectedPositionMs({ ...playing, rate: 1.05 }, 1_002_000)).toBe(62_100);
  });

  it("stays put while paused or idle", () => {
    expect(expectedPositionMs({ ...playing, status: "paused" }, 1_009_000)).toBe(60_000);
    expect(expectedPositionMs({ ...playing, status: "buffering" }, 1_009_000)).toBe(60_000);
  });

  it("never goes negative when the clock estimate is behind", () => {
    expect(expectedPositionMs({ ...playing, positionMs: 0 }, 999_000)).toBe(0);
  });
});

describe("decideCorrection", () => {
  const t0 = 5_000_000;

  it("does nothing for small drift", () => {
    const { action } = decideCorrection(200, initialCorrectionState(), t0);
    expect(action).toEqual({ kind: "none" });
    expect(SOFT_DRIFT_MS).toBe(250);
  });

  it("nudges the rate for medium drift: slow down when ahead, speed up when behind", () => {
    expect(decideCorrection(600, initialCorrectionState(), t0).action).toEqual({
      kind: "rate",
      rate: 0.95,
    });
    expect(decideCorrection(-600, initialCorrectionState(), t0).action).toEqual({
      kind: "rate",
      rate: 1.05,
    });
  });

  it("requires two consecutive large samples before a hard seek", () => {
    const first = decideCorrection(2_000, initialCorrectionState(), t0);
    expect(first.action.kind).not.toBe("seek");
    const second = decideCorrection(2_000, first.state, t0 + 1_000);
    expect(second.action).toEqual({ kind: "seek" });
    expect(HARD_SEEK_MS).toBe(1200);
  });

  it("resets the streak when a sample comes back in band", () => {
    const first = decideCorrection(2_000, initialCorrectionState(), t0);
    const calm = decideCorrection(100, first.state, t0 + 1_000);
    const third = decideCorrection(2_000, calm.state, t0 + 2_000);
    expect(third.action.kind).not.toBe("seek");
  });

  it("holds off during the cooldown after a seek and allows at most one seek per five seconds", () => {
    let state: CorrectionState = initialCorrectionState();
    state = decideCorrection(2_000, state, t0).state;
    const seek = decideCorrection(2_000, state, t0 + 1_000);
    expect(seek.action).toEqual({ kind: "seek" });
    state = seek.state;

    // Inside the 1500 ms cooldown: nothing, even for huge drift.
    expect(decideCorrection(5_000, state, t0 + 2_000).action).toEqual({ kind: "none" });

    // After cooldown but within five seconds of the last seek: still no second seek.
    let again = decideCorrection(5_000, state, t0 + 3_000);
    again = decideCorrection(5_000, again.state, t0 + 4_000);
    expect(again.action.kind).not.toBe("seek");

    // Past five seconds: a seek is possible again once the streak rebuilds.
    let later = decideCorrection(5_000, again.state, t0 + 6_100);
    later = decideCorrection(5_000, later.state, t0 + 7_100);
    expect(later.action).toEqual({ kind: "seek" });
  });

  it("returns to normal rate when drift settles after a nudge", () => {
    const nudged = decideCorrection(600, initialCorrectionState(), t0);
    const settled = decideCorrection(50, nudged.state, t0 + 1_000);
    expect(settled.action).toEqual({ kind: "rate", rate: 1 });
  });
});

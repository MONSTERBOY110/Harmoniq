import { describe, expect, it } from "vitest";
import { ClockEstimator } from "./clock";

describe("ClockEstimator", () => {
  it("has no offset before any sample", () => {
    const clock = new ClockEstimator();
    expect(clock.offsetMs).toBe(0);
    expect(clock.hasSamples).toBe(false);
  });

  it("estimates offset as t1 minus the midpoint of the round trip", () => {
    const clock = new ClockEstimator();
    // Sent at 1000, host stamped 1550, received at 1100 -> rtt 100, offset 1550 - 1050 = 500.
    clock.addSample({ sentAtMs: 1000, hostAtMs: 1550, receivedAtMs: 1100 });
    expect(clock.offsetMs).toBe(500);
    expect(clock.hasSamples).toBe(true);
  });

  it("prefers low-latency samples and uses the median of the best five", () => {
    const clock = new ClockEstimator();
    clock.addSample({ sentAtMs: 0, hostAtMs: 505, receivedAtMs: 10 }); // offset 500
    clock.addSample({ sentAtMs: 0, hostAtMs: 900, receivedAtMs: 800 }); // offset 500 but rtt 800
    clock.addSample({ sentAtMs: 0, hostAtMs: 2000, receivedAtMs: 2000 }); // offset 1000, rtt 2000 (outlier)
    clock.addSample({ sentAtMs: 0, hostAtMs: 506, receivedAtMs: 12 }); // offset 500
    clock.addSample({ sentAtMs: 0, hostAtMs: 504, receivedAtMs: 8 }); // offset 500
    clock.addSample({ sentAtMs: 0, hostAtMs: 507, receivedAtMs: 14 }); // offset 500
    expect(clock.offsetMs).toBe(500);
  });

  it("converts local time to host time", () => {
    const clock = new ClockEstimator();
    clock.addSample({ sentAtMs: 1000, hostAtMs: 1550, receivedAtMs: 1100 });
    expect(clock.toHostTime(2000)).toBe(2500);
  });

  it("can seed a rough offset from a server timestamp before any ping returns", () => {
    const clock = new ClockEstimator();
    clock.seed(300);
    expect(clock.offsetMs).toBe(300);
    clock.addSample({ sentAtMs: 0, hostAtMs: 105, receivedAtMs: 10 });
    expect(clock.offsetMs).toBe(100);
  });
});

export type ClockSample = {
  /** Local time the ping left. */
  sentAtMs: number;
  /** Host time stamped on the pong. */
  hostAtMs: number;
  /** Local time the pong arrived. */
  receivedAtMs: number;
};

const KEEP = 20;
const BEST = 5;

/**
 * Estimates host-clock minus local-clock from ping/pong samples.
 * Uses the median of the five lowest-latency samples so one slow round trip cannot skew it.
 */
export class ClockEstimator {
  private samples: { offset: number; rtt: number }[] = [];
  private seeded: number | null = null;

  get hasSamples(): boolean {
    return this.samples.length > 0;
  }

  /** A rough offset from a server timestamp, used until the first pong arrives. */
  seed(offsetMs: number): void {
    this.seeded = offsetMs;
  }

  addSample(sample: ClockSample): void {
    const rtt = Math.max(0, sample.receivedAtMs - sample.sentAtMs);
    const offset = sample.hostAtMs - (sample.sentAtMs + rtt / 2);
    this.samples.push({ offset, rtt });
    if (this.samples.length > KEEP) this.samples.shift();
  }

  get offsetMs(): number {
    if (this.samples.length === 0) return this.seeded ?? 0;
    const best = [...this.samples].sort((a, b) => a.rtt - b.rtt).slice(0, BEST);
    const offsets = best.map((s) => s.offset).sort((a, b) => a - b);
    const mid = Math.floor(offsets.length / 2);
    const median =
      offsets.length % 2 === 1 ? offsets[mid]! : (offsets[mid - 1]! + offsets[mid]!) / 2;
    return Math.round(median);
  }

  toHostTime(localMs: number): number {
    return localMs + this.offsetMs;
  }
}

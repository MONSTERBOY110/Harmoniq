import { test } from "@playwright/test";
import {
  addFirstResult,
  debug,
  firebaseReady,
  joinByLink,
  openRoomAndJoin,
  userContext,
} from "./helpers";

/**
 * Measurement harness for playback drift. Skipped unless MEASURE=1, because what it observes
 * depends on how well YouTube is serving video at the time, not only on our reconciler.
 */
test.describe("playback drift", () => {
  test.setTimeout(300_000);
  test.skip(!firebaseReady || !process.env.MEASURE, "Set MEASURE=1 to sample playback drift");

  test("sample follower drift while a song plays", async ({ browser }) => {
    const host = await userContext(browser, "host");
    const friend = await userContext(browser, "friend");

    const code = await openRoomAndJoin(host.page);
    await joinByLink(friend.page, code);
    await addFirstResult(host.page, process.env.SONG || "Coldplay Yellow karaoke");

    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
      const f = await debug(friend.page);
      if (f.status === "playing" && typeof f.driftMs === "number") break;
      await friend.page.waitForTimeout(500);
    }

    const drift: number[] = [];
    const local: number[] = [];
    for (let i = 0; i < 40; i += 1) {
      const f = await debug(friend.page);
      if (f.status === "playing" && typeof f.driftMs === "number") {
        drift.push(f.driftMs);
        local.push(f.positionMs ?? 0);
      }
      await friend.page.waitForTimeout(500);
    }
    // A follower whose own position stops advancing is stalled, which is a playback problem, not a
    // sync problem. Reporting the two separately keeps them from being confused.
    let frozen = 0;
    for (let i = 1; i < local.length; i += 1) if (local[i] <= local[i - 1]) frozen += 1;
    const abs = drift.map(Math.abs).sort((a, b) => a - b);
    const at = (q: number) => abs[Math.min(abs.length - 1, Math.floor(abs.length * q))];
    console.log(
      `RESULT samples=${drift.length} frozen=${frozen} |drift| p50=${at(0.5)} p90=${at(0.9)} max=${abs[abs.length - 1]}`,
    );
    console.log("RAW", drift.join(","));

    await host.context.close();
    await friend.context.close();
  });
});

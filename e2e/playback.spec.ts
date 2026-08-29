import { expect, test } from "@playwright/test";
import {
  addFirstResult,
  debug,
  firebaseReady,
  joinByLink,
  livekitReady,
  openRoomAndJoin,
  userContext,
} from "./helpers";

test.describe("synchronized playback", () => {
  test.setTimeout(300_000);
  test.skip(!firebaseReady, "Firebase env not configured");

  test("the host's song plays for a friend within a second, with lyrics on stage", async ({
    browser,
  }) => {
    const host = await userContext(browser, "host");
    const friend = await userContext(browser, "friend");

    const code = await openRoomAndJoin(host.page);
    await joinByLink(friend.page, code);

    await addFirstResult(host.page, "Coldplay Yellow karaoke");

    // Host auto-starts the first song.
    await expect.poll(async () => (await debug(host.page)).status, { timeout: 60_000 }).toBe("playing");
    await expect
      .poll(async () => (await debug(host.page)).positionMs ?? 0, { timeout: 60_000 })
      .toBeGreaterThan(2_000);

    // Friend follows, and lands within 1.5 s of the host. (On failure, show where the page went.)
    await expect
      .poll(async () => (await debug(friend.page)).status ?? `no stage at ${friend.page.url()}`, {
        timeout: 60_000,
      })
      .toBe("playing");
    await expect
      .poll(
        async () => {
          const [h, f] = await Promise.all([debug(host.page), debug(friend.page)]);
          return Math.abs((h.positionMs ?? 0) - (f.positionMs ?? 0));
        },
        { timeout: 60_000 },
      )
      .toBeLessThan(1_500);

    // Lyrics render in our own panel for both (synced sweep or plain text).
    const lyricsPanel = "[data-slot=lyric-sweep], [data-slot=lyrics-plain]";
    await expect(host.page.locator(lyricsPanel)).toBeVisible({ timeout: 30_000 });
    await expect(friend.page.locator(lyricsPanel)).toBeVisible({ timeout: 30_000 });

    // Pause propagates.
    await host.page.getByRole("button", { name: "Pause" }).click();
    await expect.poll(async () => (await debug(friend.page)).status, { timeout: 20_000 }).toBe("paused");
    await expect(friend.page.getByLabel("Paused")).toBeVisible();

    // Skip with an empty queue goes idle for everyone.
    await host.page.getByRole("button", { name: "Skip to next song" }).click();
    await expect.poll(async () => (await debug(friend.page)).status, { timeout: 20_000 }).toBe("idle");

    await host.context.close();
    await friend.context.close();
  });

  test("songs from anywhere get lyrics on stage: Hindi, then Spanish", async ({ browser }) => {
    const host = await userContext(browser, "host");
    await openRoomAndJoin(host.page);
    const lyricsPanel = "[data-slot=lyric-sweep], [data-slot=lyrics-plain]";

    await addFirstResult(host.page, "Kesariya Arijit Singh karaoke");
    await addFirstResult(host.page, "Despacito Luis Fonsi karaoke");

    await expect.poll(async () => (await debug(host.page)).status, { timeout: 60_000 }).toBe("playing");
    await expect
      .poll(async () => (await debug(host.page)).lyrics, { timeout: 60_000 })
      .toMatch(/synced|plain/);
    await expect(host.page.locator(lyricsPanel)).toBeVisible();

    const firstVideo = (await debug(host.page)).videoId;
    await host.page.getByRole("button", { name: "Skip to next song" }).click();
    await expect
      .poll(async () => (await debug(host.page)).videoId, { timeout: 30_000 })
      .not.toBe(firstVideo);
    await expect
      .poll(async () => (await debug(host.page)).lyrics, { timeout: 60_000 })
      .toMatch(/synced|plain/);
    await expect(host.page.locator(lyricsPanel)).toBeVisible();

    await host.context.close();
  });

  test("when the host leaves the call, the remaining member becomes host", async ({ browser }) => {
    test.skip(!livekitReady, "LiveKit env not configured");
    const host = await userContext(browser, "host");
    const friend = await userContext(browser, "friend");

    const code = await openRoomAndJoin(host.page);
    await joinByLink(friend.page, code);
    // Tiles render as placeholders when cameras are off, so the count still proves both joined.
    await expect(friend.page.locator("[data-slot=participant-tile]")).toHaveCount(2, {
      timeout: 30_000,
    });

    await host.context.close();

    await expect(friend.page.getByText("You are the host now")).toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => (await debug(friend.page)).role, { timeout: 20_000 }).toBe("host");
    await friend.context.close();
  });
});

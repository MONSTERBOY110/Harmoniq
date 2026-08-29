import { expect, test, type Page } from "@playwright/test";
import { addFirstResult, debug, firebaseReady, openRoomAndJoin, userContext } from "./helpers";

type LyricDebug = {
  lyrics?: string;
  lyricLines?: number;
  lyricTimeMs?: number;
  offsetMs?: number;
  positionMs?: number;
};

async function lyricState(page: Page): Promise<LyricDebug> {
  return (await debug(page)) as LyricDebug;
}

async function activeIndex(page: Page): Promise<number> {
  const value = await page
    .locator("[data-slot=lyric-sweep]")
    .first()
    .getAttribute("data-active-index");
  return Number(value ?? "-99");
}

test.describe("lyric timing", () => {
  test.setTimeout(300_000);
  test.skip(!firebaseReady, "Firebase env not configured");

  test("the intro counts down, the host can start the lyrics, and lines then advance", async ({
    browser,
  }) => {
    const host = await userContext(browser, "host");
    await openRoomAndJoin(host.page);
    await addFirstResult(host.page, "Coldplay Yellow karaoke");

    await expect.poll(async () => (await lyricState(host.page)).lyrics, { timeout: 60_000 }).toBe(
      "synced",
    );
    await expect(host.page.locator("[data-slot=lyric-sweep]")).toBeVisible();

    // The lyric clock tracks the player clock. It does not sit at the same value: a karaoke intro
    // of up to 30 s puts the words behind the video on purpose, and the clock starts negative
    // because the first line has not arrived yet. So compare how the two clocks move, not where
    // they sit, which is what "tracks the player clock" actually means.
    const before = await lyricState(host.page);
    await expect
      .poll(async () => (await lyricState(host.page)).positionMs ?? 0, { timeout: 30_000 })
      .toBeGreaterThan((before.positionMs ?? 0) + 2_000);
    const running = await lyricState(host.page);
    expect(running.lyricLines ?? 0).toBeGreaterThan(3);
    const played = (running.positionMs ?? 0) - (before.positionMs ?? 0);
    const lyricsMoved = (running.lyricTimeMs ?? 0) - (before.lyricTimeMs ?? 0);
    expect(Math.abs(lyricsMoved - played), "the lyric clock drifted from the player").toBeLessThan(
      500,
    );

    // Yellow does not sing for half a minute: the panel counts down instead of looking frozen.
    const intro = host.page.locator("[data-slot=lyric-intro]");
    await expect(intro).toBeVisible();
    await expect(intro).toContainText(/First line in \d+s|First line in now/);
    expect(await activeIndex(host.page)).toBe(-1);

    // The host lines the words up with what is actually being sung.
    await host.page.getByRole("button", { name: "Start lyrics here" }).click();
    await expect
      .poll(async () => (await lyricState(host.page)).offsetMs ?? 0, { timeout: 20_000 })
      .not.toBe(0);
    await expect
      .poll(async () => activeIndex(host.page), { timeout: 30_000, intervals: [500] })
      .toBeGreaterThanOrEqual(0);

    // From there the line under the sweep moves on with the song.
    const first = await activeIndex(host.page);
    await expect
      .poll(async () => activeIndex(host.page), { timeout: 60_000, intervals: [1000] })
      .toBeGreaterThan(first);

    // The fill is driven every frame, so it is a real percentage, not a stuck 0.
    const sweep = await host.page
      .locator("[data-slot=lyric-active]")
      .first()
      .evaluate((el) => el.style.getPropertyValue("--sweep"));
    expect(sweep).toMatch(/^\d+(\.\d+)?%$/);
    expect(Number.parseFloat(sweep)).toBeGreaterThan(0);

    await host.context.close();
  });

  test("the host's timing offset shifts the lyrics for everyone", async ({ browser }) => {
    const host = await userContext(browser, "host");
    await openRoomAndJoin(host.page);
    await addFirstResult(host.page, "Coldplay Yellow karaoke");
    await expect.poll(async () => (await lyricState(host.page)).lyrics, { timeout: 60_000 }).toBe(
      "synced",
    );

    const start = (await lyricState(host.page)).offsetMs ?? 0;
    await host.page.getByRole("button", { name: "Lyrics later" }).click();
    await expect
      .poll(async () => (await lyricState(host.page)).offsetMs, { timeout: 20_000 })
      .toBe(start + 500);

    await host.page.getByRole("button", { name: "Lyrics earlier" }).click();
    await host.page.getByRole("button", { name: "Lyrics earlier" }).click();
    await expect
      .poll(async () => (await lyricState(host.page)).offsetMs, { timeout: 20_000 })
      .toBe(start - 500);

    await host.context.close();
  });
});

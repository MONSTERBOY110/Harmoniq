import { expect, test } from "@playwright/test";
import { firebaseReady, joinByLink, livekitReady, openRoomAndJoin, userContext } from "./helpers";

test.describe("video call", () => {
  test.setTimeout(240_000);
  test.skip(!firebaseReady || !livekitReady, "Firebase or LiveKit env not configured");

  test("two people join the call and see each other's tiles", async ({ browser }) => {
    const host = await userContext(browser, "host");
    const guest = await userContext(browser, "friend");

    const code = await openRoomAndJoin(host.page, undefined, { camera: true });
    await joinByLink(guest.page, code, { camera: true });

    const hostTiles = host.page.locator("[data-slot=participant-tile]");
    const guestTiles = guest.page.locator("[data-slot=participant-tile]");
    await expect(hostTiles).toHaveCount(2, { timeout: 30_000 });
    await expect(guestTiles).toHaveCount(2, { timeout: 30_000 });

    await expect(host.page.getByText(`${host.name} (you)`)).toBeVisible();
    await expect(host.page.getByText(guest.name, { exact: true })).toBeVisible();
    await expect(guest.page.getByText(host.name, { exact: true })).toBeVisible();

    // Muting shows up on the other side.
    await guest.page.getByRole("button", { name: "Mute microphone" }).click();
    await expect(
      host.page.locator(`[data-participant]:has-text('${guest.name}') [aria-label='Microphone off']`),
    ).toBeVisible({ timeout: 15_000 });

    await host.context.close();
    await guest.context.close();
  });

  test("on a laptop the whole grid fits, so nobody is below the fold", async ({ browser }) => {
    const host = await userContext(browser, "host");
    const guest = await userContext(browser, "friend");
    const third = await userContext(browser, "solo");

    const code = await openRoomAndJoin(host.page, undefined, { camera: true });
    await joinByLink(guest.page, code, { camera: true });

    const page = host.page;
    const grid = page.locator("[data-slot=video-grid]");
    const tiles = page.locator("[data-slot=participant-tile]");

    /** Every tile is on screen at once, and the grid is not a scroll port. */
    async function expectEveryoneVisible(count: number) {
      await expect(tiles).toHaveCount(count, { timeout: 30_000 });
      const scroll = await grid.evaluate((el) => ({
        y: el.scrollHeight - el.clientHeight,
        x: el.scrollWidth - el.clientWidth,
      }));
      expect(scroll.y, `grid scrolls vertically with ${count} in the room`).toBeLessThanOrEqual(1);
      expect(scroll.x, `grid scrolls horizontally with ${count} in the room`).toBeLessThanOrEqual(1);

      const box = await grid.boundingBox();
      expect(box).not.toBeNull();
      for (let i = 0; i < count; i += 1) {
        const tile = tiles.nth(i);
        await expect(tile).toBeInViewport();
        const tileBox = await tile.boundingBox();
        expect(tileBox).not.toBeNull();
        expect(tileBox!.y).toBeGreaterThanOrEqual(box!.y - 1);
        expect(tileBox!.y + tileBox!.height).toBeLessThanOrEqual(box!.y + box!.height + 1);
        expect(tileBox!.height).toBeGreaterThan(40);
      }
    }

    // Two people is the case that used to stack both tiles full width and push one out of sight.
    await expectEveryoneVisible(2);
    await expect(page.getByText(`${host.name} (you)`)).toBeVisible();
    if (process.env.CAPTURE) {
      await page.screenshot({ path: ".impeccable/review/call-grid-pair.png" });
    }

    await joinByLink(third.page, code, { camera: true });
    await expectEveryoneVisible(3);

    // A shorter laptop screen is where fitting is hardest.
    await page.setViewportSize({ width: 1366, height: 768 });
    await expectEveryoneVisible(3);
    if (process.env.CAPTURE) {
      await page.screenshot({ path: ".impeccable/review/call-grid-laptop.png" });
    }

    await host.context.close();
    await guest.context.close();
    await third.context.close();
  });

  test("on a phone the order is faces, then words, then the room chatter", async ({ browser }) => {
    const host = await userContext(browser, "host");
    await openRoomAndJoin(host.page, undefined, { camera: true });

    const page = host.page;
    await page.setViewportSize({ width: 390, height: 844 });

    const call = page.locator("[data-slot=video-grid]");
    const stage = page.locator("[data-slot=stage]");
    const queue = page.locator("[data-slot=queue-panel]");
    await expect(call).toBeVisible();
    await expect(stage).toBeVisible();
    await expect(queue).toBeVisible();

    const [callBox, stageBox, queueBox] = await Promise.all([
      call.boundingBox(),
      stage.boundingBox(),
      queue.boundingBox(),
    ]);
    expect(callBox).not.toBeNull();
    expect(stageBox).not.toBeNull();
    expect(queueBox).not.toBeNull();

    expect(callBox!.y, "the call sits above the lyrics").toBeLessThan(stageBox!.y);
    expect(stageBox!.y, "the lyrics sit above the queue").toBeLessThan(queueBox!.y);

    // The point of the order: the faces and the words share the first screen.
    expect(callBox!.y + callBox!.height).toBeLessThan(844);
    expect(stageBox!.y).toBeLessThan(844);

    // And the call strip never eats the screen, however many people are in the room.
    expect(callBox!.height).toBeLessThan(844 * 0.45);

    if (process.env.CAPTURE) {
      await page.screenshot({ path: ".impeccable/review/room-phone-order.png", fullPage: true });
    }

    await host.context.close();
  });
});

import { expect, test } from "@playwright/test";
import { addFirstResult, debug, firebaseReady, joinByLink, openRoomAndJoin, userContext } from "./helpers";

/**
 * Review captures for the design pass. Opt in with CAPTURE=1; writes into .impeccable/review/.
 */
test.describe("visual captures", () => {
  test.setTimeout(300_000);
  test.skip(!firebaseReady || !process.env.CAPTURE, "Set CAPTURE=1 to record review screenshots");

  test("stage with duet parts, parts sheet, and mobile stage", async ({ browser }) => {
    const host = await userContext(browser, "host");
    const friend = await userContext(browser, "friend");
    await host.page.setViewportSize({ width: 1440, height: 900 });

    const code = await openRoomAndJoin(host.page);
    await joinByLink(friend.page, code);

    await addFirstResult(host.page, "Coldplay Yellow karaoke");
    await expect.poll(async () => (await debug(host.page)).lyrics, { timeout: 60_000 }).toBe("synced");

    // The intro state: a countdown to the first line, with the host's alignment control.
    await expect(host.page.locator("[data-slot=lyric-intro]")).toBeVisible();
    await host.page.screenshot({ path: ".impeccable/review/stage-intro.png" });

    await host.page.getByRole("button", { name: "Parts" }).click();
    await host.page.getByRole("button", { name: "Alternate lines" }).click();
    await host.page.waitForTimeout(800);
    await host.page.screenshot({ path: ".impeccable/review/parts-sheet.png" });
    await host.page.keyboard.press("Escape");

    await expect
      .poll(async () => (await debug(host.page)).positionMs ?? 0, { timeout: 60_000 })
      .toBeGreaterThan(15_000);
    await host.page.screenshot({ path: ".impeccable/review/stage-duet-desktop.png" });

    await friend.page.setViewportSize({ width: 390, height: 844 });
    await friend.page.waitForTimeout(1500);
    await friend.page.screenshot({ path: ".impeccable/review/stage-duet-mobile.png", fullPage: true });

    await host.context.close();
    await friend.context.close();
  });
});

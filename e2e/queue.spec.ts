import { expect, test } from "@playwright/test";
import { addFirstResult, firebaseReady, joinByLink, openRoomAndJoin, userContext } from "./helpers";

test.describe("queue", () => {
  test.setTimeout(240_000);
  test.skip(!firebaseReady, "Firebase env not configured");

  test("a song added by the host appears for a friend within seconds", async ({ browser }) => {
    const host = await userContext(browser, "host");
    const friend = await userContext(browser, "friend");

    const code = await openRoomAndJoin(host.page);
    await joinByLink(friend.page, code);

    // First song auto-plays; the second one is what we assert on in the queue list.
    await addFirstResult(host.page, "Adele Someone Like You");
    const secondTitle = await addFirstResult(host.page, "Coldplay Yellow");

    await expect(host.page.locator("[data-slot=queue-item]")).toHaveCount(1, { timeout: 20_000 });
    await expect(friend.page.locator("[data-slot=queue-item]")).toHaveCount(1, { timeout: 20_000 });
    await expect(friend.page.locator("[data-slot=queue-item]").first()).toContainText(
      secondTitle.slice(0, 20),
    );

    // A long song title must not push the room sideways: an auto grid column grows to its widest
    // child, which used to put the queue controls 127 px off a phone screen.
    for (const page of [host.page, friend.page]) {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, "the room scrolls sideways with a song queued").toBeLessThanOrEqual(1);
    }

    // The friend cannot remove the host's song; the host can.
    await expect(friend.page.getByRole("button", { name: /^Remove / })).toHaveCount(0);
    await host.page.getByRole("button", { name: /^Remove / }).click();
    await expect(friend.page.locator("[data-slot=queue-item]")).toHaveCount(0, { timeout: 20_000 });

    await host.context.close();
    await friend.context.close();
  });
});

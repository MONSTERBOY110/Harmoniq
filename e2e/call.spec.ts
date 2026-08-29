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
});

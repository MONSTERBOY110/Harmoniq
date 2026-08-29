import { expect, test, type Page } from "@playwright/test";
import { addFirstResult, debug, firebaseReady, joinByLink, openRoomAndJoin, userContext } from "./helpers";

async function openParts(page: Page) {
  await page.getByRole("button", { name: "Parts" }).click();
  await expect(page.getByRole("heading", { name: "Who sings what" })).toBeVisible();
  // Alternating needs two singers with colours, which are handed out as people join.
  await expect(page.getByRole("button", { name: "Alternate lines" })).toBeEnabled({
    timeout: 30_000,
  });
}

test.describe("duet parts", () => {
  test.setTimeout(300_000);
  test.skip(!firebaseReady, "Firebase env not configured");

  test("the host alternates lines between two singers and both see the coloured chips", async ({
    browser,
  }) => {
    const host = await userContext(browser, "host");
    const friend = await userContext(browser, "friend");

    const code = await openRoomAndJoin(host.page);
    await joinByLink(friend.page, code);

    await addFirstResult(host.page, "Coldplay Yellow karaoke");
    await expect.poll(async () => (await debug(host.page)).lyrics, { timeout: 60_000 }).toBe("synced");

    await openParts(host.page);
    await host.page.getByRole("button", { name: "Alternate lines" }).click();
    const rows = host.page.locator("[data-slot=parts-list] li");
    await expect(rows.first()).toContainText(host.name);
    await expect(rows.nth(1)).toContainText(friend.name);
    await host.page.keyboard.press("Escape");

    // Both stages now show singer chips next to the lines.
    for (const page of [host.page, friend.page]) {
      const sweep = page.locator("[data-slot=lyric-sweep]");
      await expect(sweep).toBeVisible({ timeout: 30_000 });
      await expect(sweep.getByText(host.name).first()).toBeVisible({ timeout: 30_000 });
      await expect(sweep.getByText(friend.name).first()).toBeVisible({ timeout: 30_000 });
    }

    await host.context.close();
    await friend.context.close();
  });

  test("tapping a line cycles it through the singers and back to everyone", async ({ browser }) => {
    const host = await userContext(browser, "host");
    const friend = await userContext(browser, "friend");

    const code = await openRoomAndJoin(host.page);
    await joinByLink(friend.page, code);
    await addFirstResult(host.page, "Coldplay Yellow karaoke");
    await expect.poll(async () => (await debug(host.page)).lyrics, { timeout: 60_000 }).toBe("synced");

    await openParts(host.page);
    await host.page.getByRole("button", { name: "Everyone sings" }).click();
    const firstLine = host.page.locator("[data-slot=parts-list] li button").first();
    await expect(firstLine).toContainText("Everyone");

    // Everyone -> singer one -> singer two -> everyone again.
    await firstLine.click();
    await expect(firstLine).toContainText(host.name);
    await firstLine.click();
    await expect(firstLine).toContainText(friend.name);
    await firstLine.click();
    await expect(firstLine).toContainText("Everyone");

    await host.context.close();
    await friend.context.close();
  });

  test("each singer's lines carry that singer's own colour, on both screens", async ({ browser }) => {
    const host = await userContext(browser, "host");
    const friend = await userContext(browser, "friend");

    const code = await openRoomAndJoin(host.page);
    await joinByLink(friend.page, code);
    await addFirstResult(host.page, "Coldplay Yellow karaoke");
    await expect.poll(async () => (await debug(host.page)).lyrics, { timeout: 60_000 }).toBe("synced");

    await openParts(host.page);
    await host.page.getByRole("button", { name: "Alternate lines" }).click();
    const chips = host.page.locator("[data-slot=parts-list] [data-slot=parts-chip]");
    const hostColour = await chips.nth(0).getAttribute("data-colour");
    const friendColour = await chips.nth(1).getAttribute("data-colour");

    // Two people, two gels: a real colour each, never the same, never the shared amber.
    expect(hostColour).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(friendColour).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(hostColour).not.toBe(friendColour);
    expect([hostColour, friendColour]).not.toContain("#E9A84A");
    await host.page.keyboard.press("Escape");

    // Both screens attach the same colour to the same singer.
    for (const page of [host.page, friend.page]) {
      const sweep = page.locator("[data-slot=lyric-sweep]");
      const hostChip = sweep.locator(`[data-slot=singer-chip]:has-text("${host.name}")`).first();
      const friendChip = sweep.locator(`[data-slot=singer-chip]:has-text("${friend.name}")`).first();
      await expect(hostChip).toBeVisible({ timeout: 30_000 });
      await expect(friendChip).toBeVisible({ timeout: 30_000 });
      expect(await hostChip.getAttribute("data-colour")).toBe(hostColour);
      expect(await friendChip.getAttribute("data-colour")).toBe(friendColour);
    }

    await host.context.close();
    await friend.context.close();
  });
});

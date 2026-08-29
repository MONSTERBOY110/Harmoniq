import { expect, test } from "@playwright/test";
import { firebaseReady, userContext } from "./helpers";

test.describe("rooms", () => {
  test.setTimeout(180_000);
  test.skip(!firebaseReady, "Firebase env not configured");

  test("host opens a room, friend joins by code, both reach the lobby", async ({ browser }) => {
    const host = await userContext(browser, "host");
    const friend = await userContext(browser, "friend");

    await host.page.getByLabel("Room name").fill("E2E Night");
    await host.page.getByRole("button", { name: "Open a room" }).click();
    await expect(host.page).toHaveURL(/\/room\/[A-Z2-9]{6}$/);
    const code = host.page.url().split("/room/")[1]!;

    await expect(host.page.getByRole("heading", { name: "E2E Night" })).toBeVisible();
    await expect(host.page.getByText("You are the host")).toBeVisible();
    await expect(host.page.getByRole("radiogroup", { name: "Your colour on stage" })).toBeVisible();

    await friend.page.getByLabel("Room code").fill(code.toLowerCase());
    await expect(friend.page.getByLabel("Room code")).toHaveValue(
      `${code.slice(0, 3)}-${code.slice(3)}`,
    );
    await friend.page.getByRole("button", { name: "Join" }).click();
    await expect(friend.page).toHaveURL(new RegExp(`/room/${code}$`));
    await expect(friend.page.getByRole("heading", { name: "E2E Night" })).toBeVisible();
    await expect(friend.page.getByText("Your host controls playback")).toBeVisible();

    // Each singer got a different colour automatically.
    await expect
      .poll(async () => {
        const [h, f] = await Promise.all(
          [host.page, friend.page].map((p) =>
            p.getByRole("radio", { checked: true }).getAttribute("aria-label"),
          ),
        );
        return h && f && h !== f;
      }, { timeout: 15_000 })
      .toBe(true);

    await friend.page.goto("/rooms");
    await expect(friend.page.getByRole("link", { name: /E2E Night/ }).first()).toBeVisible();

    await host.context.close();
    await friend.context.close();
  });

  test("a wrong code gets a plain explanation", async ({ browser }) => {
    const user = await userContext(browser, "solo");
    await user.page.getByLabel("Room code").fill("ZZZZZZ");
    await user.page.getByRole("button", { name: "Join" }).click();
    await expect(user.page.getByText("No room with that code")).toBeVisible();
    await user.context.close();
  });

  test("a person removes a room from their own recent list, and can undo it", async ({ browser }) => {
    const user = await userContext(browser, "solo");
    const name = `Forget me ${Date.now()}`;

    await user.page.getByLabel("Room name").fill(name);
    await user.page.getByRole("button", { name: "Open a room" }).click();
    await expect(user.page).toHaveURL(/\/room\/[A-Z2-9]{6}$/);
    const code = user.page.url().split("/room/")[1]!;

    await user.page.goto("/rooms");
    const row = user.page.locator(`[data-slot=recent-room]:has-text("${name}")`);
    await expect(row).toHaveCount(1);

    // Undo puts it straight back.
    await row.getByRole("button", { name: `Remove ${name} from your recent rooms` }).click();
    await expect(row).toHaveCount(0);
    await user.page.getByRole("button", { name: "Undo" }).click();
    await expect(user.page.locator(`[data-slot=recent-room]:has-text("${name}")`)).toHaveCount(1, {
      timeout: 20_000,
    });

    // Removing for real survives a reload.
    await user.page
      .locator(`[data-slot=recent-room]:has-text("${name}")`)
      .getByRole("button", { name: `Remove ${name} from your recent rooms` })
      .click();
    await expect(user.page.locator(`[data-slot=recent-room]:has-text("${name}")`)).toHaveCount(0);
    await user.page.reload();
    await expect(user.page.locator(`[data-slot=recent-room]:has-text("${name}")`)).toHaveCount(0);

    // The room itself is untouched: the code still opens it.
    await user.page.goto(`/room/${code}`);
    await expect(user.page.getByRole("heading", { name })).toBeVisible();

    await user.context.close();
  });
});

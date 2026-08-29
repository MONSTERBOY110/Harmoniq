import { expect, test } from "@playwright/test";
import { firebaseReady, joinByLink, openRoomAndJoin, userContext } from "./helpers";

test.describe("chat", () => {
  test.setTimeout(240_000);
  test.skip(!firebaseReady, "Firebase env not configured");

  test("a message reaches the other person and shows an unread badge", async ({ browser }) => {
    const host = await userContext(browser, "host");
    const friend = await userContext(browser, "friend");

    const code = await openRoomAndJoin(host.page);
    await joinByLink(friend.page, code);

    await host.page.getByRole("tab", { name: /Chat/ }).click();
    const text = `Ready to sing? ${Date.now()}`;
    await host.page.getByLabel("Message", { exact: true }).fill(text);
    await host.page.getByRole("button", { name: "Send message" }).click();
    await expect(host.page.getByText(text)).toBeVisible();

    // The friend is on the queue tab: the chat tab shows a count, then the message once opened.
    await expect(friend.page.getByRole("tab", { name: /Chat/ })).toContainText(/\d/, { timeout: 15_000 });
    await friend.page.getByRole("tab", { name: /Chat/ }).click();
    await expect(friend.page.getByText(text)).toBeVisible();
    await expect(friend.page.getByText(host.name, { exact: true }).first()).toBeVisible();

    await host.context.close();
    await friend.context.close();
  });
});

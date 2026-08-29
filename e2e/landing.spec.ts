import { expect, test } from "@playwright/test";

test.describe("landing", () => {
  test("shows the wordmark, the demo stage, the pill nav, and a working code form", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: /Harmoniq/ })).toBeVisible();
    await expect(page.getByRole("img", { name: "Demo of a Harmoniq room" })).toBeVisible();
    await expect(page.getByText("Demo", { exact: true }).first()).toBeVisible();

    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: /Open a room/ })).toBeVisible();

    // The join form only enables with six characters, then routes through sign-in.
    const form = page.getByRole("form", { name: "Join with a code" });
    await expect(form.getByRole("button", { name: "Join" })).toBeDisabled();
    await form.getByLabel("Room code").fill("abcdef");
    await expect(form.getByLabel("Room code")).toHaveValue("ABC-DEF");
    await form.getByRole("button", { name: "Join" }).click();
    await expect(page).toHaveURL(/\/signin\?next=%2Froom%2FABCDEF$/);
  });

  test("has no em or en dashes in visible copy and no horizontal scroll on a phone", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto("/");
    // Measure after the web fonts land: the fallback face is wider than Geist.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    const text = await page.evaluate(() => document.body.innerText);
    expect(text).not.toMatch(/[–—]/);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await context.close();
  });
});

import { expect, test } from "@playwright/test";
import { firebaseReady, signInAs } from "./helpers";

test.describe("route guard", () => {
  test("sends a signed-out visitor from /rooms to sign in with a return path", async ({ page }) => {
    await page.goto("/rooms");
    await expect(page).toHaveURL(/\/signin\?next=%2Frooms$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
});

test.describe("accounts", () => {
  test.skip(!firebaseReady, "Firebase env not configured");

  test("sign in (or sign up), land on rooms, sign out, get redirected", async ({ page }) => {
    const name = await signInAs(page, "solo");
    await expect(page).toHaveURL(/\/rooms$/);
    await expect(
      page.getByRole("heading", { name: new RegExp(`Ready when you are, ${name}`) }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/rooms");
    await expect(page).toHaveURL(/\/signin\?next=%2Frooms$/);
  });

  test("a wrong password gets plain copy, not a stack trace", async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel("Email").fill("e2e-solo@harmoniq.test");
    await page.getByLabel("Password", { exact: true }).fill("definitely-wrong");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: /do not match|Too many attempts/ }).first(),
    ).toBeVisible();
  });
});

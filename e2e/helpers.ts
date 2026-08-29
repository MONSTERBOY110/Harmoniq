import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

export function envValue(key: string): string {
  if (process.env[key]) return process.env[key]!;
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    const line = readFileSync(file, "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith(`${key}=`));
    if (line) return line.slice(key.length + 1).trim();
  }
  return "";
}

export const firebaseReady =
  !!envValue("NEXT_PUBLIC_FIREBASE_API_KEY") && !!envValue("FIREBASE_SERVICE_ACCOUNT_BASE64");

export const livekitReady =
  !!envValue("LIVEKIT_API_KEY") &&
  !!envValue("LIVEKIT_API_SECRET") &&
  !/your-project/.test(envValue("LIVEKIT_URL"));

const PASSWORD = "longenough123";

/**
 * Fixed accounts per role keep Firebase's sign-up throttling out of the picture.
 * Sign in first; create the account only when it does not exist yet.
 */
export async function signInAs(page: Page, role: "host" | "friend" | "solo"): Promise<string> {
  const name = role === "host" ? "Hosty" : role === "friend" ? "Friendo" : "Solo";
  const email = `e2e-${role}@harmoniq.test`;

  const signIn = async () => {
    await page.goto("/signin");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    return Promise.race([
      page.waitForURL(/\/rooms$/, { timeout: 45_000 }).then(() => "in" as const),
      page
        .getByRole("alert")
        .filter({ hasText: /do not match|went wrong|Too many|offline/ })
        .first()
        .waitFor({ timeout: 45_000 })
        .then(() => "error" as const),
    ]).catch(() => "timeout" as const);
  };

  if ((await signIn()) === "in") return name;

  // No account yet (first run on this project): create it.
  await page.goto("/signup");
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  const created = await Promise.race([
    page.waitForURL(/\/rooms$/, { timeout: 45_000 }).then(() => "in" as const),
    page
      .getByRole("alert")
      .filter({ hasText: /already has an account/ })
      .first()
      .waitFor({ timeout: 45_000 })
      .then(() => "exists" as const),
  ]).catch(() => "timeout" as const);
  if (created === "in") return name;

  // The account exists after all (the sign-in above was just slow or throttled): one more try.
  if ((await signIn()) === "in") return name;
  throw new Error(`Could not sign in as ${email}`);
}

export async function userContext(
  browser: Browser,
  role: "host" | "friend" | "solo",
): Promise<{ context: BrowserContext; page: Page; name: string }> {
  const context = await browser.newContext({ permissions: ["camera", "microphone"] });
  const page = await context.newPage();
  // The Next.js dev overlay renders a full-window portal that swallows clicks on the transport
  // bar. It exists only in development, so hiding it tests the real product, not the toolbar.
  await page.addInitScript(() => {
    const hide = () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal{display:none!important}";
      document.head?.appendChild(style);
    };
    if (document.head) hide();
    else document.addEventListener("DOMContentLoaded", hide);
  });
  const name = await signInAs(page, role);
  return { context, page, name };
}

export type JoinOptions = {
  /** Publish camera video. Default false: two encoding browsers plus YouTube starve the test CPU. */
  camera?: boolean;
};

/** In the lobby: set devices, then click through. */
export async function joinFromLobby(page: Page, options: JoinOptions = {}): Promise<void> {
  const join = page.getByRole("button", { name: "Join with sound" });
  await expect(join).toBeVisible();
  if (!options.camera) {
    const cameraOn = page.getByRole("button", { name: "Camera on" });
    if (await cameraOn.isVisible().catch(() => false)) await cameraOn.click();
  }
  await join.click();
}

export async function openRoomAndJoin(
  page: Page,
  roomName?: string,
  options: JoinOptions = {},
): Promise<string> {
  if (roomName) await page.getByLabel("Room name").fill(roomName);
  await page.getByRole("button", { name: "Open a room" }).click();
  await expect(page).toHaveURL(/\/room\/[A-Z2-9]{6}$/);
  const code = page.url().split("/room/")[1]!;
  await joinFromLobby(page, options);
  return code;
}

export async function joinByLink(page: Page, code: string, options: JoinOptions = {}): Promise<void> {
  await page.goto(`/room/${code}`);
  await joinFromLobby(page, options);
}

export async function addFirstResult(page: Page, query: string): Promise<string> {
  await page.getByRole("button", { name: "Add song" }).first().click();
  await page.getByLabel("Search for a song").fill(query);
  await page.keyboard.press("Enter");
  const first = page.locator("[data-slot=song-results] li button").first();
  await expect(first).toBeVisible({ timeout: 30_000 });
  const title = (await first.locator("p").first().textContent()) ?? "";
  await first.click();
  await page.getByRole("button", { name: "Add to queue" }).click();
  return title;
}

export type Debug = {
  role?: string;
  status?: string;
  positionMs?: number;
  videoId?: string | null;
  lyrics?: string;
};

export async function debug(page: Page): Promise<Debug> {
  return page.evaluate(
    () => (window as unknown as { __harmoniqDebug?: Debug }).__harmoniqDebug ?? {},
  );
}

import { expect, test, type Page } from "@playwright/test";
import { emptyWorkforce } from "./workforce-fixture";

async function accessFixture(page: Page, options: { signedIn?: boolean; initial?: boolean; unavailable?: boolean; nativeDemo?: boolean } = {}) {
  let signedIn = options.signedIn ?? false;
  let initial = options.initial ?? false;
  let unavailable = options.unavailable ?? false;
  const requests: string[] = [];
  const logins: unknown[] = [];
  const passwordChanges: unknown[] = [];
  const selections: unknown[] = [];
  const session = () => ({
    enabled: true, authentication: options.nativeDemo ? undefined : "password",
    canImport: false, canAdminister: false, canReadAnalytics: false,
    users: options.nativeDemo ? [{ id: "reader", name: "Alex Morgan" }] : [],
    user: signedIn ? { id: "reader", name: "Alex Morgan", profile: "technician" } : null,
    mustChangePassword: signedIn && initial,
    scope: signedIn ? { organizationId: "org", siteId: "site", sourceId: "source", siteTimeZone: "UTC" } : null,
  });
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    requests.push(path);
    switch (path) {
      case "/api/v1/session/context":
        return route.fulfill({
          status: unavailable ? 503 : 200,
          json: unavailable ? { code: "service_unavailable" } : session(),
        });
      case "/api/v1/demo/user":
        selections.push(route.request().postDataJSON());
        signedIn = true;
        return route.fulfill({ json: session() });
      case "/api/v1/auth/login": {
        const credentials = route.request().postDataJSON();
        logins.push(credentials);
        if (credentials.password === "incorrect-test-password")
          return route.fulfill({ status: 401, json: { code: "invalid_credentials" } });
        signedIn = true;
        return route.fulfill({ json: {} });
      }
      case "/api/v1/auth/logout":
        signedIn = false;
        return route.fulfill({ json: {} });
      case "/api/v1/auth/password":
        passwordChanges.push(route.request().postDataJSON());
        initial = false;
        signedIn = false;
        return route.fulfill({ json: {} });
      case "/api/v1/workforce/summary":
        return route.fulfill({ json: {
          actorId: "reader", today: "2026-10-09", currentFrom: "2026-10-01", previousFrom: "2026-09-01", previousTo: "2026-09-30",
          homeTargetId: "", homeTargetLabel: "", teamLabel: "", scheduledDays: 0, shifts: [], saturdays: 0, sundays: 0,
        } });
      case "/api/v1/workforce/board":
        return route.fulfill({ json: emptyWorkforce });
      case "/api/v1/maintenance/assignments":
        return route.fulfill({ json: { records: [], events: [] } });
      case "/api/v1/handover/context":
        return route.fulfill({ json: {
          actorId: "reader", canCoordinate: false, people: [], categories: [],
          locations: [], timeZone: "UTC", externalSystemLabel: "Work reference",
        } });
      case "/api/v1/handover/query":
        return route.fulfill({ json: { entries: [], total: 0, nextCursor: "" } });
      default:
        throw new Error(`Unexpected landing request: ${path}`);
    }
  });
  return { requests, logins, passwordChanges, selections, recover: () => { unavailable = false; } };
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

for (const width of [1440, 1024, 375]) {
  test(`platform introduction, localization and existing login at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const fixture = await accessFixture(page);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("A shared view of your daily operations.");
    await expect(page.getByRole("heading", { name: "Sign in to IOP" })).toBeVisible();
    await expect(page.locator(".landing-module")).toHaveCount(6);
    expect(fixture.requests.every((path) => path.endsWith("/session/context"))).toBe(true);
    await noOverflow(page);
    await page.screenshot({ path: `/tmp/iop-201-landing-${width}.png`, fullPage: true });

    await page.getByRole("link", { name: "Skip to platform overview" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#landing-main")).toBeFocused();
    await page.getByRole("link", { name: "The platform", exact: true }).click();
    await expect(page).toHaveURL(/#platform$/);
    await page.getByRole("link", { name: "How it connects" }).click();
    await expect(page).toHaveURL(/#workflow$/);
    await page.getByRole("combobox", { name: "Language" }).selectOption("de");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ein gemeinsamer Blick auf den täglichen Betrieb.");
    await expect(page.getByRole("heading", { name: "Digitaler Anlagendatensatz" })).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await noOverflow(page);
    await page.screenshot({ path: `/tmp/iop-201-landing-de-${width}.png`, fullPage: true });
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ein gemeinsamer Blick auf den täglichen Betrieb.");
    await page.getByRole("combobox", { name: "Sprache" }).selectOption("en");

    await page.getByRole("navigation", { name: "Platform navigation" }).getByRole("link", { name: "Go to sign-in" }).click();
    await expect(page).toHaveURL(/#sign-in$/);
    await expect(page.locator("#sign-in")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Username", { exact: true })).toBeFocused();
    await page.getByLabel("Username", { exact: true }).fill("alex");
    await page.getByLabel("Password", { exact: true }).fill("incorrect-test-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText("The username or password is incorrect.");
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
    await page.getByLabel("Password", { exact: true }).fill("landing-test-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Welcome, Alex Morgan" })).toBeVisible();
    await expect(page.locator(".landing")).toHaveCount(0);
    expect(fixture.logins).toEqual([
      { username: "alex", password: "incorrect-test-password" },
      { username: "alex", password: "landing-test-password" },
    ]);
    await page.getByRole("button", { name: "User menu" }).click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByRole("heading", { name: "Sign in to IOP" })).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeEmpty();
    await noOverflow(page);
    expect(errors).toEqual([]);
  });
}

test("initial passwords keep the required replacement flow", async ({ page }) => {
  const fixture = await accessFixture(page, { initial: true });
  await page.goto("/");
  await page.getByLabel("Username", { exact: true }).fill("alex");
  await page.getByLabel("Password", { exact: true }).fill("initial-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Choose your own password" })).toBeVisible();
  await expect(page.locator(".landing")).toHaveCount(0);
  await page.getByLabel("Current initial password", { exact: true }).fill("initial-test-password");
  await page.getByLabel("New password", { exact: true }).fill("replacement-test-password");
  await page.getByLabel("Confirm new password", { exact: true }).fill("replacement-test-password");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByRole("heading", { name: "Sign in to IOP" })).toBeVisible();
  expect(fixture.passwordChanges).toEqual([{ currentPassword: "initial-test-password", password: "replacement-test-password" }]);
  await page.getByLabel("Username", { exact: true }).fill("alex");
  await page.getByLabel("Password", { exact: true }).fill("replacement-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Welcome, Alex Morgan" })).toBeVisible();
});

test("restored sessions open the assigned workspace directly", async ({ page }) => {
  await accessFixture(page, { signedIn: true });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome, Alex Morgan" })).toBeVisible();
  await expect(page.locator(".landing")).toHaveCount(0);
});

test("native demo mode enters through its existing configured selector", async ({ page }) => {
  const fixture = await accessFixture(page, { nativeDemo: true });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Open the demo workspace" })).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
  await page.getByRole("combobox", { name: "Demo user" }).selectOption("reader");
  await expect(page.getByRole("heading", { name: "Welcome, Alex Morgan" })).toBeVisible();
  await expect(page.locator(".landing")).toHaveCount(0);
  expect(fixture.selections).toEqual([{ userId: "reader" }]);
  expect(fixture.logins).toEqual([]);
});

test("the platform remains readable during connection failure and recovery", async ({ page }) => {
  const fixture = await accessFixture(page, { unavailable: true });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A shared view of your daily operations.");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("Username", { exact: true })).toHaveCount(0);
  fixture.recover();
  await page.getByRole("button", { name: "Retry connection" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByLabel("Username", { exact: true })).toBeVisible();
});

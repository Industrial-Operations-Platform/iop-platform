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

async function openAccess(page: Page) {
  await page.getByRole("navigation", { name: "Platform navigation" })
    .getByRole("button", { name: "Sign in", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Workspace access", exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function minimalHome(page: Page) {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bring operations into focus.");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Sign in to IOP" })).toHaveCount(0);
  await expect(page.getByLabel("Username", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Demo user" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Retry connection" })).toHaveCount(0);
  await expect(page.locator(".intro-about-module")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "From shift context to retained history" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /trial|pricing/i })).toHaveCount(0);
}

for (const width of [1440, 1024, 375]) {
  test(`platform introduction, localization and existing login at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const fixture = await accessFixture(page);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await minimalHome(page);
    await expect(page.getByRole("navigation", { name: "Explore main modules" })
      .getByRole("button", { name: "Data Analysis", exact: true })).toHaveAttribute("aria-pressed", "true");
    expect(fixture.requests.every((path) => path.endsWith("/session/context"))).toBe(true);
    await noOverflow(page);
    await page.screenshot({ path: `/tmp/iop-201-intro-${width}.png`, fullPage: true });

    await page.getByRole("link", { name: "Skip to platform overview" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#landing-main")).toBeFocused();
    const aboutButton = page.getByRole("button", { name: "About IOP", exact: true });
    await aboutButton.click();
    const about = page.getByRole("dialog", { name: "About IOP", exact: true });
    await expect(about.locator(".intro-about-module")).toHaveCount(6);
    await expect(about.getByRole("heading", { name: "From shift context to retained history" })).toBeVisible();
    await expect(about.getByRole("heading", { name: "Digital Asset Record", exact: true })).toBeVisible();
    await expect(about.getByLabel("Username", { exact: true })).toHaveCount(0);
    await page.screenshot({ path: `/tmp/iop-201-intro-about-${width}.png`, fullPage: true });
    await page.keyboard.press("Escape");
    await expect(about).toHaveCount(0);
    await expect(aboutButton).toBeFocused();
    await page.getByRole("combobox", { name: "Language" }).selectOption("de");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Den Betrieb in den Fokus rücken.");
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await noOverflow(page);
    await page.screenshot({ path: `/tmp/iop-201-intro-de-${width}.png`, fullPage: true });
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Den Betrieb in den Fokus rücken.");
    await page.getByRole("combobox", { name: "Sprache" }).selectOption("en");

    const access = await openAccess(page);
    await expect(access.getByRole("heading", { name: "Sign in to IOP" })).toBeVisible();
    await access.getByLabel("Username", { exact: true }).fill("alex");
    await access.getByLabel("Password", { exact: true }).fill("incorrect-test-password");
    await access.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(access.getByRole("alert")).toHaveText("The username or password is incorrect.");
    await expect(access.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
    await access.getByLabel("Password", { exact: true }).fill("landing-test-password");
    await access.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Welcome, Alex Morgan" })).toBeVisible();
    await expect(page.locator(".landing")).toHaveCount(0);
    expect(fixture.logins).toEqual([
      { username: "alex", password: "incorrect-test-password" },
      { username: "alex", password: "landing-test-password" },
    ]);
    await page.getByRole("button", { name: "User menu" }).click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await minimalHome(page);
    const nextAccess = await openAccess(page);
    await expect(nextAccess.getByLabel("Password", { exact: true })).toBeEmpty();
    await noOverflow(page);
    expect(errors).toEqual([]);
  });
}

test("initial passwords keep the required replacement flow", async ({ page }) => {
  const fixture = await accessFixture(page, { initial: true });
  await page.goto("/");
  const access = await openAccess(page);
  await access.getByLabel("Username", { exact: true }).fill("alex");
  await access.getByLabel("Password", { exact: true }).fill("initial-test-password");
  await access.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Choose your own password" })).toBeVisible();
  await expect(page.locator(".landing")).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Choose your own password" })).toBeVisible();
  await page.getByLabel("Current initial password", { exact: true }).fill("initial-test-password");
  await page.getByLabel("New password", { exact: true }).fill("replacement-test-password");
  await page.getByLabel("Confirm new password", { exact: true }).fill("replacement-test-password");
  await page.getByRole("button", { name: "Change password" }).click();
  await minimalHome(page);
  expect(fixture.passwordChanges).toEqual([{ currentPassword: "initial-test-password", password: "replacement-test-password" }]);
  const nextAccess = await openAccess(page);
  await nextAccess.getByLabel("Username", { exact: true }).fill("alex");
  await nextAccess.getByLabel("Password", { exact: true }).fill("replacement-test-password");
  await nextAccess.getByRole("button", { name: "Sign in", exact: true }).click();
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
  await minimalHome(page);
  const access = await openAccess(page);
  await expect(access.getByRole("heading", { name: "Open the demo workspace" })).toBeVisible();
  await expect(access.getByLabel("Password", { exact: true })).toHaveCount(0);
  await access.getByRole("combobox", { name: "Demo user" }).selectOption("reader");
  await expect(page.getByRole("heading", { name: "Welcome, Alex Morgan" })).toBeVisible();
  await expect(page.locator(".landing")).toHaveCount(0);
  expect(fixture.selections).toEqual([{ userId: "reader" }]);
  expect(fixture.logins).toEqual([]);
});

test("the platform remains readable during connection failure and recovery", async ({ page }) => {
  const fixture = await accessFixture(page, { unavailable: true });
  await page.goto("/");
  await minimalHome(page);
  await expect(page.getByRole("alert")).toHaveCount(0);
  const access = await openAccess(page);
  await expect(access.getByRole("alert")).toBeVisible();
  await expect(access.getByLabel("Username", { exact: true })).toHaveCount(0);
  fixture.recover();
  await access.getByRole("button", { name: "Retry connection" }).click();
  await expect(access.getByRole("alert")).toHaveCount(0);
  await expect(access.getByLabel("Username", { exact: true })).toBeVisible();
});

test("pending sign-in keeps access open and prevents duplicate submissions", async ({ page }) => {
  await accessFixture(page);
  let release!: () => void;
  const pendingLogin = new Promise<void>((resolve) => { release = resolve; });
  const logins: unknown[] = [];
  await page.route("**/api/v1/auth/login", async (route) => {
    logins.push(route.request().postDataJSON());
    await pendingLogin;
    await route.fulfill({ status: 401, json: { code: "invalid_credentials" } });
  });
  await page.goto("/");
  const access = await openAccess(page);
  await access.getByLabel("Username", { exact: true }).fill("alex");
  await access.getByLabel("Password", { exact: true }).fill("incorrect-test-password");
  try {
    await access.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect.poll(() => logins.length).toBe(1);
    await expect(access.getByRole("button", { name: "Please wait…", exact: true })).toBeDisabled();
    await expect(access.getByRole("button", { name: "Close Workspace access", exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(access).toBeVisible();
    await page.keyboard.press("Enter");
    expect(logins).toHaveLength(1);
  } finally {
    release();
  }
  await expect(access.getByRole("alert")).toHaveText("The username or password is incorrect.");
  await expect(access.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
  await expect(access.getByRole("button", { name: "Close Workspace access", exact: true })).toBeEnabled();
  expect(logins).toEqual([{ username: "alex", password: "incorrect-test-password" }]);
  await page.keyboard.press("Escape");
  await minimalHome(page);
});

test("presentation dialogs contain focus, dismiss with Escape and restore their trigger", async ({ page }) => {
  await accessFixture(page);
  await page.goto("/");
  for (const name of ["About IOP", "Sign in"] as const) {
    const trigger = page.getByRole("navigation", { name: "Platform navigation" })
      .getByRole("button", { name, exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: name === "About IOP" ? name : "Workspace access", exact: true });
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((node) => {
      const background = Array.from(document.querySelectorAll<HTMLElement>(
        "a, button, input, select, textarea, [tabindex]",
      )).filter((element) => !node.contains(element));
      return background.length > 0 && background.every((element) => {
        element.focus();
        return document.activeElement !== element;
      });
    })).toBe(true);
    for (const key of ["Tab", "Shift+Tab"]) {
      for (let step = 0; step < 8; step += 1) {
        await page.keyboard.press(key);
        const focus = await dialog.evaluate((node) => ({
          contained: node.contains(document.activeElement),
          browserChrome: document.activeElement === document.body && !document.hasFocus(),
          modal: node.matches(":modal"),
        }));
        // Chromium may move Tab focus to browser chrome at the modal boundary.
        expect(focus.modal).toBe(true);
        expect(focus.contained || focus.browserChrome).toBe(true);
      }
    }
    await dialog.getByRole("button", { name: /^Close / }).focus();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
});

test("main module selection and animation controls support keyboard interaction", async ({ page }) => {
  await accessFixture(page);
  await page.goto("/");
  const modules = page.getByRole("navigation", { name: "Explore main modules" });
  await expect(modules.getByRole("button", { name: "Data Analysis", exact: true })).toHaveAttribute("aria-pressed", "true");
  for (const name of ["Maintenance", "Workforce", "Data Analysis"]) {
    const button = modules.getByRole("button", { name, exact: true });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(modules.locator('[aria-pressed="true"]')).toHaveCount(1);
  }
  const scene = page.locator(".intro-scene");
  const before = await scene.getAttribute("style");
  const bounds = await scene.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width * 0.8, bounds!.y + bounds!.height * 0.3);
  await expect.poll(() => scene.getAttribute("style")).not.toBe(before);
  await page.getByRole("button", { name: "Pause animation", exact: true }).click();
  await expect(page.locator(".landing")).toHaveAttribute("data-motion", "paused");
  await expect(page.getByRole("button", { name: "Resume animation", exact: true })).toBeVisible();
  const decorations = page.locator(".intro-scene-float, .intro-background-orbit");
  expect(await decorations.count()).toBeGreaterThan(0);
  expect(await decorations.evaluateAll((nodes) =>
    nodes.every((node) => getComputedStyle(node).animationPlayState.split(",").every((state) => state.trim() === "paused")),
  )).toBe(true);
  await page.getByRole("button", { name: "Resume animation", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause animation", exact: true })).toBeVisible();
});

test("reduced motion removes decorative animation and pointer tilt", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await accessFixture(page);
  await page.goto("/");
  const decorations = page.locator(".intro-scene-float, .intro-background-orbit");
  expect(await decorations.count()).toBeGreaterThan(0);
  expect(await decorations.evaluateAll((nodes) =>
    nodes.every((node) => getComputedStyle(node).animationName.split(",").every((name) => name.trim() === "none")),
  )).toBe(true);
  const scene = page.locator(".intro-scene");
  const before = await scene.getAttribute("style");
  const bounds = await scene.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width * 0.8, bounds!.y + bounds!.height * 0.3);
  expect(await scene.getAttribute("style")).toBe(before);
  await noOverflow(page);
});

import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { installDesktopConsistencyFixture } from "./desktop-consistency-fixture";

async function configurePresentation(page: Page, appearance: "light" | "dark", language = "en") {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.addInitScript(({ appearance, language }) => {
    localStorage.setItem("iop.appearance", appearance);
    localStorage.setItem("iop.language", language);
  }, { appearance, language });
}

async function expectContainedPage(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}

async function expectPageSpacing(main: Locator) {
  const stack = main.locator(".iop-page-stack").first();
  await expect(stack).toBeVisible();
  const layout = await stack.evaluate(element => {
    const gap = parseFloat(getComputedStyle(element).rowGap);
    const rows = Array.from(element.children).map(child => child.getBoundingClientRect()).filter(row => row.height > 0);
    return { gap, spacing: rows.slice(1).map((row, index) => row.top - rows[index].bottom) };
  });
  expect(layout.gap).toBeGreaterThan(0);
  expect(layout.spacing.length).toBeGreaterThan(0);
  // Check the configured shared spacing, allowing subpixel rounding.
  for (const spacing of layout.spacing) expect(spacing).toBeGreaterThanOrEqual(layout.gap - 1);
}

async function capture(page: Page, info: TestInfo, name: string) {
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await info.attach(name, { path, contentType: "image/png" });
}

test("short desktop sidebar keeps all destinations reachable by keyboard and defers analysis rendering", async ({ page }, info) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await configurePresentation(page, "dark");
  const fixture = await installDesktopConsistencyFixture(page);
  const scripts: string[] = [], errors: string[] = [];
  page.on("request", request => { if (request.resourceType() === "script") scripts.push(new URL(request.url()).pathname); });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Main navigation", exact: true });
  const destinations = navigation.getByRole("button");
  await expect(destinations).toHaveCount(14);
  await destinations.first().focus();
  for (let index = 0; index < 14; index++) {
    if (index) await page.keyboard.press("Tab");
    await expect(destinations.nth(index)).toBeFocused();
    const bounds = await destinations.nth(index).evaluate(element => {
      const button = element.getBoundingClientRect(), navigation = element.closest("nav")!.getBoundingClientRect();
      return { top: button.top, bottom: button.bottom, navigationTop: navigation.top, navigationBottom: navigation.bottom, viewportHeight: innerHeight };
    });
    expect(bounds.top).toBeGreaterThanOrEqual(bounds.navigationTop - 1);
    expect(bounds.bottom).toBeLessThanOrEqual(Math.min(bounds.navigationBottom, bounds.viewportHeight) + 1);
  }
  expect(await navigation.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await capture(page, info, "sidebar-1366x768-dark");
  expect(scripts.filter(path => /\/Workspace-[^/]+\.js$/.test(path))).toEqual([]);

  await navigation.getByRole("button", { name: "Workforce & shifts", exact: true }).click();
  const date = page.getByRole("main").getByLabel("Date", { exact: true });
  await expect(date).toHaveAttribute("type", "date");
  await expect(date).toHaveCSS("color-scheme", "dark");
  await expectContainedPage(page);
  await navigation.getByRole("button", { name: "Data analysis", exact: true }).click();
  await expect.poll(() => scripts.filter(path => /\/Workspace-[^/]+\.js$/.test(path)).length).toBeGreaterThan(0);
  await expect(page.getByRole("main").getByRole("heading", { name: "Data analysis", exact: true })).toBeVisible();
  expect(fixture.unexpectedRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test("a failed analysis chunk shows recovery without losing operational navigation", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await configurePresentation(page, "light");
  const fixture = await installDesktopConsistencyFixture(page);
  let blockedChunks = 0;
  await page.route("**/assets/Workspace-*.js", async route => {
    blockedChunks++;
    await route.abort("failed");
  });
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Main navigation", exact: true });
  const main = page.getByRole("main");
  await navigation.getByRole("button", { name: "Data analysis", exact: true }).click();
  await expect(main.getByRole("alert")).toHaveText(
    "The analysis workspace could not be loaded. Reload the page to try again.",
  );
  expect(blockedChunks).toBeGreaterThan(0);
  await expect(main.getByRole("button", { name: "Reload workspace", exact: true })).toBeEnabled();
  await expect(navigation.getByRole("button")).toHaveCount(14);
  await expect(page.getByRole("button", { name: "User menu", exact: true })).toBeVisible();
  await capture(page, info, "analysis-chunk-recovery-1440");
  await navigation.getByRole("button", { name: "Maintenance", exact: true }).click();
  await expect(main.getByRole("heading", { level: 1 })).toContainText("Maintenance");
  await expect(main.getByText("Bearing inspection", { exact: true }).first()).toBeVisible();
  await expect(main.getByRole("alert")).toHaveCount(0);
  await expectContainedPage(page);
  expect(fixture.unexpectedRequests).toEqual([]);
});

for (const { width, appearance } of [
  { width: 1440, appearance: "light" },
  { width: 1920, appearance: "dark" },
  { width: 390, appearance: "dark" },
] as const) {
  test(`operational collections and details share desktop presentation at ${width}px ${appearance}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await configurePresentation(page, appearance);
    const fixture = await installDesktopConsistencyFixture(page);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    const navigation = page.getByRole("navigation", { name: "Main navigation", exact: true });
    const main = page.getByRole("main");

    await navigation.getByRole("button", { name: "Improvements", exact: true }).click();
    const improvements = main.getByRole("table", { name: "Improvement actions", exact: true });
    await expect(improvements.getByRole("row")).toHaveCount(4);
    await expect(improvements.getByRole("columnheader", { name: "Action", exact: true })).toHaveCSS("text-align", "left");
    await expect(improvements.getByRole("columnheader", { name: "Evidence", exact: true })).toHaveCSS("text-align", "right");
    await expect(improvements.getByRole("columnheader", { name: "Status", exact: true })).toHaveCSS("text-align", "center");
    const titleColumn = await improvements.locator('tbody th[scope="row"]').first().boundingBox();
    expect(titleColumn!.width).toBeGreaterThanOrEqual(160);
    await expect(main.getByRole("status")).toHaveText("Showing 3 of 3 actions.");
    await expectPageSpacing(main);
    await expectContainedPage(page);
    await capture(page, info, `improvements-${width}-${appearance}`);
    await main.getByRole("button", { name: "Search improvements", exact: true }).click();
    await main.getByRole("searchbox", { name: "Search improvements", exact: true }).fill("unmatched fixture search");
    await main.getByRole("button", { name: "Apply filters", exact: true }).click();
    await expect(improvements).toContainText("No matching improvement actions.");
    await main.getByRole("button", { name: "Clear filters", exact: true }).click();
    await expect(improvements.getByRole("row")).toHaveCount(4);
    await expect(main.getByRole("searchbox", { name: "Search improvements", exact: true })).toHaveValue("");
    await improvements.getByRole("button", { name: "Reduce repeated guard alarms", exact: true }).click();
    await expect(main.locator(".iop-detail-facts").first()).toContainText("Morgan Administrator");
    await expect(main.getByRole("table", { name: "Improvement evidence", exact: true })).toBeVisible();
    await expectPageSpacing(main);
    await expectContainedPage(page);
    await capture(page, info, `improvement-details-${width}-${appearance}`);

    await navigation.getByRole("button", { name: "Asset management", exact: true }).click();
    const inventory = main.getByRole("table", { name: "Asset model inventory", exact: true });
    await expect(inventory.getByRole("row")).toHaveCount(4);
    await expect(inventory.getByText("Pending", { exact: true })).toBeVisible();
    await expect(inventory.getByText("Validated", { exact: true })).toBeVisible();
    await expect(inventory.getByText("Rejected", { exact: true })).toBeVisible();
    const registered = inventory.getByRole("columnheader", { name: "Registered asset", exact: true });
    await expect(registered).toHaveAttribute("aria-sort", "ascending");
    await registered.getByRole("button").click();
    await expect(registered).toHaveAttribute("aria-sort", "descending");
    await expect(inventory.getByRole("row").nth(1)).toContainText("SENSOR-001");
    await expectPageSpacing(main);
    await expectContainedPage(page);
    await capture(page, info, `asset-inventory-${width}-${appearance}`);
    await main.getByRole("textbox", { name: "Search asset inventory", exact: true }).fill("unmatched fixture search");
    await main.getByRole("button", { name: "Search", exact: true }).click();
    await expect(inventory).toContainText("No assets match this inventory search.");
    await main.getByRole("button", { name: "Clear inventory search", exact: true }).click();
    await expect(inventory.getByRole("row")).toHaveCount(4);
    await inventory.getByRole("button", { name: "SENSOR-001", exact: true }).click();
    await expect(main.locator(".iop-detail-facts")).toContainText("Example Instruments");
    await expect(main.getByRole("table", { name: "Asset model revisions", exact: true })).toBeVisible();
    await expectPageSpacing(main);
    await expectContainedPage(page);
    await capture(page, info, `asset-details-${width}-${appearance}`);

    await navigation.getByRole("button", { name: "Integrations", exact: true }).click();
    await expect(main.getByRole("heading", { name: "Integrations", exact: true })).toBeVisible();
    const wincc = main.locator("details").filter({ has: page.locator("summary", { hasText: "WinCC" }) });
    await expect(wincc).toContainText("Disabled");
    if (await wincc.getAttribute("open") === null) await wincc.locator("summary").click();
    await wincc.getByRole("button", { name: "Configuration history", exact: true }).click();
    await expect(main.getByText("No configuration history recorded yet.", { exact: true })).toBeVisible();
    await wincc.getByRole("button", { name: "Edit configuration", exact: true }).click();
    await expect(main.getByRole("textbox", { name: "Authorized HTTPS endpoint", exact: true })).toBeVisible();
    await expectPageSpacing(main);
    await expectContainedPage(page);
    await capture(page, info, `integration-readiness-${width}-${appearance}`);
    expect(fixture.unexpectedRequests).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("German asset review presents localized states while retaining source identities", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await configurePresentation(page, "light", "de");
  const fixture = await installDesktopConsistencyFixture(page);
  await page.goto("/");
  await page.getByRole("navigation", { name: "Hauptnavigation", exact: true })
    .getByRole("button", { name: "Asset-Verwaltung", exact: true }).click();
  const main = page.getByRole("main"), inventory = main.getByRole("table", { name: "Asset-Modellbestand", exact: true });
  await expect(inventory.getByRole("row")).toHaveCount(4);
  for (const state of ["Ausstehend", "Validiert", "Abgelehnt"]) await expect(inventory.getByText(state, { exact: true })).toBeVisible();
  await expect(inventory.getByRole("button", { name: "SENSOR-001", exact: true })).toBeVisible();
  await expectPageSpacing(main);
  await expectContainedPage(page);
  await capture(page, info, "asset-inventory-1440-german");
  expect(fixture.unexpectedRequests).toEqual([]);
});

import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { installDesktopConsistencyFixture } from "./desktop-consistency-fixture";
import { german } from "../src/localization/de";

async function bounds(locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

async function expectContained(locator: Locator, page: Page) {
  const box = await bounds(locator);
  const viewport = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
}

async function expectContainedPage(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}

async function capture(page: Page, info: TestInfo, name: string) {
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path });
  await info.attach(name, { path, contentType: "image/png" });
}

for (const scenario of [
  { width: 1440, height: 900, appearance: "light", language: "en" },
  { width: 1366, height: 768, appearance: "dark", language: "en" },
  { width: 768, height: 900, appearance: "light", language: "en" },
  { width: 390, height: 844, appearance: "dark", language: "de" },
  { width: 320, height: 844, appearance: "light", language: "en" },
] as const) {
  const { width, height, appearance, language } = scenario;
  test(`header identity and navigation remain aligned and usable at ${width}x${height} ${appearance} ${language}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.addInitScript(({ appearance, language }) => {
      localStorage.setItem("iop.appearance", appearance);
      localStorage.setItem("iop.language", language);
    }, { appearance, language });
    const fixture = await installDesktopConsistencyFixture(page);
    const searchQueries: string[] = [], errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/api/v1/overview/search", async route => {
      const input = route.request().postDataJSON();
      searchQueries.push(input.query);
      await route.fulfill({ json: {
        query: input.query,
        locationId: "",
        groups: [{ source: "assets", view: "search", coverage: "available", total: 1, nextCursor: "", limit: 10,
          items: [{ source: "assets", id: fixture.assetId, locationId: "assembly", title: "Assembly guard sensor",
            summary: "Retained fixture reference", locationLabel: "Assembly", status: "", date: "", assetId: fixture.assetId }] }],
      } });
    });
    await page.goto("/");

    const label = (source: string) => language === "de" ? german[source] ?? source : source;
    const header = page.getByRole("banner");
    const brand = header.getByRole("button", { name: label("IOP · Go to Start"), exact: true });
    const navigation = page.getByRole("navigation", { name: label("Main navigation"), exact: true });
    const account = header.getByRole("button", { name: label("User menu"), exact: true });
    const notifications = header.getByRole("button", { name: label("Notifications"), exact: true });
    const search = header.getByRole("button", { name: label("Global search"), exact: true });
    await expect(navigation.getByRole("button")).toHaveCount(14);
    await expect(page.getByRole("main").getByRole("heading", { name: "Administration", exact: true })).toBeVisible();

    const image = brand.locator("img");
    await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0)).toBe(true);
    const imageBox = await bounds(image), copyBox = await bounds(brand.locator(".iop-brand-copy"));
    expect(Math.abs(imageBox.y + imageBox.height / 2 - copyBox.y - copyBox.height / 2)).toBeLessThanOrEqual(1);
    expect(copyBox.x - imageBox.x - imageBox.width).toBeGreaterThanOrEqual(8);
    const controls = await Promise.all([brand, search, notifications, account].map(bounds));
    const centers = controls.map(box => box.y + box.height / 2);
    expect(Math.max(...centers) - Math.min(...centers)).toBeLessThanOrEqual(1);
    for (const control of [brand, search, notifications, account]) await expectContained(control, page);
    expect((await bounds(navigation)).y).toBeGreaterThanOrEqual((await bounds(header)).height - 1);
    await expectContainedPage(page);

    if (width > 620) {
      const alignment = await navigation.getByRole("button").evaluateAll(buttons => buttons.map(button => {
        const range = document.createRange();
        range.selectNodeContents(button);
        return { x: range.getBoundingClientRect().x, justification: getComputedStyle(button).justifyContent, height: button.getBoundingClientRect().height };
      }));
      const starts = alignment.map(button => button.x);
      expect(Math.max(...starts) - Math.min(...starts)).toBeLessThanOrEqual(1);
      for (const button of alignment) {
        expect(button.justification).toBe("flex-start");
        expect(button.height).toBeGreaterThanOrEqual(44);
      }
    }
    await capture(page, info, "header-navigation");

    // Tab must reveal every destination inside the rail or the narrow horizontal strip.
    const destinations = navigation.getByRole("button");
    await destinations.first().focus();
    for (let index = 0; index < await destinations.count(); index++) {
      if (index) await page.keyboard.press("Tab");
      await expect(destinations.nth(index)).toBeFocused();
      // Chromium can finish its focus-induced scrolling on the next frame.
      // Observe that scrolling; never scroll manually to conceal an unreachable target.
      await expect.poll(() => destinations.nth(index).evaluate(element => {
        const target = element.getBoundingClientRect(), navigation = element.closest("nav")!.getBoundingClientRect();
        return Math.max(navigation.left - target.left, target.right - navigation.right,
          navigation.top - target.top, target.bottom - Math.min(innerHeight, navigation.bottom));
      })).toBeLessThanOrEqual(1);
    }
    if (width <= 620) expect(await navigation.evaluate(node => node.scrollLeft)).toBeGreaterThan(0);
    if (height === 768) expect(await navigation.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    await expectContainedPage(page);

    const maintenance = navigation.getByRole("button", { name: label("Maintenance"), exact: true });
    await maintenance.click();
    await expect(maintenance).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toContainText(label("Maintenance"));
    await brand.click();
    await expect(destinations.first()).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("main").getByRole("heading", { name: "Administration", exact: true })).toBeVisible();

    await account.click();
    const menu = page.getByRole("dialog", { name: label("User menu"), exact: true });
    await expect(menu.getByText("Morgan Administrator", { exact: true })).toBeVisible();
    await expect(menu.getByRole("button", { name: label("My profile"), exact: true })).toBeFocused();
    await expectContained(menu, page);
    await capture(page, info, "account-menu");
    await page.keyboard.press("Escape");
    await expect(account).toBeFocused();
    await expect(menu).toHaveCount(0);

    await search.click();
    const input = header.getByRole("searchbox", { name: label("Global search"), exact: true });
    await expect(input).toBeFocused();
    await input.fill("guard");
    const results = page.getByRole("region", { name: label("Global search results"), exact: true });
    await expect(results.getByRole("button", { name: "Assembly guard sensor", exact: true })).toBeVisible();
    expect(searchQueries).toContain("guard");
    await expectContained(input, page);
    await expectContained(account, page);
    await expectContained(results, page);
    await expectContainedPage(page);
    await capture(page, info, "expanded-search");
    await input.press("Escape");
    await expect(results).toHaveCount(0);
    await expect(search).toBeFocused();
    expect(fixture.unexpectedRequests).toEqual([]);
    expect(errors).toEqual([]);
  });
}

for (const width of [621, 800]) {
  test(`native demo controls wrap without covering the rail at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.addInitScript(() => {
      localStorage.setItem("iop.appearance", "light");
      localStorage.setItem("iop.language", "en");
    });
    const fixture = await installDesktopConsistencyFixture(page);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/api/v1/session/context", route => route.fulfill({ json: {
      enabled: true,
      canImport: true,
      canAdminister: true,
      canReadAnalytics: true,
      user: { id: "admin", name: "Morgan Administrator", profile: "administrator" },
      users: [{ id: "admin", name: "Morgan Administrator" }],
      scope: { organizationId: "org", siteId: "site", siteTimeZone: "UTC" },
    } }));
    await page.goto("/");
    const header = page.getByRole("banner");
    const navigation = page.getByRole("navigation", { name: "Main navigation", exact: true });
    await expect(navigation.getByRole("button")).toHaveCount(14);
    const viewAs = header.getByRole("button", { name: "View as", exact: true });
    await viewAs.click();
    const profile = header.getByRole("combobox", { name: "Profile view", exact: true });
    await expect(profile).toHaveValue("administrator");
    await expect(header.getByRole("combobox", { name: "Demo user", exact: true })).toHaveValue("admin");
    await expect(header.getByRole("button", { name: "User menu", exact: true })).toHaveCount(0);

    for (const control of await header.locator("button, select").all()) {
      const box = await bounds(control);
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      await expectContained(control, page);
    }
    await expect.poll(async () => {
      const banner = await bounds(header), rail = await bounds(navigation);
      return rail.y - banner.y - banner.height;
    }).toBeGreaterThanOrEqual(0);
    await expectContainedPage(page);
    await capture(page, info, "native-demo-expanded-profile");

    // Expanding and closing search changes available header space while View as stays open.
    await header.getByRole("button", { name: "Global search", exact: true }).click();
    const input = header.getByRole("searchbox", { name: "Global search", exact: true });
    await expect(input).toBeFocused();
    await expectContained(input, page);
    await expectContained(profile, page);
    await expect.poll(async () => {
      const banner = await bounds(header), rail = await bounds(navigation);
      return rail.y - banner.y - banner.height;
    }).toBeGreaterThanOrEqual(0);
    await expectContainedPage(page);
    await capture(page, info, "native-demo-expanded-search");
    await input.press("Escape");
    await expect(profile).toBeVisible();
    await expect.poll(async () => {
      const banner = await bounds(header), rail = await bounds(navigation);
      return rail.y - banner.y - banner.height;
    }).toBeGreaterThanOrEqual(0);
    expect(fixture.unexpectedRequests).toEqual([]);
    expect(errors).toEqual([]);
  });
}

import { expect, test } from "@playwright/test";
import { installDesktopConsistencyFixture } from "./desktop-consistency-fixture";
import type { Report, ReportRequest } from "../src/features/analysis/domain/models";

for (const width of [1440, 375]) {
  test(`analytical tabs reuse reports, retain navigation and refresh at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(() => localStorage.setItem("iop.language", "en"));
    await installDesktopConsistencyFixture(page);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    let signedIn = true;
    await page.route("**/api/v1/session/context", route => route.fulfill({ json: {
      enabled: true, authentication: "password", canImport: signedIn, canAdminister: false,
      canReadAnalytics: signedIn, users: [],
      user: signedIn ? { id: "admin", name: "Morgan Administrator", profile: "administrator" } : null,
      scope: { organizationId: "org", siteId: "site", sourceId: "source", siteTimeZone: "UTC" },
    } }));
    await page.route("**/api/v1/auth/logout", route => {
      signedIn = false;
      return route.fulfill({ json: {} });
    });
    await page.route("**/api/v1/auth/login", route => {
      signedIn = true;
      return route.fulfill({ json: {} });
    });
    await page.route("**/api/v1/analytics/availability", route => route.fulfill({ json: {
      dates: ["2026-07-01"], latestDate: "2026-07-01", revision: "dates-1", siteTimeZone: "UTC",
    } }));
    const requests: ReportRequest[] = [];
    await page.route("**/api/v1/analytics/report", route => {
      const selection: ReportRequest = route.request().postDataJSON();
      requests.push(selection);
      const row = { key: selection.dimension === "sector" ? "Halle A" : "Area A", frequency: 12, seconds: 60, minutes: 1, records: 2 };
      const report: Report = {
        selection, revision: "r1", profileVersion: "1", totals: row,
        executive: [], groups: [row], frequencyGroups: [row], durationGroups: [row], groupCount: 1,
        timeline: [{ ...row, period: "2026-07-01" }], series: [{ ...row, period: "2026-07-01" }], monthly: [],
        options: { sector: ["Halle A"], area: ["Area A"] }, optionCounts: {}, dates: ["2026-07-01"],
        records: [], recordCount: 2, page: 1, pageCount: 1, unclassifiedCount: 0,
        monthlyExecutive: { month: "2026-07", importedDays: 1, calendarDays: 31, historicalDays: 1, kpis: [] },
      };
      return route.fulfill({ json: report });
    });
    await page.goto("/");
    const main = page.getByRole("navigation", { name: "Main navigation", exact: true });
    await main.getByRole("button", { name: "Data analysis", exact: true }).click();
    const tabs = page.getByRole("navigation", { name: "Analysis templates", exact: true });
    await expect(page.locator(".analysis-plot svg").first()).toBeVisible();
    await tabs.getByRole("button", { name: "Halle analysis", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Top 10 by frequency · Pareto", exact: true })).toBeVisible();
    await expect(page.locator(".analysis-plot svg").first()).toBeVisible();
    await tabs.getByRole("button", { name: "Bereich analysis", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Frequency and duration over time", exact: true })).toBeVisible();
    await expect(page.locator(".analysis-plot svg").first()).toBeVisible();
    const loaded = requests.length;
    for (let visit = 0; visit < 3; visit++) {
      await tabs.getByRole("button", { name: "Halle analysis", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Top 10 by frequency · Pareto", exact: true })).toBeVisible();
      await tabs.getByRole("button", { name: "Bereich analysis", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Frequency and duration over time", exact: true })).toBeVisible();
    }
    expect(requests).toHaveLength(loaded);
    await page.getByRole("button", { name: "IOP · Go to Start", exact: true }).click();
    await main.getByRole("button", { name: "Data analysis", exact: true }).click();
    await expect(tabs.getByRole("button", { name: "Bereich analysis", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".analysis-plot svg").first()).toBeVisible();
    expect(requests).toHaveLength(loaded);
    await page.getByRole("button", { name: "Refresh history", exact: true }).click();
    await expect.poll(() => requests.length).toBe(loaded + 1);
    await expect(page.locator(".analysis-plot svg").first()).toBeVisible();
    await page.getByRole("button", { name: "User menu", exact: true }).click();
    await page.getByRole("combobox", { name: "Appearance", exact: true }).selectOption(width === 375 ? "dark" : "light");
    await page.getByRole("button", { name: "User menu", exact: true }).click();
    await expect(page.locator(".analysis-plot svg").first()).toBeVisible();
    expect(requests).toHaveLength(loaded + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: info.outputPath("cached-analysis-navigation.png"), fullPage: true });

    await page.getByRole("button", { name: "User menu", exact: true }).click();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("textbox", { name: "Username", exact: true }).fill("admin");
    await page.getByLabel("Password", { exact: true }).fill("synthetic-session-test-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).last().click();
    await main.getByRole("button", { name: "Data analysis", exact: true }).click();
    await expect(tabs.getByRole("button", { name: "Executive Overview", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".analysis-plot svg").first()).toBeVisible();
    expect(requests.length).toBeGreaterThan(loaded + 1);
    expect(errors).toEqual([]);
  });
}

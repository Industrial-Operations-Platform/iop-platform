import { expect, test } from "@playwright/test";
import { installDesktopConsistencyFixture } from "./desktop-consistency-fixture";
import type { Report, ReportRequest } from "../src/features/analysis/domain/models";

for (const width of [1440, 375]) {
  test(`analytical lower filters complete ancestors at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(appearance => {
      localStorage.setItem("iop.language", "en");
      localStorage.setItem("iop.appearance", appearance);
    }, width === 375 ? "dark" : "light");
    await installDesktopConsistencyFixture(page);
    await page.route("**/api/v1/analytics/availability", route => route.fulfill({ json: {
      dates: ["2026-07-01"], latestDate: "2026-07-01", revision: "r", siteTimeZone: "Europe/Zurich",
    } }));
    await page.route("**/api/v1/analytics/report", route => {
      const selection: ReportRequest = route.request().postDataJSON();
      const equipment = selection.filters?.equipment?.[0];
      const area = selection.filters?.area?.[0] ?? (equipment ? "Area " + equipment.slice(-1) : undefined);
      const hall = selection.filters?.sector?.[0] ?? area?.slice(-1);
      const filterAncestors = {
        ...(hall && !selection.filters?.sector?.length ? { sector: [hall] } : {}),
        ...(equipment && !selection.filters?.area?.length ? { area: [area!] } : {}),
      };
      const row = { key: "Area A", frequency: 2, seconds: 120, minutes: 2, records: 2 };
      const report: Report = {
        selection, revision: "r", profileVersion: "1", totals: row,
        executive: [], groups: [row], frequencyGroups: [row], durationGroups: [row], groupCount: 1,
        timeline: [], series: [], monthly: [], filterAncestors,
        options: { sector: ["A", "B"], area: hall ? ["Area " + hall] : ["Area A", "Area B"],
          equipment: hall ? ["=EQ-" + hall] : ["=EQ-A", "=EQ-B"] },
        optionCounts: {}, dates: ["2026-07-01"], records: [], recordCount: 2, page: 1, pageCount: 1, unclassifiedCount: 0,
        monthlyExecutive: { month: "2026-07", importedDays: 1, calendarDays: 31, historicalDays: 1, kpis: [] },
      };
      return route.fulfill({ json: report });
    });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("button", { name: "Data analysis", exact: true }).click();
    const nav = page.getByRole("navigation", { name: "Analysis templates" });
    await nav.getByRole("button", { name: "Bereich analysis", exact: true }).click();
    const panel = page.locator(".analysis-filter-panel");
    await panel.locator("summary").click();
    const field = (name: string) => page.getByRole("combobox", { name: name + " filter", exact: true });
    await field("Bereich").selectOption("Area B");
    await expect(field("Sector / Halle")).toHaveValue("B");
    await expect(page.getByRole("button", { name: "Apply filters", exact: true })).toBeEnabled();
    await expect(panel.locator("summary")).not.toContainText("active");
    await page.getByRole("button", { name: "Apply filters", exact: true }).click();
    await expect(panel.locator("summary")).toContainText("2 active");
    await nav.getByRole("button", { name: "Equipment analysis", exact: true }).click();
    await page.getByRole("button", { name: "Clear filters", exact: true }).click();
    await panel.locator("summary").click();
    await field("Betriebsmittelkennzeichen").selectOption("=EQ-A");
    await expect(field("Sector / Halle")).toHaveValue("A");
    await expect(field("Bereich")).toHaveValue("Area A");
    await expect(page.getByRole("button", { name: "Apply filters", exact: true })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: info.outputPath("completed-filter-ancestors.png"), fullPage: true });
  });
}

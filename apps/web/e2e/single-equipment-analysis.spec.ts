import { expect, test } from "@playwright/test";
import { installDesktopConsistencyFixture } from "./desktop-consistency-fixture";
import type { Report, ReportPoint, ReportRequest } from "../src/features/analysis/domain/models";
import { german } from "../src/localization/de";

for (const scenario of [
  { width: 1440, language: "en", appearance: "light" },
  { width: 375, language: "de", appearance: "dark" },
  { width: 320, language: "en", appearance: "light" },
]) {
  test(`single equipment detail at ${scenario.width}px in ${scenario.language}`, async ({ page }, info) => {
    const translate = (source: string) => scenario.language === "de"
      ? source.replace(source.trim(), german[source.trim()] ?? source.trim()) : source;
    await page.setViewportSize({ width: scenario.width, height: 1000 });
    await page.addInitScript(({ language, appearance }) => {
      localStorage.setItem("iop.language", language);
      localStorage.setItem("iop.appearance", appearance);
    }, scenario);
    await installDesktopConsistencyFixture(page);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    const dates = ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-06", "2026-11-08", "2026-11-09"];
    await page.route("**/api/v1/analytics/availability", route => route.fulfill({ json: {
      dates, latestDate: dates.at(-1), revision: "r1", siteTimeZone: "Europe/Zurich",
    } }));
    const requests: ReportRequest[] = [];
    await page.route("**/api/v1/analytics/report", route => {
      const selection: ReportRequest = route.request().postDataJSON();
      requests.push(selection);
      const empty = selection.filters?.message?.[0] === "No matches";
      const row = { key: "Area A", frequency: empty ? 0 : 12, seconds: empty ? 0 : 1800,
        minutes: empty ? 0 : 30, records: empty ? 0 : 150 };
      const daily: ReportPoint[] = empty ? [] : [
        { ...row, period: "2026-11-02", frequency: 4, seconds: 600, minutes: 10 },
        { ...row, period: "2026-11-06", frequency: 8, seconds: 1200, minutes: 20 },
      ];
      const timeline = selection.period === "day" ? daily : [{ ...row, period: "2026-11-01" }];
      const report: Report = {
        selection, revision: "r1", profileVersion: "1", totals: row,
        executive: empty ? [] : [{ ...row, key: "Guard blocked", dimension: "message", metric: "frequency", frequency: 8 }],
        groups: empty ? [] : [row], frequencyGroups: empty ? [] : [row], durationGroups: empty ? [] : [row], groupCount: empty ? 0 : 1,
        timeline, series: timeline, monthly: [], excludedWeekdays: [7],
        options: { sector: ["Hall A"], area: ["Area A"], equipment: ["SENSOR-001"], message: ["Guard blocked", "No matches"] },
        optionCounts: {}, dates, records: [], recordCount: row.records, page: 1, pageCount: empty ? 0 : 3, unclassifiedCount: 0,
        filterAncestors: selection.filters?.equipment?.length ? { sector: ["Hall A"], area: ["Area A"] } : {},
      };
      return route.fulfill({ json: report });
    });
    await page.goto("/");
    await page.getByRole("navigation", { name: translate("Main navigation"), exact: true })
      .getByRole("button", { name: translate("Data analysis"), exact: true }).click();
    await page.getByRole("navigation", { name: translate("Analysis templates") })
      .getByRole("button", { name: translate("Daily / monthly"), exact: true }).click();
    const heatmap = page.getByRole("heading", { name: translate("Group behavior by reporting period"), exact: true });
    await expect(heatmap).toBeVisible();
    const openFilters = () => page.locator(".analysis-filter-panel summary").click();
    const apply = page.getByRole("button", { name: translate("Apply filters"), exact: true });
    await openFilters();
    await page.getByRole("combobox", { name: translate("Betriebsmittelkennzeichen") + translate(" filter"), exact: true })
      .selectOption("SENSOR-001");
    await expect(apply).toBeEnabled();
    await apply.click();
    const detail = page.locator(".analysis-equipment-detail");
    await expect(detail.getByRole("heading", { name: translate("Equipment detail") + " · SENSOR-001", exact: true })).toBeVisible();
    await expect(heatmap).toHaveCount(0);
    const metric = (label: string) => detail.locator(".iop-panel--metric").filter({
      has: page.locator(".iop-metric-label", { hasText: translate(label) }),
    });
    await expect(metric("Total frequency").locator("strong")).toHaveText("12");
    await expect(metric("Accumulated alarm minutes").locator("strong")).toHaveText("30");
    await expect(metric("Alarm minutes per occurrence").locator("strong")).toHaveText("2.5");
    await expect(metric("Days with activity").locator("strong")).toHaveText("2 / 5");
    await expect(detail).toContainText("2026-11-06");
    await expect(detail).toContainText("Guard blocked");
    await expect(detail.locator(".analysis-plot svg")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: info.outputPath("equipment-detail.png"), fullPage: true });
    await detail.locator(".analysis-data summary").click();
    const table = detail.getByRole("table");
    await expect(table.locator("tbody tr")).toHaveCount(5);
    await expect(table.getByRole("row", { name: "2026-11-03 0 0", exact: true })).toBeVisible();
    await expect(table).not.toContainText("2026-11-05");
    await expect(table).not.toContainText("2026-11-08");
    await detail.locator(".analysis-data summary").click();

    if (scenario.width === 1440) {
      for (const period of ["week", "month"]) {
        await openFilters();
        await page.getByRole("combobox", { name: "Period", exact: true }).selectOption(period);
        await apply.click();
        await expect(metric("Days with activity").locator("strong")).toHaveText("2 / 5");
        await expect.poll(() => requests.some(request => request.period === period &&
          request.filters?.equipment?.[0] === "SENSOR-001")).toBe(true);
        await expect.poll(() => requests.some(request => request.period === "day" && request.revision === "r1" &&
          request.filters?.equipment?.[0] === "SENSOR-001")).toBe(true);
        await expect(detail).toContainText("20 alarm minutes · 2026-11-06");
      }
    }
    await openFilters();
    await page.getByRole("combobox", { name: translate("Meldetext") + translate(" filter"), exact: true }).selectOption("No matches");
    await expect(apply).toBeEnabled();
    await apply.click();
    await expect(detail.getByRole("heading", { name: translate("No matching records"), exact: true })).toBeVisible();
    await expect(metric("Total frequency").locator("strong")).toHaveText("0");
    await expect(metric("Alarm minutes per occurrence").locator("strong")).toHaveText(translate("Unavailable"));
    await page.getByRole("button", { name: translate("Clear filters"), exact: true }).click();
    await expect(detail).toHaveCount(0);
    await expect(heatmap).toBeVisible();
    expect(errors).toEqual([]);
  });
}

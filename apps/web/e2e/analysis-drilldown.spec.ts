import { expect, test } from "@playwright/test";
import { installDesktopConsistencyFixture } from "./desktop-consistency-fixture";
import type { Report, ReportRequest } from "../src/features/analysis/domain/models";

for (const width of [1440, 375]) {
  test(`dependent selects and progressive analysis at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(() => localStorage.setItem("iop.language", "en"));
    await installDesktopConsistencyFixture(page);
    await page.route("**/api/v1/analytics/availability", route => route.fulfill({ json: {
      dates: ["2026-05-01", "2026-07-01"], latestDate: "2026-07-01", revision: "r", siteTimeZone: "Europe/Zurich",
    } }));
    const requests: ReportRequest[] = [];
    await page.route("**/api/v1/analytics/report", route => {
      const selection: ReportRequest = route.request().postDataJSON();
      requests.push(selection);
      const hall = selection.filters?.sector?.[0] ?? "A";
      const empty = selection.months?.length === 1 && selection.months[0] === "2026-05" && selection.filters?.equipment?.[0] === "=EQ-B";
      const key = { sector: "A", area: `Area ${hall}`, equipment: `=EQ-${hall}`, message: "Alarm", type: "01", messageGroup: "001", frequency: "1", duration: "60" }[selection.dimension];
      const row = { key, frequency: empty ? 0 : 1, seconds: empty ? 0 : 60, minutes: empty ? 0 : 1, records: empty ? 0 : 1 };
      const groups = empty ? [] : [row];
      const report: Report = {
        selection, revision: "r", profileVersion: "1", totals: row,
        executive: [], groups, frequencyGroups: groups, durationGroups: groups, groupCount: groups.length,
        timeline: [], series: [], monthly: [],
        options: empty ? {} : { sector: ["A", "B"], area: [`Area ${hall}`], equipment: [`=EQ-${hall}`], message: ["Alarm"], type: ["01"], messageGroup: ["001"] },
        optionCounts: {}, dates: ["2026-07-01"], records: [], recordCount: row.records, page: 1, pageCount: empty ? 0 : 1, unclassifiedCount: 0,
        monthlyExecutive: { month: "2026-07", importedDays: 1, calendarDays: 31, historicalDays: 2, kpis: [] },
      };
      return route.fulfill({ json: report });
    });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("button", { name: "Data analysis", exact: true }).click();
    const nav = page.getByRole("navigation", { name: "Analysis templates" });
    const drill = async (value: string, target: string) => {
      await page.locator(".analysis-data summary").click();
      await page.locator(".analysis-data").getByRole("button", { name: value, exact: true }).click();
      await expect(nav.getByRole("button", { name: target, exact: true })).toHaveAttribute("aria-pressed", "true");
    };
    await drill("Area A", "Equipment analysis");
    await expect.poll(() => requests.at(-1)?.filters).toEqual({ area: ["Area A"] });
    await expect.poll(() => requests.at(-1)?.dimension).toBe("equipment");

    await nav.getByRole("button", { name: "Halle analysis", exact: true }).click();
    await page.locator(".analysis-filter-panel summary").click();
    await page.getByRole("checkbox", { name: "May 2026" }).check();
    await page.getByRole("button", { name: "Apply filters", exact: true }).click();
    await drill("A", "Bereich analysis");
    await page.locator(".analysis-filter-panel summary").click();
    await expect(page.getByRole("combobox", { name: "Sector / Halle filter", exact: true })).toHaveValue("A");
    await page.getByRole("combobox", { name: "Sector / Halle filter", exact: true }).selectOption("B");
    const area = page.getByRole("combobox", { name: "Bereich filter", exact: true });
    await expect(area).toBeEnabled();
    await expect(area.locator("option")).toHaveText(["All", "Area B"]);
    await area.selectOption("Area B");
    await page.getByRole("button", { name: "Apply filters", exact: true }).click();
    await drill("Area B", "Equipment analysis");
    await expect.poll(() => requests.at(-1)?.filters).toEqual({ sector: ["B"], area: ["Area B"] });
    await drill("=EQ-B", "Error analysis");
    await expect.poll(() => requests.at(-1)?.filters).toEqual({ sector: ["B"], area: ["Area B"], equipment: ["=EQ-B"] });
    await expect.poll(() => requests.at(-1)?.months).toEqual(["2026-05", "2026-07"]);
    await page.locator(".analysis-filter-panel summary").click();
    for (const name of ["Sector / Halle", "Bereich", "Betriebsmittelkennzeichen", "Meldetext", "Typ"]) {
      await expect(page.getByRole("combobox", { name: name + " filter", exact: true })).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: info.outputPath("dependent-analysis-filters.png"), fullPage: true });
    await page.getByRole("checkbox", { name: "July 2026" }).uncheck();
    for (const [name, value] of [["Sector / Halle", "B"], ["Bereich", "Area B"], ["Betriebsmittelkennzeichen", "=EQ-B"]]) {
      await expect(page.getByRole("combobox", { name: name + " filter", exact: true })).toHaveValue(value);
    }
    const apply = page.getByRole("button", { name: "Apply filters", exact: true });
    await expect(apply).toBeEnabled();
    await apply.click();
    await expect(page.getByRole("heading", { name: "No matching records", exact: true })).toBeVisible();
    await page.locator(".analysis-filter-panel summary").click();
    const equipment = page.getByRole("combobox", { name: "Betriebsmittelkennzeichen filter", exact: true });
    await expect(equipment).toHaveValue("=EQ-B");
    await expect(equipment).toBeEnabled();
    await page.screenshot({ path: info.outputPath("month-filters-retained-empty.png"), fullPage: true });
    await page.getByRole("checkbox", { name: "July 2026" }).check();
    await expect(equipment).toHaveValue("=EQ-B");
    await expect(apply).toBeEnabled();
    await apply.click();
    await expect(page.getByRole("heading", { name: "No matching records", exact: true })).toHaveCount(0);
    await expect.poll(() => requests.at(-1)?.filters).toEqual({ sector: ["B"], area: ["Area B"], equipment: ["=EQ-B"] });
    await expect.poll(() => requests.at(-1)?.months).toEqual(["2026-05", "2026-07"]);
  });
}

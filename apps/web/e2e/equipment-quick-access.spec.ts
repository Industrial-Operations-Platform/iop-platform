import { expect, test } from "@playwright/test";
import { installDesktopConsistencyFixture } from "./desktop-consistency-fixture";
import type { Report, ReportRequest } from "../src/features/analysis/domain/models";
import { german } from "../src/localization/de";

for (const scenario of [
  { width: 1440, language: "en", appearance: "light" },
  { width: 375, language: "de", appearance: "dark" },
  { width: 320, language: "en", appearance: "light" },
]) test(`equipment quick access at ${scenario.width}px in ${scenario.language}`, async ({ page }, info) => {
  const translate = (source: string) => scenario.language === "de" ?
    source.replace(source.trim(), german[source.trim()] ?? source.trim()) : source;
  const monthName = (month: string) => new Intl.DateTimeFormat(scenario.language === "de" ? "de-CH" : "en-GB",
    { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));
  await page.setViewportSize({ width: scenario.width, height: 1000 });
  await page.addInitScript(({ language, appearance }) => {
    localStorage.setItem("iop.language", language);
    localStorage.setItem("iop.appearance", appearance);
  }, scenario);
  await installDesktopConsistencyFixture(page);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const dates = ["2025-01-02", "2026-11-02", "2026-11-03"];
  await page.route("**/api/v1/analytics/availability", route => route.fulfill({ json: {
    dates, latestDate: dates.at(-1), revision: "r1", siteTimeZone: "Europe/Zurich",
  } }));
  const reports: ReportRequest[] = [], searches: string[] = [];
  await page.route("**/api/v1/analytics/report", route => {
    const selection: ReportRequest = route.request().postDataJSON();
    reports.push(selection);
    const row = { key: "Area B", frequency: 12, seconds: 1800, minutes: 30, records: 20 };
    const timeline = [{ ...row, period: "2026-11-02" }];
    const report: Report = {
      selection, revision: "r1", profileVersion: "1", totals: row,
      executive: [{ ...row, dimension: "area", metric: "frequency" }],
      groups: [row], frequencyGroups: [row], durationGroups: [row], groupCount: 1,
      timeline, series: timeline, monthly: [], excludedWeekdays: [7],
      options: { sector: ["Hall A", "Hall B"], area: ["Area A", "Area B"],
        equipment: ["SENSOR-001"], message: ["Jam", "Guard blocked"] },
      optionCounts: {}, dates, records: [], recordCount: 20, page: 1, pageCount: 1, unclassifiedCount: 0,
    };
    return route.fulfill({ json: report });
  });
  await page.route("**/api/v1/analytics/equipment-search", route => {
    const { search } = route.request().postDataJSON();
    searches.push(search);
    return route.fulfill({ json: { values: search === "missing" ? [] : [
      { code: "SENSOR-001", sector: "Hall A", area: "Area A" },
      { code: "SENSOR-001", sector: "Hall B", area: "Area B" },
    ], more: false } });
  });
  await page.goto("/");
  await page.getByRole("navigation", { name: translate("Main navigation"), exact: true })
    .getByRole("button", { name: translate("Data analysis"), exact: true }).click();
  const find = page.getByRole("button", { name: translate("Find equipment"), exact: true });
  await expect(page.locator(".analysis-filters summary")).toBeVisible();
  await expect.poll(() => reports.length).toBeGreaterThan(0);
  await expect(page.getByText(translate("Loading historical analysis…"), { exact: true })).toHaveCount(0);
  const before = reports.length;
  await find.click();
  const dialog = page.getByRole("dialog", { name: translate("Find equipment"), exact: true });
  const input = dialog.getByRole("combobox", { name: translate("Equipment code"), exact: true });
  await expect(input).toBeFocused();
  expect(searches).toEqual([]);
  expect(reports.length).toBe(before);
  await input.fill("missing");
  await expect(dialog.getByRole("status")).toContainText(translate("No equipment matches this code."));
  expect(reports.length).toBe(before);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(find).toBeFocused();

  const tabs = page.getByRole("navigation", { name: translate("Analysis templates"), exact: true });
  await tabs.getByRole("button", { name: translate("Daily / monthly"), exact: true }).click();
  const filters = page.locator(".analysis-filter-panel");
  await filters.locator("summary").click();
  await page.getByRole("button", { name: translate("Choose months"), exact: true }).click();
  const picker = page.getByRole("dialog", { name: translate("Choose months"), exact: true });
  await picker.getByRole("combobox", { name: translate("Year"), exact: true }).selectOption("2025");
  await picker.getByRole("checkbox", { name: monthName("2025-01"), exact: true }).check();
  await picker.getByRole("button", { name: translate("Done"), exact: true }).click();
  await page.getByRole("combobox", { name: translate("Meldetext") + translate(" filter"), exact: true }).selectOption("Jam");
  const apply = page.getByRole("button", { name: translate("Apply filters"), exact: true });
  await expect(apply).toBeEnabled();
  await apply.click();
  await expect.poll(() => reports.at(-1)?.filters?.message).toEqual(["Jam"]);
  const beforeSelect = reports.length;
  await find.click();
  await input.fill("SENSOR");
  await expect(dialog.getByRole("option")).toHaveCount(2);
  expect(reports.length).toBe(beforeSelect);
  await expect(dialog).toContainText("2025-01, 2026-11");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("equipment-search.png"), fullPage: true });
  await dialog.screenshot({ path: info.outputPath("equipment-search-dialog.png") });
  await input.press("ArrowDown");
  await input.press("ArrowDown");
  await expect(dialog.getByRole("option").nth(1)).toHaveAttribute("aria-selected", "true");
  await input.press("Enter");
  await expect(dialog).toHaveCount(0);
  const detail = page.locator(".analysis-equipment-detail");
  await expect(detail.getByRole("heading", { name: translate("Equipment detail") + " · SENSOR-001", exact: true })).toBeVisible();
  await expect(detail).toContainText("Area B");
  await expect.poll(() => reports.at(-1)?.filters).toEqual({ sector: ["Hall B"], area: ["Area B"], equipment: ["SENSOR-001"] });
  expect(reports.at(-1)?.months).toEqual(["2025-01", "2026-11"]);
  await expect(tabs.getByRole("button", { name: translate("Daily / monthly"), exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({ path: info.outputPath("equipment-search-result.png"), fullPage: true });
  await filters.locator("summary").click();
  await page.getByRole("combobox", { name: translate("Meldetext") + translate(" filter"), exact: true }).selectOption("Guard blocked");
  await expect(apply).toBeEnabled();
  await apply.click();
  await expect.poll(() => reports.at(-1)?.filters?.message).toEqual(["Guard blocked"]);
  expect(reports.at(-1)?.filters?.equipment).toEqual(["SENSOR-001"]);
  expect(errors).toEqual([]);
});

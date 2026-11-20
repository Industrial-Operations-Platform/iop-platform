import { expect, test } from "@playwright/test";
import { installDesktopConsistencyFixture } from "./desktop-consistency-fixture";
import type { Report, ReportRequest } from "../src/features/analysis/domain/models";
import { german } from "../src/localization/de";

for (const scenario of [
  { width: 1440, language: "en", appearance: "light" },
  { width: 375, language: "de", appearance: "dark" },
  { width: 320, language: "en", appearance: "light" },
]) {
  test(`36-month year picker preserves cross-year analysis at ${scenario.width}px`, async ({ page }, info) => {
    const translate = (source: string) => scenario.language === "de"
      ? source.replace(source.trim(), german[source.trim()] ?? source.trim()) : source;
    const monthName = (month: string) => new Intl.DateTimeFormat(scenario.language === "de" ? "de-CH" : "en-GB", {
      month: "long", year: "numeric", timeZone: "UTC",
    }).format(new Date(month + "-01T00:00:00Z"));
    await page.setViewportSize({ width: scenario.width, height: 1000 });
    await page.addInitScript(({ language, appearance }) => {
      localStorage.setItem("iop.language", language);
      localStorage.setItem("iop.appearance", appearance);
    }, scenario);
    await installDesktopConsistencyFixture(page);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    const months = Array.from({ length: 36 }, (_, index) => `${2024 + Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, "0")}`);
    const dates = months.map(month => month + "-01");
    await page.route("**/api/v1/analytics/availability", route => route.fulfill({ json: {
      dates, latestDate: dates.at(-1), revision: "r1", siteTimeZone: "Europe/Zurich",
    } }));
    const requests: ReportRequest[] = [];
    await page.route("**/api/v1/analytics/report", route => {
      const selection: ReportRequest = route.request().postDataJSON();
      requests.push(selection);
      const key = selection.dimension === "equipment" ? "EQ-1" : selection.dimension === "message" ? "Guard" : "Area A";
      const row = { key, frequency: 12, seconds: 600, minutes: 10, records: 2 };
      const selected = dates.filter(date => selection.months?.includes(date.slice(0, 7)) ??
        (date >= selection.from && date < selection.toExclusive));
      const report: Report = {
        selection, revision: "r1", profileVersion: "1", totals: row, groups: [row], frequencyGroups: [row], durationGroups: [row], groupCount: 1,
        executive: [], timeline: selected.map(period => ({ ...row, period })),
        series: selected.map(period => ({ ...row, period })), monthly: (selection.months ?? []).map(period => ({ ...row, period })),
        options: { sector: ["Hall A"], area: ["Area A"], equipment: ["EQ-1"], message: ["Guard"] }, optionCounts: {}, dates,
        records: [], recordCount: 2, page: 1, pageCount: 1, unclassifiedCount: 0,
        filterAncestors: selection.filters?.equipment?.length ? { sector: ["Hall A"], area: ["Area A"] } : {},
      };
      return route.fulfill({ json: report });
    });
    await page.goto("/");
    await page.getByRole("navigation", { name: translate("Main navigation"), exact: true })
      .getByRole("button", { name: translate("Data analysis"), exact: true }).click();
    const tabs = page.getByRole("navigation", { name: translate("Analysis templates"), exact: true });
    await tabs.getByRole("button", { name: translate("Equipment analysis"), exact: true }).click();
    await page.getByRole("button", { name: translate("Clear filters"), exact: true }).click();
    const filters = page.locator(".analysis-filter-panel");
    await expect(filters.locator("summary")).toContainText("36");
    expect((await filters.locator("summary").innerText()).length).toBeLessThan(90);
    await filters.locator("summary").click();
    await page.getByRole("combobox", { name: translate("Betriebsmittelkennzeichen") + translate(" filter"), exact: true }).selectOption("EQ-1");
    const apply = page.getByRole("button", { name: translate("Apply filters"), exact: true });
    await expect(apply).toBeEnabled();
    await apply.click();
    await expect.poll(() => requests.at(-1)?.filters?.equipment).toEqual(["EQ-1"]);
    await filters.locator("summary").click();
    const trigger = page.getByRole("button", { name: translate("Choose months"), exact: true });
    await trigger.click();
    const picker = page.getByRole("dialog", { name: translate("Choose months"), exact: true });
    const year = picker.getByRole("combobox", { name: translate("Year"), exact: true });
    await expect(year).toHaveValue("2026");
    await expect(picker.locator(".iop-month-choices input")).toHaveCount(12);
    await picker.getByRole("button", { name: translate("Clear month selection"), exact: true }).click();
    await expect(apply).toBeDisabled();
    await expect(page.getByRole("alert")).toHaveText(translate("Select at least one month."));
    const january = picker.getByRole("checkbox", { name: monthName("2026-01"), exact: true });
    await january.focus();
    await page.keyboard.press("Space");
    await expect(january).toBeChecked();
    await year.selectOption("2025");
    await picker.getByRole("checkbox", { name: monthName("2025-11"), exact: true }).check();
    await year.selectOption("2024");
    await picker.getByRole("checkbox", { name: monthName("2024-05"), exact: true }).check();
    await year.selectOption("2026");
    await expect(january).toBeChecked();
    const bounds = (await picker.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(scenario.width);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(1000);
    if (scenario.width > 1050) expect(Math.abs(bounds.x - (await trigger.boundingBox())!.x)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: info.outputPath("year-month-picker.png"), fullPage: true });
    await picker.screenshot({ path: info.outputPath("year-month-picker-control.png") });
    await january.focus();
    await page.keyboard.press("Escape");
    await expect(picker).toHaveCount(0);
    await expect(trigger).toBeFocused();
    const equipment = page.getByRole("combobox", { name: translate("Betriebsmittelkennzeichen") + translate(" filter"), exact: true });
    await expect(equipment).toHaveValue("EQ-1");
    await expect(apply).toBeEnabled();
    await apply.click();
    const selected = ["2024-05", "2025-11", "2026-01"];
    await expect(filters.locator("summary")).toContainText(selected.join(", "));
    await expect.poll(() => requests.at(-1)?.months).toEqual(selected);
    await expect.poll(() => requests.at(-1)?.filters?.equipment).toEqual(["EQ-1"]);
    for (const view of ["Error analysis", "Daily / monthly"]) {
      await tabs.getByRole("button", { name: translate(view), exact: true }).click();
      await expect(filters.locator("summary")).toContainText(selected.join(", "));
      await expect.poll(() => requests.at(-1)?.months).toEqual(selected);
    }
    await page.getByRole("button", { name: translate("Clear filters"), exact: true }).click();
    await expect(filters.locator("summary")).toContainText("36");
    await expect.poll(() => requests.at(-1)?.months).toHaveLength(36);
    await expect.poll(() => requests.at(-1)?.filters).toEqual({});
    expect(errors).toEqual([]);
  });
}

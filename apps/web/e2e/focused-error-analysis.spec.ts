import { expect, test } from "@playwright/test";
import { installDesktopConsistencyFixture } from "./desktop-consistency-fixture";
import type { Report, ReportRequest } from "../src/features/analysis/domain/models";
import { german } from "../src/localization/de";

for (const scenario of [
  { width: 1440, language: "en", appearance: "light" },
  { width: 375, language: "de", appearance: "dark" },
]) {
  test(`focused errors and labelled point hover at ${scenario.width}px`, async ({ page }, info) => {
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
    const dates = ["2026-11-02", "2026-11-03", "2026-11-06", "2026-11-08", "2026-11-09"];
    await page.route("**/api/v1/analytics/availability", route => route.fulfill({ json: {
      dates, latestDate: dates.at(-1), revision: "r1", siteTimeZone: "Europe/Zurich",
    } }));
    await page.route("**/api/v1/analytics/report", route => {
      const selection: ReportRequest = route.request().postDataJSON();
      const equipment = selection.filters?.equipment?.[0] ?? "SENSOR-THREE";
      const count = { "SENSOR-ONE": 1, "SENSOR-TWO": 2, "SENSOR-THREE": 3, "SENSOR-EMPTY": 0 }[equipment] ?? 3;
      let groups = [
        { key: "Guard blocked", frequency: 125, seconds: 36390, minutes: 606.5, records: 150 },
        { key: "Communication <input>", frequency: 25, seconds: 600, minutes: 10, records: 50 },
        { key: "Motor protection", frequency: 50, seconds: 6000, minutes: 100, records: 50 },
      ].slice(0, count);
      if (selection.filters?.message?.length) groups = groups.filter(row => selection.filters!.message.includes(row.key));
      const totals = groups.reduce((sum, row) => ({ key: "", frequency: sum.frequency + row.frequency,
        seconds: sum.seconds + row.seconds, minutes: sum.minutes + row.minutes, records: sum.records + row.records }),
      { key: "", frequency: 0, seconds: 0, minutes: 0, records: 0 });
      const report: Report = {
        selection, revision: "r1", profileVersion: "1", totals,
        groups, frequencyGroups: groups, durationGroups: groups, groupCount: groups.length,
        executive: groups.length ? [{ ...groups[0], dimension: "message", metric: "frequency" }] : [],
        timeline: groups.length ? [{ ...totals, period: "2026-11-02" }] : [],
        series: groups.map(row => ({ ...row, period: "2026-11-02" })),
        monthly: groups.map(row => ({ ...row, period: "2026-11" })), excludedWeekdays: [7],
        options: { sector: ["Hall A"], area: ["Area A"],
          equipment: ["SENSOR-ONE", "SENSOR-TWO", "SENSOR-THREE", "SENSOR-EMPTY"],
          message: ["Guard blocked", "Communication <input>", "Motor protection"] }, optionCounts: {}, dates,
        records: [], recordCount: totals.records, page: 1, pageCount: Math.ceil(totals.records / 50), unclassifiedCount: 0,
        filterAncestors: selection.filters?.equipment?.length ? { sector: ["Hall A"], area: ["Area A"] } : {},
      };
      return route.fulfill({ json: report });
    });
    await page.goto("/");
    await page.getByRole("navigation", { name: translate("Main navigation"), exact: true })
      .getByRole("button", { name: translate("Data analysis"), exact: true }).click();
    const tabs = page.getByRole("navigation", { name: translate("Analysis templates") });
    await tabs.getByRole("button", { name: translate("Error analysis"), exact: true }).click();
    const chooseEquipment = async (value: string) => {
      await page.locator(".analysis-filter-panel summary").click();
      await page.getByRole("combobox", { name: translate("Betriebsmittelkennzeichen") + translate(" filter"), exact: true }).selectOption(value);
      const apply = page.getByRole("button", { name: translate("Apply filters"), exact: true });
      await expect(apply).toBeEnabled();
      await apply.click();
    };
    const detail = page.locator(".analysis-error-detail");
    const pareto = page.getByRole("heading", { name: translate("Top 10 by frequency · Pareto"), exact: true });
    await expect(pareto).toBeVisible();
    for (const [equipment, count, frequency] of [["SENSOR-ONE", 1, "125"], ["SENSOR-TWO", 2, "150"]] as const) {
      await chooseEquipment(equipment);
      await expect(detail.getByRole("heading", { name: translate("Error details"), exact: true })).toBeVisible();
      await expect(detail.locator(".analysis-error-summaries > section")).toHaveCount(count);
      await expect(detail.locator(".iop-panel--metric").first().locator("strong")).toHaveText(frequency);
      await expect(pareto).toHaveCount(0);
      await expect(page.locator(".analysis-plot")).toHaveCount(1);
      const plot = detail.locator(".analysis-plot");
      await expect(plot.locator("svg")).toBeVisible();
      await plot.scrollIntoViewIfNeeded();
      const points = await plot.locator("svg path").evaluateAll(paths => paths.map(path => {
        const bounds = path.getBoundingClientRect();
        return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
      }).filter(bounds => bounds.width >= 11 && bounds.width <= 13 && bounds.height >= 11 && bounds.height <= 13));
      expect(points).toHaveLength(count);
      const point = points[0];
      await page.mouse.move(point.x + point.width / 2, point.y + point.height / 2);
      await expect(plot.getByText("Guard blocked", { exact: true })).toBeVisible();
      await expect(plot.getByText(translate("Frequency"), { exact: true })).toHaveCount(2);
      await expect(plot.getByText(translate("Duration (minutes)"), { exact: true })).toHaveCount(2);
      await expect(plot.getByText("125", { exact: true })).toBeVisible();
      await expect(plot.getByText("606.5", { exact: true })).toBeVisible();
      await expect(plot.getByText("0", { exact: true })).toHaveCount(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.screenshot({ path: info.outputPath(`focused-${count}-errors.png`), fullPage: true,
        style: ".iop-view-navigation--bottom { visibility: hidden; }" });
      await plot.screenshot({ path: info.outputPath(`tooltip-${count}-errors.png`) });
      if (count === 2) {
        const second = points[1];
        await page.mouse.move(second.x + second.width / 2, second.y + second.height / 2);
        await expect(plot.getByText("Communication <input>", { exact: true })).toBeVisible();
        await expect(plot.locator("input")).toHaveCount(0);
        await expect(plot.getByText("25", { exact: true })).toBeVisible();
        await expect(plot.getByText("10", { exact: true })).toBeVisible();
      }
      await page.mouse.move(0, 0);
    }
    await chooseEquipment("SENSOR-THREE");
    await expect(detail).toHaveCount(0);
    await expect(pareto).toBeVisible();
    await expect(page.locator(".analysis-plot")).toHaveCount(4);
    await chooseEquipment("SENSOR-EMPTY");
    await expect(page.getByRole("heading", { name: translate("No matching records"), exact: true })).toBeVisible();
    await expect(detail).toHaveCount(0);
    await chooseEquipment("SENSOR-ONE");
    await expect(detail).toBeVisible();
    await page.locator(".analysis-data summary").click();
    await page.locator(".analysis-data").getByRole("button", { name: "Guard blocked", exact: true }).click();
    await expect(tabs.getByRole("button", { name: translate("Daily / monthly"), exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: translate("Equipment detail") + " · SENSOR-ONE", exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

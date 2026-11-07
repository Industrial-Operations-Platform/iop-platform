import { expect, test } from "@playwright/test";
import { installDesktopConsistencyFixture } from "./desktop-consistency-fixture";
import type { Report, ReportRequest } from "../src/features/analysis/domain/models";
import { german } from "../src/localization/de";

for (const width of [320, 390, 768, 1280, 1440, 1920]) {
  test(`monthly chart and retractable navigation at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(appearance => {
      localStorage.setItem("iop.language", "de");
      localStorage.setItem("iop.appearance", appearance);
    }, width === 768 ? "dark" : "light");
    await installDesktopConsistencyFixture(page);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    const dates = Array.from({ length: 30 }, (_, i) => `2026-09-${String(i + 1).padStart(2, "0")}`);
    await page.route("**/api/v1/analytics/availability", route => route.fulfill({ json: {
      dates: ["2026-05-01", ...dates], latestDate: dates.at(-1), revision: "layout", siteTimeZone: "Europe/Zurich",
    } }));
    await page.route("**/api/v1/analytics/report", route => {
      const selection: ReportRequest = route.request().postDataJSON();
      const groups = ["Bereich A", "Bereich B"].map((key, i) => ({
        key, frequency: 800 - i * 200, minutes: 300 - i * 100, seconds: 18000 - i * 6000, records: 30,
      }));
      const report: Report = {
        selection, revision: "layout", profileVersion: "1", totals: groups[0], executive: [],
        groups, frequencyGroups: groups, durationGroups: groups, groupCount: 2,
        timeline: dates.map((period, i) => ({ ...groups[0], period, frequency: 3000 + (i % 5) * 400, minutes: 10000 + (i % 7) * 1000 })),
        series: dates.flatMap(period => groups.map(group => ({ ...group, period }))), monthly: [],
        options: {}, optionCounts: {}, dates, records: [], recordCount: 0, page: 1, pageCount: 1, unclassifiedCount: 0,
        monthlyExecutive: {
          month: "2026-09", importedDays: 30, calendarDays: 30, historicalDays: 100,
          kpis: ["Lichtschranke zu lange belegt", "Fehlerquote an Update zu hoch", "Sammelstörung", "Volumenreduzierer: Sammelstörung"].map((label, i) => ({
            id: String(i), label, message: label, metric: "frequency", goal: null,
            total: 17783 + i * 1000, average: 683.96 - i * 100, historicalAverage: 626.42 - i * 50, reference: 626.42 - i * 50,
            referenceKind: "historical", changePercent: 9.19, status: "worse",
          })),
        },
      };
      if (selection.from === "2026-05-01") {
        report.dates = ["2026-05-01"];
        report.timeline = [{ ...groups[0], period: "2026-05-01" }];
        report.monthlyExecutive = { ...report.monthlyExecutive!, month: "2026-05", importedDays: 1,
          historicalDays: 31, historicalFrom: "2026-05-01", historicalToExclusive: "2026-10-01",
          kpis: report.monthlyExecutive!.kpis.map((kpi, i) => ({ ...kpi,
            goal: i === 1 ? 500 : null, reference: i === 1 ? 500 : kpi.historicalAverage,
            referenceKind: i === 1 ? "goal" : "historical", status: "worse", changePercent: i === 1 ? 16.79 : kpi.changePercent,
          })),
        };
      }
      return route.fulfill({ json: report });
    });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Hauptnavigation", exact: true })
      .getByRole("button", { name: "Datenanalyse", exact: true }).click();
    const plot = page.locator(".analysis-executive-summary .analysis-plot");
    await expect(plot.locator("svg")).toBeVisible();
    const initial = (await plot.boundingBox())!;
    expect(initial.height).toBe(360);
    const kpis = page.locator(".analysis-executive-kpis");
    const chartCard = page.locator(".analysis-executive-summary > .iop-panel--chart:not(.analysis-executive-kpis)");
    const expectMatchingCards = async () => {
      const chartBox = (await chartCard.boundingBox())!;
      const kpiBox = (await kpis.boundingBox())!;
      expect(Math.abs(kpiBox.y - chartBox.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(kpiBox.height - chartBox.height)).toBeLessThanOrEqual(1);
      expect(await kpis.evaluate(element => getComputedStyle(element).backgroundColor))
        .toBe(await chartCard.evaluate(element => getComputedStyle(element).backgroundColor));
      const heading = await chartCard.locator(":scope > h2").evaluate(element => {
        const style = getComputedStyle(element);
        return [style.fontSize, style.fontWeight, style.textAlign];
      });
      expect(await kpis.locator(":scope > h2").evaluate(element => {
        const style = getComputedStyle(element);
        return [style.fontSize, style.fontWeight, style.textAlign];
      })).toEqual(heading);
      const filled = await kpis.evaluate(element => {
        const grid = element.querySelector(".analysis-kpis")!.getBoundingClientRect();
        const cards = [...element.querySelectorAll(".iop-comparison")].map(card => card.getBoundingClientRect());
        const bounds = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return Math.abs(grid.bottom - (bounds.bottom - parseFloat(style.paddingBottom) - 1)) < 2 &&
          Math.abs(Math.max(...cards.map(card => card.bottom)) - grid.bottom) < 2 &&
          Math.max(...cards.map(card => card.height)) - Math.min(...cards.map(card => card.height)) < 2;
      });
      expect(filled).toBe(true);
      for (const card of await kpis.locator(".iop-comparison").all()) {
        const label = (await card.locator(".iop-metric-label").boundingBox())!;
        const value = (await card.locator(".iop-metric-value").boundingBox())!;
        expect(value.x).toBeGreaterThan(label.x + label.width);
      }
    };
    await expect(kpis.locator(".iop-comparison")).toHaveCount(4);
    const triggers = kpis.getByRole("button", { name: /^Details anzeigen:/ });
    await expect(triggers).toHaveCount(4);
    await expect(triggers.first()).toHaveAttribute("title", "Details anzeigen");
    await expect(triggers.first()).toHaveAttribute("aria-expanded", "false");
    await expect(kpis.getByText("Monatssumme", { exact: true })).toHaveCount(0);
    const averages = page.getByRole("note", { name: "Monatsdurchschnitt pro importiertem Tag" });
    await expect(averages.getByRole("group", { name: "Häufigkeit", exact: true })).toContainText("Ø 3'800");
    await expect(averages.getByRole("group", { name: "Alarmminuten", exact: true })).toContainText("Ø 12'833.33");
    expect(await averages.evaluate(element => {
      const frequency = element.querySelector<HTMLElement>('[data-series="frequency"]')!;
      const minutes = element.querySelector<HTMLElement>('[data-series="minutes"]')!;
      return frequency.getBoundingClientRect().right <= minutes.getBoundingClientRect().left &&
        getComputedStyle(frequency).color !== getComputedStyle(minutes).color &&
        getComputedStyle(minutes).textAlign === "right";
    })).toBe(true);
    if (width > 1050) {
      expect(await kpis.evaluate(element => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
      expect(await kpis.evaluate(element => {
        const bounds = element.getBoundingClientRect();
        return [...element.querySelectorAll(".iop-metric-value")].every(value => value.getBoundingClientRect().bottom <= bounds.bottom);
      })).toBe(true);
    }
    if (width > 1050) {
      const comparison = (await kpis.boundingBox())!;
      expect(initial.width).toBeGreaterThan(comparison.width);
      expect(initial.width).toBeGreaterThan(initial.height);
      expect(comparison.x).toBeGreaterThan(initial.x + initial.width);
      await expectMatchingCards();
    }

    // Keep the active report mounted while collapsing; ECharts must resize with it.
    await page.getByRole("button", { name: "Navigation ausblenden", exact: true }).click();
    await expect(page.getByRole("navigation", { name: "Hauptnavigation", exact: true })).toBeHidden();
    const show = page.getByRole("button", { name: "Navigation einblenden", exact: true });
    await expect(show).toHaveAttribute("aria-expanded", "false");
    if (width > 620) {
      await expect.poll(async () => (await plot.boundingBox())!.width).toBeGreaterThan(initial.width);
      const bottom = page.locator(".iop-view-navigation--bottom");
      await expect.poll(async () => (await bottom.boundingBox())!.x).toBe(0);
    }
    await expect.poll(async () => {
      const chart = (await plot.boundingBox())!, svg = (await plot.locator("svg").boundingBox())!;
      return Math.abs(chart.width - svg.width);
    }).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    if (width > 1050) await expectMatchingCards();
    await page.locator(".analysis-executive-summary").screenshot({
      path: info.outputPath("monthly-overview-collapsed.png"),
      style: ".iop-view-navigation--bottom { visibility: hidden; }",
    });
    for (let index = 0; index < 4; index++) {
      const trigger = triggers.nth(index);
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: await trigger.getAttribute("aria-label") ?? "", exact: true });
      await expect(dialog).toBeVisible();
      await expect(page.getByRole("dialog")).toHaveCount(1);
      await expect(dialog.getByText(`${17 + index}'783 Vorkommnisse`, { exact: true })).toBeVisible();
      await expect(dialog.getByText(`${(626.42 - index * 50).toFixed(2)} Vorkommnisse/Tag`, { exact: true })).toBeVisible();
      const box = (await dialog.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(1000);
      if (index === 0) await page.screenshot({ path: info.outputPath("kpi-details-popover.png") });
      if (index === 1) {
        await kpis.locator(":scope > h2").click();
      } else if (index === 2) {
        await dialog.getByRole("button", { name: "Details schließen", exact: true }).click();
      } else {
        await page.keyboard.press("Escape");
        await expect(trigger).toBeFocused();
      }
      await expect(dialog).toHaveCount(0);
    }
    if (width > 1050) await expectMatchingCards();
    await page.getByRole("banner").screenshot({ path: info.outputPath("navigation-toggle.png") });
    const comparisonValues = await kpis.textContent();
    // The control is keyboard-operable, and reopening retains analytical content.
    await show.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("navigation", { name: "Hauptnavigation", exact: true })).toBeVisible();
    expect(await kpis.textContent()).toBe(comparisonValues);
    if (width === 1440) {
      for (const label of ["Bereich analysis", "Equipment analysis", "Daily / monthly"]) {
        await page.locator(".iop-view-navigation--bottom").getByRole("button", { name: german[label] ?? label, exact: true }).click();
        await expect(page.getByRole("note", { name: "Monatsdurchschnitt pro importiertem Tag" })
          .getByRole("group", { name: "Häufigkeit", exact: true })).toContainText("Ø 3'800");
      }
      await page.locator(".iop-view-navigation--bottom").getByRole("button", { name: "Executive Overview", exact: true }).click();
      await page.locator(".analysis-filters summary").click();
      await page.getByRole("combobox", { name: "Monat", exact: true }).selectOption("2026-05");
      await expect(kpis.getByText("Nur aktueller Monat", { exact: true })).toHaveCount(0);
      await expect(kpis.locator('.iop-comparison[data-state="worse"]')).toHaveCount(4);
      await triggers.first().click();
      await expect(page.getByRole("dialog")).toContainText("31 berücksichtigte importierte Tage aus allen verfügbaren Monaten");
      await expect(page.getByRole("dialog")).toContainText("2026-05-01 – 2026-09-30");
      await page.keyboard.press("Escape");
    }
    await page.getByRole("button", { name: "Navigation ausblenden", exact: true }).click();
    await page.reload();
    await expect(page.getByRole("button", { name: "Navigation ausblenden", exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Hauptnavigation", exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

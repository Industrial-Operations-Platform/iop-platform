import { expect, test } from "@playwright/test";

for (const width of [1440, 375]) {
  test(`month comparison and collapsed reset at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const requests: {
      months?: string[];
      filters?: Record<string, string[]>;
    }[] = [];
    await page.route("**/api/v1/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      const dates = ["2026-05-01", "2026-06-01", "2026-07-01"];
      let body: unknown;
      if (path.endsWith("/session/context"))
        body = {
          enabled: true,
          canImport: false,
          user: { id: "reader", name: "Reader" },
          users: [{ id: "reader", name: "Reader" }],
          scope: null,
        };
      else if (path.endsWith("/analytics/availability"))
        body = { dates, latestDate: dates[2] };
      else if (path.endsWith("/analytics/report")) {
        const selection = route.request().postDataJSON();
        requests.push(selection);
        const months: string[] = selection.months ?? [
          selection.from.slice(0, 7),
        ];
        const scale = months.reduce(
          (sum, month) => sum + Number(month.slice(5)) - 4,
          0,
        );
        const frequencyGroups = Array.from({ length: 12 }, (_, index) => ({
          key: `Sector ${String.fromCharCode(65 + index)}`,
          frequency: (12 - index) * scale,
          minutes: (index + 1) * scale,
          seconds: (index + 1) * scale * 60,
          records: months.length,
        }));
        const durationGroups = [...frequencyGroups].reverse();
        const groups =
          selection.metric === "duration" ? durationGroups : frequencyGroups;
        const monthly = months.flatMap((period) =>
          frequencyGroups.map((group) => {
            const factor = (Number(period.slice(5)) - 4) / scale;
            return {
              ...group,
              period,
              frequency: group.frequency * factor,
              minutes: group.minutes * factor,
              seconds: group.seconds * factor,
              records: 1,
            };
          }),
        );
        body = {
          selection,
          revision: "test",
          profileVersion: "1",
          excludedWeekdays: [7],
          totals: {
            key: "total",
            frequency: 78 * scale,
            minutes: 78 * scale,
            seconds: 78 * scale * 60,
            records: 12 * months.length,
          },
          executive: [],
          groups,
          frequencyGroups,
          durationGroups,
          groupCount: 12,
          timeline: [],
          series: monthly
            .filter((row) =>
              frequencyGroups.slice(0, 10).some((g) => g.key === row.key),
            )
            .map((row) => ({ ...row, period: row.period + "-01" })),
          monthly,
          options: { sector: groups.map((g) => g.key) },
          optionCounts: {},
          dates,
          records: [],
          recordCount: 12 * months.length,
          page: 1,
          pageCount: 1,
          unclassifiedCount: 0,
        };
      } else throw new Error(`Unexpected request: ${path}`);
      await route.fulfill({ json: body });
    });
    await page.goto("/");
    await page
      .getByRole("button", { name: "Data analysis", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Bereich analysis", exact: true })
      .click();
    const panel = page.locator(".analysis-filter-panel");
    await panel.locator("summary").click();
    await page.getByRole("checkbox", { name: "May 2026" }).check();
    await page
      .getByRole("combobox", { name: "Measure", exact: true })
      .selectOption("duration");
    await expect(
      page.getByRole("checkbox", { name: "June 2026" }),
    ).not.toBeChecked();
    await page
      .getByRole("button", { name: "Apply filters", exact: true })
      .click();
    await expect(panel.locator("summary")).toContainText("2026-05, 2026-07");
    await expect
      .poll(() => requests.at(-1)?.months)
      .toEqual(["2026-05", "2026-07"]);
    await expect(
      page.locator(".analysis-plot").first().locator("svg"),
    ).toBeVisible();
    for (const title of [
      "Top 10 by frequency · Pareto",
      "Top 10 by duration · Pareto",
    ]) {
      const card = page.locator("section").filter({
        has: page.getByRole("heading", { name: title, exact: true }),
      });
      await expect(
        card.getByText(/first 7 groups contribute 80.77%/),
      ).toBeVisible();
      await expect(card.locator("svg")).toBeVisible();
      await expect(card.locator("svg")).toContainText("80%");
      await expect(card.locator("svg")).toContainText("Cumulative %");
      await expect(card.locator("svg")).not.toContainText("NaN");
      const labels = await card.locator("svg text").allTextContents();
      const componentLabels = labels.filter((label) =>
        label.startsWith("Sector "),
      );
      expect(componentLabels).toHaveLength(10);
      expect(componentLabels[0]).toBe(
        title.includes("frequency") ? "Sector A" : "Sector L",
      );
      await card.screenshot({
        path: `test-results/pareto-${title.includes("frequency") ? "frequency" : "duration"}-${width}.png`,
      });
    }
    const heatmap = page
      .locator(".iop-panel--chart")
      .filter({
        has: page.getByRole("heading", {
          name: "Group behavior by reporting period",
          exact: true,
        }),
      });
    const heatmapLabels = await heatmap.locator("svg text").allTextContents();
    expect(
      heatmapLabels.filter((label) => label.startsWith("Sector ")),
    ).toEqual(
      Array.from(
        { length: 10 },
        (_, i) => `Sector ${String.fromCharCode(65 + i)}`,
      ),
    );
    await heatmap.screenshot({ path: `test-results/heatmap-${width}.png` });
    await page.screenshot({
      path: `test-results/component-pareto-${width}.png`,
      fullPage: true,
    });
    for (const title of [
      "Halle analysis",
      "Equipment analysis",
      "Error analysis",
      "Daily / monthly",
      "Halle analysis",
    ]) {
      await page.getByRole("button", { name: title, exact: true }).click();
      await expect(panel.locator("summary")).toContainText("2026-05, 2026-07");
      await expect(page.locator('input[type="date"]')).toHaveCount(0);
      await expect
        .poll(() => requests.at(-1)?.months)
        .toEqual(["2026-05", "2026-07"]);
    }
    await page.locator(".analysis-data summary").click();
    await page.getByRole("button", { name: "Sector A", exact: true }).click();
    await expect
      .poll(() => requests.at(-1)?.filters?.sector)
      .toEqual(["Sector A"]);
    await expect(panel.locator("summary")).toContainText("2 active");
    await expect
      .poll(() => requests.at(-1)?.months)
      .toEqual(["2026-05", "2026-07"]);
    await expect(panel).not.toHaveAttribute("open");
    await expect(
      page.getByRole("button", { name: "Clear filters", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `test-results/month-comparison-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Clear filters", exact: true })
      .click();
    await expect
      .poll(() => requests.at(-1)?.months)
      .toEqual(["2026-05", "2026-06", "2026-07"]);
    await expect(panel).not.toHaveAttribute("open");
    await panel.locator("summary").click();
    await expect(
      page.getByRole("checkbox", { name: "June 2026" }),
    ).toBeChecked();
    await page.screenshot({
      path: `test-results/month-controls-${width}.png`,
      fullPage: true,
    });
  });
}

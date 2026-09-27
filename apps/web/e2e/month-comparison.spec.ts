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
      if (path.endsWith("/demo/context"))
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
        const groups = ["Sector A", "Sector B", "Sector C"].map(
          (key, index) => ({
            key,
            frequency: 30 - index * 5,
            minutes: 10 - index,
            seconds: (10 - index) * 60,
            records: 3,
          }),
        );
        body = {
          selection,
          revision: "test",
          profileVersion: "1",
          excludedWeekdays: [7],
          totals: {
            key: "total",
            frequency: 75,
            minutes: 27,
            seconds: 1620,
            records: 9,
          },
          executive: [],
          groups,
          durationGroups: groups,
          groupCount: 3,
          timeline: [],
          series: [],
          monthly: months.flatMap((period, index) =>
            groups.map((group) => ({
              ...group,
              period,
              frequency: group.frequency - index * 4,
            })),
          ),
          options: { sector: groups.map((g) => g.key) },
          optionCounts: {},
          dates,
          records: [],
          recordCount: 9,
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

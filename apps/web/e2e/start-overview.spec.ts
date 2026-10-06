import { emptyWorkforce } from "./workforce-fixture";
import { expect, test } from "@playwright/test";

for (const width of [1440, 375]) {
  test(`Start shows operational summary and compact analytical evidence at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const requests: string[] = [];
    await page.route("**/api/v1/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/maintenance/assignments")) return route.fulfill({ json: { records: [], events: [] } });
      requests.push(path);
      if (path.endsWith("/workforce/board")) {
        await route.fulfill({ json: emptyWorkforce });
        return;
      }
      if (path.endsWith("/session/context")) {
        await route.fulfill({
          json: {
            enabled: true,
            canImport: false,
            user: { id: "reader", name: "Alex" },
            users: [{ id: "reader", name: "Alex" }],
            scope: null,
          },
        });
      } else if (path.endsWith("/handover/context")) {
        await route.fulfill({
          json: {
            actorId: "reader",
            canCoordinate: false,
            people: [],
            categories: [{ id: "safety", label: "Safety" }],
            timeZone: "UTC",
            externalSystemLabel: "Work reference",
            locations: [
              {
                id: "hall-a",
                label: "Halle A",
                parentId: "",
                role: "department",
                sectorKey: "Halle A",
              },
            ],
          },
        });
      } else if (path.endsWith("/handover/query")) {
        await route.fulfill({
          json: { entries: [], total: 0, nextCursor: "" },
        });
      } else if (path.endsWith("/analytics/availability")) {
        await route.fulfill({ json: { dates: ["2026-06-01", "2026-07-01"] } });
      } else if (path.endsWith("/analytics/report")) {
        const selection = route.request().postDataJSON();
        expect(selection.from).toBe("2026-07-01");
        if (!selection.executive) expect(selection.months).toEqual(["2026-07"]);
        const row = {
          key: selection.dimension === "area" ? "Area A" : "Halle A",
          frequency: 123,
          seconds: 600,
          minutes: 10,
          records: 2,
        };
        await route.fulfill({
          json: {
            selection,
            revision: "1",
            profileVersion: "1",
            totals: row,
            groups: [row],
            frequencyGroups: [row],
            durationGroups: [row],
            groupCount: 1,
            executive: [],
            timeline: [],
            series: [],
            monthly: [],
            options: { sector: ["Halle A"] },
            optionCounts: { sector: 1 },
            dates: ["2026-07-01"],
            records: [],
            recordCount: 2,
            page: 1,
            pageCount: 1,
            unclassifiedCount: 0,
            excludedWeekdays: [7],
          },
        });
      } else throw new Error(`Unexpected Start request: ${path}`);
    });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Welcome, Alex" }),
    ).toBeVisible();
    await expect(page.getByText("123", { exact: true })).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.getByText(/No schedule yet/)).toBeVisible();
    await page
      .getByRole("navigation", { name: "Operational updates" })
      .getByRole("button", { name: /Open reports/ })
      .click();
    await expect(
      page.getByText(/No open issues have been reported/),
    ).toBeVisible();
    expect(
      requests.some(
        (path) => path.includes("imports") || path.endsWith("profile"),
      ),
    ).toBe(false);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/iop-169-start-${width}.png`,
      fullPage: true,
    });
    const selector = page.getByRole("combobox", { name: "Start department" });
    await selector.selectOption("hall-a");
    await expect(page.getByText("123", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Open Data Analysis" }).focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("navigation", { name: "Analysis templates" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "IOP · Go to Start" }).click();
    await expect(
      page.getByRole("heading", { name: "Welcome, Alex" }),
    ).toBeVisible();
  });
}

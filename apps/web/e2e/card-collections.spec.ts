import { expect, test, type Locator } from "@playwright/test";
import { installMaintenanceAssetsFixture } from "./maintenance-assets-fixture";

async function expectScrollable(body: Locator) {
  await expect(body).toBeVisible();
  expect(await body.evaluate(element => ({
    overflowing: element.scrollHeight > element.clientHeight,
    bounded: element.getBoundingClientRect().height <= Math.min(416, innerHeight * 0.6) + 1,
    horizontal: element.scrollWidth > element.clientWidth,
  }))).toEqual({ overflowing: true, bounded: true, horizontal: false });
  const cards = await body.locator(":scope > *").evaluateAll(elements => elements.map(element => {
    const bounds = element.getBoundingClientRect();
    return { top: bounds.top, bottom: bounds.bottom, contentFits: element.scrollHeight <= element.clientHeight + 1 };
  }));
  for (let index = 0; index < cards.length; index++) {
    expect(cards[index].contentFits).toBe(true);
    if (index > 0 && cards[index].top > cards[index - 1].top + 1)
      expect(cards[index].top).toBeGreaterThanOrEqual(cards[index - 1].bottom);
  }
  await body.focus();
  await body.press("ArrowDown");
  await expect.poll(() => body.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  await body.press("Control+End");
  await expect.poll(() => body.evaluate(element =>
    element.scrollHeight - element.clientHeight - element.scrollTop)).toBeLessThan(2);
}

for (const viewport of [{ width: 1440, height: 1000 }, { width: 820, height: 650 }, { width: 375, height: 667 }]) {
  test(`card collections scroll independently at ${viewport.width}px`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ colorScheme: viewport.width === 820 ? "dark" : "light" });
    const fixture = await installMaintenanceAssetsFixture(page, "administrator");
    const records = Array.from({ length: 18 }, (_, index) => ({
      ...fixture.completedRecord,
      id: `scroll-record-${index}`,
      data: { ...fixture.completedRecord.data, title: `Inspection ${index + 1}`, status: "open" },
    }));
    await page.route("**/maintenance/query", route => route.fulfill({ json: {
      records, total: records.length, nextCursor: "",
      statusCounts: { open: records.length, "in-progress": 0, blocked: 0, done: 0 },
    } }));
    const entries = Array.from({ length: 18 }, (_, index) => ({
      ...fixture.sourceReport, id: `scroll-entry-${index}`,
      content: { ...fixture.sourceReport.content, date: "2026-10-06", summary: `Handover topic ${index + 1}` },
    }));
    await page.route("**/handover/query", route => route.fulfill({ json: {
      entries, total: entries.length, nextCursor: "",
    } }));
    await page.goto("/");
    const navigation = page.getByRole("navigation", { name: "Main navigation" });
    await navigation.getByRole("button", { name: "Maintenance", exact: true }).click();
    const open = page.locator(".maintenance-column").first();
    const body = open.locator(".maintenance-cards");
    expect(await page.locator(".maintenance-cards").nth(1).evaluate(element => element.clientHeight)).toBe(0);
    await body.scrollIntoViewIfNeeded();
    const headingBefore = await open.getByRole("heading").boundingBox();
    await expectScrollable(body);
    expect((await open.getByRole("heading").boundingBox())!.y).toBeCloseTo(headingBefore!.y, 0);
    expect(await page.locator(".maintenance-cards").nth(1).evaluate(element => element.scrollTop)).toBe(0);
    await expect(body.getByRole("button", { name: /^Inspection 18 / })).toBeInViewport();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: info.outputPath("maintenance.png"), fullPage: true });

    await navigation.getByRole("button", { name: "Shift Handover", exact: true }).click();
    await page.getByLabel("Selected department").selectOption("assembly");
    const daily = page.getByLabel("Daily category canvas");
    const topics = daily.locator(".handover-summary-cards");
    await expectScrollable(topics);
    await expect(topics.getByRole("button", { name: /^Handover topic 18 / })).toBeInViewport();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: info.outputPath("handover.png"), fullPage: true });

    await page.getByRole("navigation", { name: "Handover views" }).getByRole("button", { name: "Journal", exact: true }).click();
    await expectScrollable(page.locator(".handover-summary-cards"));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await page.route("**/maintenance/query", route => route.fulfill({ json: {
      records: records.slice(0, 1), total: 1, nextCursor: "",
      statusCounts: { open: 1, "in-progress": 0, blocked: 0, done: 0 },
    } }));
    await navigation.getByRole("button", { name: "Maintenance", exact: true }).click();
    await expect(body.getByRole("button")).toHaveCount(1);
    expect(await body.evaluate(element => ({
      fits: element.scrollHeight === element.clientHeight,
      natural: element.getBoundingClientRect().height < Math.min(416, innerHeight * 0.6),
    }))).toEqual({ fits: true, natural: true });
  });
}

import { expect, test } from "@playwright/test";
import { installMaintenanceAssetsFixture } from "./maintenance-assets-fixture";
import { emptyRecord } from "../src/features/maintenance/domain/models";

for (const width of [1440, 390]) {
  test(`operator Start periods, readable maintenance and scrollable notifications at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.clock.setFixedTime(new Date("2026-10-06T08:00:00Z"));
    await installMaintenanceAssetsFixture(page, "technician");
    const records = ["2026-10-06", "", "2026-10-02", "2026-10-09", "2026-10-13"].map((dueDate, i) => ({
      id: `44444444-4444-4444-8444-${String(i + 1).padStart(12, "0")}`,
      revision: 1,
      data: { ...emptyRecord(), title: ["Inspect protective guard — assembly conveyor", "Investigate motor roller — manually selected repair zone", "Inspect cassette guard", "Planned Friday inspection", "Next week's inspection"][i],
        repairTarget: "Cassette or motor roller in the manually selected repair zone", dueDate, status: i === 2 ? "blocked" : "open" },
      locationLabel: "Assembly", assetName: "DRIVE-01", priorityLabel: "Normal",
    }));
    await page.route("**/maintenance/assignments", (route) => route.fulfill({ json: {
      records,
      events: Array.from({ length: 20 }, (_, i) => ({ id: `notice-${i}`, recordId: records[0].id,
        title: `${i + 1}. Inspect protective guard — assembly conveyor and manually selected repair zone`, at: "2026-10-05T08:00:00Z", revision: 1 })),
    } }));
    await page.goto("/");
    const profile = page.getByRole("region", { name: "Profile", exact: true });
    const assignment = page.getByRole("region", { name: "Your assignment", exact: true });
    const maintenance = assignment.getByRole("region", { name: "Your maintenance assignments", exact: true });
    const cards = maintenance.locator(".maintenance-assignment-card");
    await expect(cards).toHaveCount(3);
    expect((await assignment.boundingBox())!.y).toBeGreaterThan((await profile.boundingBox())!.y + (await profile.boundingBox())!.height);
    const first = (await cards.nth(0).boundingBox())!;
    const second = (await cards.nth(1).boundingBox())!;
    if (width > 650) {
      expect(Math.abs(first.y - second.y)).toBeLessThan(1);
      expect(second.x).toBeGreaterThan(first.x + first.width);
    } else {
      expect(second.y).toBeGreaterThan(first.y + first.height);
    }
    expect(await cards.evaluateAll((nodes) => nodes.every((node) => {
      const title = node.querySelector("strong")!.getBoundingClientRect();
      const context = node.querySelector(".maintenance-assignment-context")!.getBoundingClientRect();
      return context.top >= title.bottom && Array.from(node.querySelectorAll(".iop-badge, time")).every((part) => part.scrollWidth <= part.clientWidth);
    }))).toBe(true);
    const overview = page.getByRole("heading", { name: "Your department at a glance", exact: true });
    await expect(overview).toBeVisible();
    await overview.evaluate((element) => element.setAttribute("data-persistence-check", "kept"));
    const before = await page.evaluate(() => performance.getEntriesByType("resource").filter((r) => r.name.endsWith("/workforce/board")).length);
    await assignment.getByRole("button", { name: "Week", exact: true }).click();
    await expect(assignment.locator(".workforce-start-day")).toHaveCount(7);
    await expect(cards).toHaveCount(4);
    await expect(overview).toHaveAttribute("data-persistence-check", "kept");
    await assignment.getByRole("button", { name: "Day", exact: true }).click();
    await expect(cards).toHaveCount(3);
    await expect(assignment.getByText("Loading…", { exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => performance.getEntriesByType("resource").filter((r) => r.name.endsWith("/workforce/board")).length)).toBe(before);
    await page.screenshot({ path: `/tmp/iop-198-start-${width}.png`, fullPage: true });
    const navigation = page.getByRole("navigation", { name: "Main navigation" });
    await expect(navigation.getByRole("button", { name: "Maintenance", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Notifications", exact: true }).click();
    const notices = page.getByRole("dialog", { name: "Notifications", exact: true });
    await expect(notices).toBeVisible();
    expect(await notices.locator(".iop-notification-feed").evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
    const headerTop = (await notices.locator(".iop-notification-heading").boundingBox())!.y;
    await notices.locator(".iop-notification-feed").evaluate((node) => { node.scrollTop = node.scrollHeight; });
    expect((await notices.locator(".iop-notification-heading").boundingBox())!.y).toBe(headerTop);
    await notices.locator(".iop-notification-feed").evaluate((node) => { node.scrollTop = 0; });
    await page.screenshot({ path: `/tmp/iop-198-notifications-${width}.png`, fullPage: true });
    await page.keyboard.press("Escape");
    await expect(notices).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Notifications", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Notifications", exact: true }).click();
    await notices.getByRole("button", { name: "Mark all as read", exact: true }).click();
    await expect(notices.getByText("You're all caught up.")).toBeVisible();
    await page.keyboard.press("Escape");
    await cards.first().click();
    await expect(page.getByRole("heading", { name: "Bearing inspection", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

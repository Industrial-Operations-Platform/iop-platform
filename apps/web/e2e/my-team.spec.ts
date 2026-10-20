import { expect, test } from "@playwright/test";
import { installMaintenanceAssetsFixture } from "./maintenance-assets-fixture";
import { teamBoard } from "../test/fixtures/team-distribution";

for (const width of [1440, 390]) {
  test(`leader team availability and allocations remain readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const { requests } = await installMaintenanceAssetsFixture(page, "team-leader");
    const board = teamBoard();
    board.actorId = "admin";
    board.settings.teams = board.settings.teams.map((team) => team.leaderId === "leader" ? { ...team, leaderId: "admin" } : team);
    await page.route("**/workforce/board", (route) => route.fulfill({ json: board }));
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Workforce & shifts", exact: true }).click();
    await page.getByRole("button", { name: "My team", exact: true }).click();
    const table = page.getByRole("table", { name: "Team distribution for Primary operations", exact: true });
    await expect(table.getByRole("columnheader")).toHaveCount(8);
    await expect(table.getByRole("rowheader")).toHaveCount(4);
    const alice = table.getByRole("row", { name: /Alice Current/ });
    for (const label of ["Vacation", "Sick leave", "Training", "Compensation", "Accident", "Off", "Assembly", "Floating support"]) {
      await expect(alice.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(table.getByText("Continues from 2026-10-19", { exact: true })).toBeVisible();
    await expect(page.getByRole("table", { name: "Team distribution for Support team", exact: true })).toBeVisible();
    await expect(page.getByText("Other Leader's Worker", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Configuration", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Schedule import", exact: true })).toHaveCount(0);
    const viewport = table.locator("..");
    expect(await viewport.evaluate((element) => element.scrollHeight <= element.clientHeight)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `/tmp/iop-218-my-team-${width}.png`, fullPage: true });
    if (width === 390) {
      expect(await viewport.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
      const before = (await table.getByRole("rowheader").first().boundingBox())!.x;
      await viewport.evaluate((element) => { element.scrollLeft = 400; });
      expect(Math.abs((await table.getByRole("rowheader").first().boundingBox())!.x - before)).toBeLessThan(1);
      await page.screenshot({ path: "/tmp/iop-218-my-team-390-scrolled.png", fullPage: true });
      await viewport.evaluate((element) => { element.scrollLeft = 0; });
    }
    await alice.getByRole("button").first().click();
    await expect(page.getByRole("heading", { name: "Alice Current", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "My team", exact: true }).click();
    await page.getByRole("button", { name: "Weekly plan", exact: true }).click();
    await expect(page.getByRole("table", { name: "Weekly plan", exact: true })).toBeVisible();
    expect(requests.some((request) => /workforce\/(save|import|schedules\/week)$/.test(request.path))).toBe(false);
    expect(errors).toEqual([]);
  });
}

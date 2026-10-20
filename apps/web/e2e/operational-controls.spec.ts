import { expect, test } from "@playwright/test";
import { installMaintenanceAssetsFixture } from "./maintenance-assets-fixture";

test("editable Maintenance board cards drag between statuses and retain required review", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const { requests } = await installMaintenanceAssetsFixture(page);
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Maintenance", exact: true }).click();
  const board = page.getByLabel("Maintenance board", { exact: true });
  const card = board.getByRole("button", { name: /Bearing inspection/ });
  await expect(card).toHaveAttribute("draggable", "true");
  await card.dragTo(board.getByRole("region", { name: "Blocked", exact: true }));
  const dialog = page.getByRole("dialog", { name: "Move to Blocked", exact: true });
  await expect(dialog.getByLabel("Blocked reason")).toBeVisible();
  expect(requests.filter(request => request.path.endsWith("/maintenance/save"))).toHaveLength(0);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(board).toBeVisible();
  await card.dragTo(board.getByRole("region", { name: "In progress", exact: true }));
  await expect(page.getByText("Maintenance saved.", { exact: true })).toBeVisible();
  await expect.poll(() => requests.filter(request => request.path.endsWith("/maintenance/save")).length).toBe(1);
  expect(requests.find(request => request.path.endsWith("/maintenance/save"))?.data).toMatchObject({
    expectedRevision: 1, data: { status: "in-progress" },
  });
  await expect(board).toBeVisible();
  await page.getByRole("button", { name: "Load more", exact: true }).click();
  await expect(board.getByRole("region", { name: "In progress", exact: true })
    .getByRole("button", { name: /Bearing inspection/ })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "test-results/IOP-215-maintenance-drag.png", fullPage: true });
  expect(errors).toEqual([]);
});

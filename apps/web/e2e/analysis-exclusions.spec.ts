import { expect, test } from "@playwright/test";
import { installDesktopConsistencyFixture } from "./desktop-consistency-fixture";
import type { ProfileResult } from "../src/features/analysis/domain/models";

test("administrator finds, saves, reloads and removes reporting exclusions", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => localStorage.setItem("iop.language", "en"));
  await installDesktopConsistencyFixture(page);
  let stored: ProfileResult = { version: "v1", profile: {
    normalization: { trim: true, unicodeNfc: true, collapseWhitespace: true },
    unclassifiedLabel: "Unknown", aliases: [], areaSectors: [{ area: "A", sector: "Hall" }],
    executiveKpis: [{ id: "jam", label: "Jam", message: "Jam", metric: "frequency", goal: 10 }],
  } };
  await page.route("**/api/v1/analytics/profile", route => {
    if (route.request().method() === "POST") stored = { ...route.request().postDataJSON(), version: "v2" };
    return route.fulfill({ json: stored });
  });
  await page.route("**/api/v1/analytics/messages", route => route.fulfill({ json: { values: ["External, alarm", "Jam"], nextCursor: null } }));
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("button", { name: "Data administration", exact: true }).click();
  await page.getByRole("button", { name: "Data preparation", exact: true }).click();
  const section = page.getByRole("region", { name: "Analysis exclusions", exact: true });
  await expect(section).toBeVisible();
  await section.getByRole("button", { name: "Add exclusion", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save historical preparation", exact: true })).toBeDisabled();
  await section.getByLabel("Excluded value 1", { exact: true }).fill("External, alarm");
  await page.getByRole("button", { name: "Save historical preparation", exact: true }).click();
  await expect.poll(() => stored.profile.excludedValues).toEqual([{ field: "message", value: "External, alarm" }]);
  expect(stored.profile.executiveKpis![0].goal).toBe(10);
  await page.getByRole("button", { name: "Import files", exact: true }).click();
  await page.getByRole("button", { name: "Data preparation", exact: true }).click();
  await expect(section.getByLabel("Excluded value 1", { exact: true })).toHaveValue("External, alarm");
  await section.screenshot({ path: "test-results/analysis-exclusions-settings.png" });
  await section.getByRole("button", { name: "Remove exclusion 1", exact: true }).click();
  await page.getByRole("button", { name: "Save historical preparation", exact: true }).click();
  await expect.poll(() => stored.profile.excludedValues).toEqual([]);
});

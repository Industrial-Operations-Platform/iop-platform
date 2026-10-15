import { expect, test } from "@playwright/test";
import { installMaintenanceAssetsFixture } from "./maintenance-assets-fixture";

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`Maintenance and digital asset record navigation at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const { requests } = await installMaintenanceAssetsFixture(page, "administrator");
    await page.goto("/");
    const navigation = page.getByRole("navigation", {
      name: "Main navigation",
    });
    await navigation
      .getByRole("button", { name: "Maintenance", exact: true })
      .click();
    await expect(page.getByText("Showing 2 of 4 records.")).toBeVisible();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          window.scrollTo(0, 0);
          requestAnimationFrame(() => resolve());
        }),
    );
    await page.screenshot({
      path: `test-results/IOP-194-maintenance-board-${viewport.width}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Load more" }).click();
    await expect(page.getByText("Showing 4 of 4 records.")).toBeVisible();
    await page
      .getByRole("button", { name: "Bearing inspection", exact: false })
      .click();
    await expect(
      page.getByRole("heading", { name: "Bearing inspection", exact: true }),
    ).toBeVisible();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          window.scrollTo(0, 0);
          requestAnimationFrame(() => resolve());
        }),
    );
    await page.screenshot({
      path: `test-results/IOP-194-maintenance-details-${viewport.width}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await page
      .getByRole("combobox", { name: "Status", exact: true })
      .selectOption("blocked");
    await expect(page.getByLabel("Blocked reason")).toHaveAttribute(
      "required",
      "",
    );
    await page
      .getByLabel("Blocked reason")
      .fill("Awaiting inspection tooling.");
    await page.getByLabel("Change reason").fill("Reject stale update");
    await page.getByRole("button", { name: "Save maintenance" }).click();
    await expect(page.getByRole("alert")).toContainText("Reload before saving");
    await expect(page.getByLabel("Blocked reason")).toHaveValue(
      "Awaiting inspection tooling.",
    );
    await page
      .getByLabel("Change reason")
      .fill("Inspection tooling is required.");
    await page.getByRole("button", { name: "Save maintenance" }).click();
    await expect(page.getByText("Maintenance saved.")).toBeVisible();
    await page.getByRole("button", { name: "Open asset record" }).click();
    await expect(
      page.getByRole("heading", { name: "DRIVE-01", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Showing 2 of 3 records.")).toBeVisible();
    await page.getByRole("button", { name: "Load more" }).click();
    await expect(
      page.getByText("Daily drive alarms", { exact: true }),
    ).toBeVisible();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          window.scrollTo(0, 0);
          requestAnimationFrame(() => resolve());
        }),
    );
    await page.screenshot({
      path: `test-results/IOP-194-asset-timeline-${viewport.width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Event evidence 1", exact: true })
      .click();
    await expect(page.getByText("Showing 1 of 1 records.")).toBeVisible();
    await page.getByRole("button", { name: "Open source record" }).click();
    await expect(
      page.getByRole("table", { name: "Source evidence", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("DRIVE-01", { exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: "Assets", exact: true })
      .last()
      .click();
    await expect(
      page.getByRole("heading", { name: "DRIVE-01", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Edit asset", exact: true }).click();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          window.scrollTo(0, 0);
          requestAnimationFrame(() => resolve());
        }),
    );
    await page.screenshot({
      path: `test-results/IOP-194-asset-form-${viewport.width}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await navigation
      .getByRole("button", { name: "Maintenance", exact: true })
      .click();
    await navigation
      .getByRole("button", { name: "Assets", exact: true })
      .click();
    await page.getByRole("button", { name: "Load more" }).click();
    await expect(page.getByText("Showing 2 of 2 assets.")).toBeVisible();
    await page.reload();
    await navigation
      .getByRole("button", { name: "Maintenance", exact: true })
      .click();
    await page.getByRole("button", { name: "Load more" }).click();
    await page
      .getByRole("button", { name: "Bearing inspection", exact: false })
      .click();
    await expect(
      page
        .locator("details .maintenance-narrative")
        .getByText("Awaiting inspection tooling.", { exact: true }),
    ).toHaveCount(1);
    await expect(
      page
        .locator("section.iop-panel > .maintenance-detail-layout > .maintenance-narrative")
        .getByText("Awaiting inspection tooling.", { exact: true }),
    ).toBeVisible();
    expect(
      requests.some(
        ({ path, data }) =>
          path.endsWith("/assets/timeline") &&
          data.kind === "analytics" &&
          data.cursor === "",
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
for (const profile of [
  "technician",
  "administrator",
  "team-leader",
  "task-force",
  "executive",
]) {
  test(`${profile} operational navigation uses source-specific permissions`, async ({
    page,
  }) => {
    if (["team-leader", "task-force"].includes(profile)) {
      await page.setViewportSize(profile === "task-force" ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
      await page.addInitScript((appearance) => localStorage.setItem("iop.appearance", appearance), profile === "task-force" ? "dark" : "light");
    }
    await page.clock.setFixedTime(new Date("2026-10-06T08:00:00Z"));
    await installMaintenanceAssetsFixture(page, profile);
    await page.goto("/");
    const navigation = page.getByRole("navigation", {
      name: "Main navigation",
    });
    if (profile === "technician") {
      await expect(navigation.getByRole("button", { name: "Maintenance", exact: true })).toHaveCount(0);
      await page.getByRole("region", { name: "Your maintenance assignments", exact: true })
        .getByRole("button", { name: /Bearing inspection/ }).click();
      await expect(page.getByRole("heading", { name: "Bearing inspection", exact: true })).toBeVisible();
      await expect(navigation.getByRole("button", { name: "Assets", exact: true })).toHaveCount(0);
      return;
    }
    await navigation.getByRole("button", { name: "Maintenance", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Configuration", exact: true }),
    ).toHaveCount(profile === "administrator" ? 1 : 0);
    await expect(
      page.getByRole("button", { name: "New maintenance", exact: true }),
    ).toHaveCount(profile === "executive" ? 0 : 1);
    if (["team-leader", "task-force"].includes(profile)) {
      await expect(navigation.getByRole("button", { name: "Assets", exact: true })).toHaveCount(0);
      await expect(navigation.getByRole("button", { name: "Asset management", exact: true })).toHaveCount(0);
      await expect(navigation.getByRole("button", { name: "Asset Locator", exact: true })).toHaveCount(1);
      await page.getByRole("button", { name: "Bearing inspection", exact: false }).click();
      await page.getByRole("button", { name: "Locate asset", exact: true }).click();
      await expect(page.getByRole("button", { name: "Explicitly linked test motor — motor", exact: true })).toHaveAttribute("aria-pressed", "true");
      for (const action of ["Save scene revision", "Create scene", "Open asset record", "Register asset"])
        await expect(page.getByRole("button", { name: action, exact: true })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `test-results/IOP-211-reader-locator-${profile}.png`, fullPage: true });
      await page.getByRole("button", { name: "Vibration reported", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Vibration reported", exact: true })).toBeVisible();
      await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("button", { name: "Shift Handover", exact: true }).click();
      const views = page.getByRole("navigation", { name: "Handover views" });
      await views.getByRole("button", { name: "Shift records", exact: true }).click();
      await expect(views.getByRole("button", { name: "Shift records", exact: true })).toHaveAttribute("aria-pressed", "true");
      await expect(navigation.getByRole("button", { name: "Shift Handover", exact: true })).toHaveAttribute("aria-current", "page");
      await expect(navigation.getByRole("button", { name: "Formal Handover", exact: true })).toHaveCount(0);
      await expect(page.getByText(/Journal tracks current reports and unresolved issues/)).toBeVisible();
      await page.getByRole("combobox", { name: "Selected department", exact: true }).selectOption("assembly");
      await expect(page.getByText(/No planned Workforce shift exists in this period/)).toBeVisible();
      await expect(page.getByRole("button", { name: "New shift record", exact: true })).toBeDisabled();
      const selectedRecords = views.getByRole("button", { name: "Shift records", exact: true });
      await selectedRecords.hover();
      const navigationColors = await selectedRecords.evaluate(element => {
        const reference = document.createElement("span");
        reference.style.backgroundColor = "var(--iop-activeSurface)";
        reference.style.color = "var(--iop-ink)";
        (element.closest(".iop-ui") ?? document.body).append(reference);
        const expected = getComputedStyle(reference), actual = getComputedStyle(element);
        const colors = { background: actual.backgroundColor, ink: actual.color, activeSurface: expected.backgroundColor, selectedInk: expected.color };
        reference.remove();
        return colors;
      });
      expect(navigationColors.background).toBe(navigationColors.activeSurface);
      expect(navigationColors.ink).toBe(navigationColors.selectedInk);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `test-results/IOP-211-integrated-handover-${profile}.png`, fullPage: true });
      await views.getByRole("button", { name: "Journal", exact: true }).click();
      await expect(views.getByRole("button", { name: "Journal", exact: true })).toHaveAttribute("aria-pressed", "true");
      return;
    }
    if (!["administrator"].includes(profile)) {
      await expect(
        navigation.getByRole("button", { name: "Assets", exact: true }),
      ).toHaveCount(0);
      return;
    }
    await navigation
      .getByRole("button", { name: "Assets", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Register asset", exact: true }),
    ).toHaveCount(1);
    await page.getByRole("button", { name: "DRIVE-01", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Edit asset", exact: true }),
    ).toHaveCount(1);
    if (profile === "technician")
      await expect(
        page.getByText("Not authorized", { exact: true }),
      ).toBeVisible();
    await page
      .getByRole("button", { name: "Shift Handover 1", exact: true })
      .click();
    await expect(page.getByText("Showing 1 of 1 records.")).toBeVisible();
    await page.getByRole("button", { name: "Open source record" }).click();
    await expect(
      page.getByRole("heading", { name: "Vibration reported", exact: true }),
    ).toBeVisible();
  });
}

test("administrator retains priority configuration and full operational Asset access", async ({
  page,
}) => {
  await installMaintenanceAssetsFixture(page, "administrator");
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  await expect(
    navigation.getByRole("button", { name: "Assets", exact: true }),
  ).toHaveCount(1);
  await navigation
    .getByRole("button", { name: "Maintenance", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Configuration", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Maintenance priorities" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save configuration" }).click();
  await expect(page.getByText("Configuration saved.")).toBeVisible();
});

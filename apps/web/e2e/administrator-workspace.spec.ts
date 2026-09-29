import { expect, test } from "@playwright/test";

for (const width of [1440, 375]) {
  test(`administrator landing and profile views at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const requests: string[] = [];
    await page.route("**/api/v1/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      requests.push(path);
      if (path.endsWith("/session/context")) {
        await route.fulfill({
          json: {
            enabled: true,
            authentication: "password",
            canImport: true,
            canAdminister: true,
            user: { id: "admin", name: "Alex", profile: "administrator" },
            users: [],
            scope: null,
          },
        });
      } else if (path.endsWith("/analytics/availability")) {
        await route.fulfill({ json: { dates: [] } });
      } else if (path.endsWith("/handover/context")) {
        await route.fulfill({
          json: {
            locations: [],
            categories: [
              "Safety",
              "Information",
              "Successes",
              "People",
              "Performance",
              "Problems",
            ].map((label) => ({ id: label.toLowerCase(), label })),
            canCoordinate: true,
            timeZone: "UTC",
            people: [],
            actorId: "admin",
            externalSystemLabel: "Work reference",
          },
        });
      } else if (path.endsWith("/handover/query")) {
        await route.fulfill({
          json: { entries: [], total: 0, nextCursor: null },
        });
      } else if (path.endsWith("/imports")) {
        await route.fulfill({ json: [] });
      } else throw new Error(`Unexpected request: ${path}`);
    });
    await page.goto("/");
    await expect(
      page.getByRole("region", { name: "Administration overview" }),
    ).toBeVisible();
    for (const name of [
      "Manage users",
      "Import files",
      "Files & source rows",
      "Data preparation",
      "KPI settings & goals",
    ]) {
      await expect(
        page.getByRole("button", { name, exact: true }),
      ).toBeVisible();
    }
    expect(requests.every((path) => path.endsWith("/session/context"))).toBe(
      true,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/iop-170-administration-${width}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "View as", exact: true }).focus();
    await page.keyboard.press("Enter");
    const selector = page.getByRole("combobox", { name: "Profile view" });
    await expect(selector.locator("option")).toHaveText([
      "Administrator",
      "Technician",
      "Task Force",
      "Team Leader",
    ]);
    for (const profile of ["technician", "task-force", "team-leader"]) {
      await selector.selectOption(profile);
      await expect(
        page.getByRole("region", { name: "Start page" }),
      ).toBeVisible();
      await expect(
        page.getByRole("region", { name: "Profile preview" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Users & profiles" }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Data administration" }),
      ).toHaveCount(0);
      await expect(page.getByText("Alex · Administrator")).toBeVisible();
      if (profile === "technician") {
        await expect(
          page.getByRole("button", { name: "Data analysis", exact: true }),
        ).toHaveCount(0);
        await expect(
          page.getByRole("button", { name: "Open Data Analysis" }),
        ).toHaveCount(0);
        await expect(
          page.getByRole("region", { name: "Analytical summary" }),
        ).toHaveCount(0);
        expect(requests.some((path) => path.includes("/analytics/"))).toBe(
          false,
        );
      }
      if (profile === "team-leader") {
        await page
          .getByRole("button", { name: "Shift Handover", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Daily overview", exact: true })
          .click();
        await expect(
          page
            .getByRole("navigation", { name: "Breadcrumb" })
            .locator('[aria-current="page"]'),
        ).toHaveText("Daily overview");
        await expect(page.getByText("No entries for this day.")).toHaveCount(6);
        await expect(
          page.getByLabel("Overview date", { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole("button", {
            name: "Meeting preparation",
            exact: true,
          }),
        ).toHaveCount(0);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.screenshot({
      path: `/tmp/iop-170-preview-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Return to administration" })
      .click();
    await expect(
      page.getByRole("region", { name: "Administration overview" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Import files", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Add a daily CSV" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Users & profiles" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Data analysis", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Your history starts with a CSV" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Data administration" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

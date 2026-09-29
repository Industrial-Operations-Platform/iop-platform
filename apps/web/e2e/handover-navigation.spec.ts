import { expect, test } from "@playwright/test";

for (const width of [1440, 375]) {
  test(`handover home navigation, component form and populated matrix at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const entry = {
      id: "entry-a",
      authorId: "tech",
      authorName: "Alex",
      responsibleId: "tech",
      responsibleName: "Alex",
      createdAt: "2026-09-29T08:00:00Z",
      updatedAt: "2026-09-29T08:00:00Z",
      revision: 1,
      departmentLabel: "Halle A T1",
      areaLabel: "ATK",
      categoryLabel: "Problems",
      equipmentReferenceId: "component-a",
      issueState: "in-progress",
      highlighted: false,
      highlightedAt: "",
      content: {
        date: "2026-09-29",
        categoryId: "problems",
        summary: "Drive vibration requires a bearing check",
        details:
          "Inspection found intermittent vibration at the drive. The next shift should check the bearing during the planned stop and record the result before restarting the component.",
        departmentId: "hall-a",
        areaId: "area-a",
        equipmentCode: "=P20+20.02.04-M1",
        equipmentNamespace: "site-equipment",
        condition: "inspection-needed",
        externalReference: "DEMO-ULTIMO-001",
        challenge: "",
        cause: "",
        measure: "",
        dueDate: "2026-09-30",
        feedbackDueDate: "",
        discuss: true,
      },
    };
    let historyReads = 0;
    await page.route("**/api/v1/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/session/context"))
        return route.fulfill({
          json: {
            enabled: true,
            authentication: "password",
            canImport: false,
            canAdminister: false,
            canReadAnalytics: false,
            user: { id: "tech", name: "Alex", profile: "technician" },
            users: [],
            scope: null,
          },
        });
      if (path.endsWith("/handover/context"))
        return route.fulfill({
          json: {
            actorId: "tech",
            canCoordinate: false,
            timeZone: "Europe/Zurich",
            externalSystemLabel: "Ultimo",
            people: [{ id: "tech", name: "Alex" }],
            categories: [
              "Safety",
              "Information",
              "Successes",
              "People",
              "Performance",
              "Problems",
            ].map((label) => ({ id: label.toLowerCase(), label })),
            locations: [
              {
                id: "hall-a",
                label: "Halle A T1",
                parentId: "",
                role: "department",
                sectorKey: "Halle A T1",
              },
              {
                id: "area-a",
                label: "ATK",
                parentId: "hall-a",
                role: "area",
                sectorKey: "",
              },
            ],
          },
        });
      if (path.endsWith("/handover/query")) {
        const selection = route.request().postDataJSON();
        const entries =
          selection.categoryId && selection.categoryId !== "problems"
            ? []
            : [entry];
        return route.fulfill({
          json: { entries, total: entries.length, nextCursor: "" },
        });
      }
      if (path.endsWith("/handover/history")) {
        historyReads++;
        return route.fulfill({
          json: {
            entry,
            revisions: [
              {
                entry,
                actorId: "tech",
                actorName: "Alex",
                action: "created",
                note: "",
                at: entry.createdAt,
              },
            ],
            nextBefore: 0,
          },
        });
      }
      if (path.endsWith("/handover/equipment")) {
        const selection = route.request().postDataJSON();
        return route.fulfill({
          json: {
            codes: [
              selection.after
                ? "=P20+20.02.04-B1"
                : entry.content.equipmentCode,
            ],
            nextCursor: selection.after ? "" : entry.content.equipmentCode,
          },
        });
      }
      throw new Error(`Unexpected handover request: ${path}`);
    });
    await page.goto("/");
    const navigation = page.getByRole("navigation", {
      name: "Main navigation",
    });
    const home = navigation.getByRole("button", { name: "Shift Handover" });
    await home.click();
    await page
      .getByRole("combobox", { name: "Selected department" })
      .selectOption("hall-a");
    await page
      .getByRole("button", { name: entry.content.summary, exact: true })
      .click();
    const detail = page.getByRole("region", {
      name: "Handover entry",
      exact: true,
    });
    await expect(
      detail.getByRole("heading", { name: entry.content.summary }),
    ).toBeVisible();
    const reads = historyReads;
    await detail.getByRole("button", { name: "Reload entry" }).click();
    await expect.poll(() => historyReads).toBe(reads + 1);
    await expect(
      detail.getByRole("heading", { name: entry.content.summary }),
    ).toBeVisible();
    await page.screenshot({
      path: `/tmp/iop174-detail-${width}.png`,
      fullPage: true,
    });
    // Regression: selecting the already-active sidebar destination must leave detail.
    await home.click();
    await expect(
      page.getByRole("heading", { name: "Shift Handover", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Selected department" }),
    ).toHaveValue("hall-a");
    await page
      .getByRole("button", { name: "Department matrix", exact: true })
      .click();
    const matrix = page.getByRole("table", {
      name: "Department handover matrix",
    });
    await expect(
      matrix.getByRole("cell", { name: "2026-09-29", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: `/tmp/iop174-matrix-${width}.png`,
      fullPage: true,
    });
    await matrix
      .getByRole("cell", { name: "In progress", exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `/tmp/iop174-matrix-status-${width}.png`,
      fullPage: true,
    });
    await matrix.getByRole("button", { name: entry.content.summary }).click();
    const moduleHome = detail.getByRole("button", {
      name: "Shift Handover",
      exact: true,
    });
    await moduleHome.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("heading", { name: "Shift Handover", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Selected department" }),
    ).toHaveValue("hall-a");
    await page.getByRole("button", { name: "New entry", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "New handover entry" });
    await dialog
      .getByRole("combobox", { name: "Area / Bereich" })
      .selectOption("area-a");
    const component = dialog.getByRole("combobox", {
      name: "Betriebsmittelkennzeichen",
      exact: true,
    });
    await component.selectOption(entry.content.equipmentCode);
    const condition = dialog.getByRole("combobox", {
      name: "Reported condition",
    });
    await condition.selectOption("blocked");
    const assertAligned = async () => {
      if (width > 520) {
        const left = await component.boundingBox(),
          right = await condition.boundingBox();
        expect(Math.abs(left!.y - right!.y)).toBeLessThanOrEqual(1);
      }
    };
    await assertAligned();
    await page.screenshot({
      path: `/tmp/iop174-form-${width}.png`,
      fullPage: true,
    });
    await dialog.getByRole("button", { name: "More components" }).click();
    await expect(
      dialog.getByRole("button", { name: "More components" }),
    ).toHaveCount(0);
    await assertAligned();
    await expect(component).toHaveValue(entry.content.equipmentCode);
    await expect(condition).toHaveValue("blocked");
    await dialog
      .getByRole("button", { name: "Close New handover entry" })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

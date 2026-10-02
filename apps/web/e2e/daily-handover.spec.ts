import { expect, test } from "@playwright/test";
import { emptyWorkforce } from "./workforce-fixture";
for (const width of [1440, 375]) {
  test(`daily topics, department status and matrix filters at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.clock.setFixedTime(new Date("2026-10-01T08:00:00Z"));
    const makeEntry = (
      id: string,
      date: string,
      categoryId: string,
      departmentId = "hall-a",
      issueState = "open",
    ) => ({
      id,
      authorId: "tech",
      authorName: "Alex",
      responsibleId: "tech",
      responsibleName: "Alex",
      createdAt: `${date}T08:00:00Z`,
      updatedAt: `${date}T08:00:00Z`,
      revision: 1,
      departmentLabel: departmentId === "hall-a" ? "Halle A" : "Halle B",
      areaLabel: "",
      categoryLabel: categoryId,
      equipmentReferenceId: "",
      issueState,
      highlighted: false,
      highlightedAt: "",
      content: {
        date,
        categoryId,
        summary: id,
        details: "Selected day report",
        departmentId,
        areaId: "",
        equipmentCode: "",
        equipmentNamespace: "",
        condition: "blocked",
        externalReference: "REF-001",
        challenge: "",
        cause: "",
        measure: "",
        dueDate: "2026-10-15",
        feedbackDueDate: "",
        discuss: true,
      },
    });
    let entries = [
      makeEntry("Today problem", "2026-10-01", "problems"),
      makeEntry("Today safety", "2026-10-01", "safety"),
      makeEntry("Prior performance", "2026-09-30", "performance"),
      makeEntry("Prior safety", "2026-09-30", "safety"),
      makeEntry(
        "Closed problem",
        "2026-09-30",
        "problems",
        "hall-a",
        "resolved",
      ),
      makeEntry("Future problem", "2026-10-02", "problems"),
      makeEntry("Other Halle", "2026-10-01", "problems", "hall-b"),
    ];
    const context = {
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
      ].map((label) => ({
        id: label.toLowerCase(),
        label,
        carryForward: ["Problems", "Performance"].includes(label),
      })),
      locations: ["a", "b"].map((id) => ({
        id: `hall-${id}`,
        label: `Halle ${id.toUpperCase()}`,
        parentId: "",
        role: "department",
        sectorKey: "",
      })),
    };
    const queries: Record<string, any>[] = [];
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
      if (path.endsWith("/workforce/board"))
        return route.fulfill({ json: emptyWorkforce });
      if (path.endsWith("/handover/context"))
        return route.fulfill({ json: context });
      if (path.endsWith("/handover/query")) {
        const s = route.request().postDataJSON();
        queries.push(s);
        const matching = entries.filter(
          (e) =>
            (!s.from || e.content.date >= s.from) &&
            (!s.to || e.content.date <= s.to) &&
            (!s.categoryId || e.content.categoryId === s.categoryId) &&
            (!s.departmentId || e.content.departmentId === s.departmentId) &&
            (!s.state ||
              (s.state === "pending"
                ? ["open", "in-progress"].includes(e.issueState)
                : e.issueState === s.state)) &&
            (!s.dueFrom || e.content.dueDate >= s.dueFrom) &&
            (!s.dueTo || e.content.dueDate <= s.dueTo) &&
            (s.responsibleId === undefined ||
              e.responsibleId === s.responsibleId) &&
            (!s.externalReference ||
              e.content.externalReference.includes(s.externalReference)) &&
            (!s.condition || e.content.condition === s.condition),
        );
        return route.fulfill({
          json: { entries: matching, total: matching.length, nextCursor: "" },
        });
      }
      if (path.endsWith("/handover/history")) {
        const entry = entries.find(
          (e) => e.id === route.request().postDataJSON().id,
        )!;
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
      if (path.endsWith("/handover/change")) {
        const change = route.request().postDataJSON();
        entries = entries.map((e) =>
          e.id === change.id
            ? { ...e, issueState: change.state, revision: e.revision + 1 }
            : e,
        );
        return route.fulfill({ json: entries.find((e) => e.id === change.id) });
      }
      throw new Error(`Unexpected request ${path}`);
    });
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: "Shift Handover", exact: true })
      .click();
    const tabs = page.getByRole("navigation", { name: "Handover views" });
    await expect(tabs.getByRole("button")).toHaveText([
      "Meeting preparation",
      "Journal",
      "Department matrix",
      "My entries",
    ]);
    await expect(
      tabs.getByRole("button", { name: "Meeting preparation", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByLabel("Selected department").selectOption("hall-a");
    const daily = page.getByLabel("Daily category canvas");
    await expect(
      daily.getByRole("button", { name: /^Today problem/ }),
    ).toBeVisible();
    await expect(daily.getByRole("button", { name: /^Prior/ })).toHaveCount(0);
    const status = page.locator("details").filter({
      has: page.locator("summary").filter({ hasText: "Department status" }),
    });
    await status.locator("summary").click();
    await expect(
      status.getByRole("button", { name: /^Prior performance/ }),
    ).toBeVisible();
    await expect(
      status.getByRole("button", {
        name: /^Prior safety|^Closed problem|^Future problem|^Other Halle/,
      }),
    ).toHaveCount(0);
    await status.getByRole("button", { name: /^Prior performance/ }).click();
    await page
      .getByRole("button", { name: "Close issue", exact: true })
      .click();
    await page
      .getByLabel("Resolution outcome")
      .fill("Verified for the next shift.");
    await page
      .getByRole("button", { name: "Save update", exact: true })
      .click();
    await page
      .getByRole("navigation", { name: "Breadcrumb" })
      .getByRole("button", { name: "Meeting preparation", exact: true })
      .click();
    await expect(
      status.getByRole("button", { name: /^Prior performance/ }),
    ).toHaveCount(0);
    await tabs.getByRole("button", { name: "Journal", exact: true }).click();
    await expect(page.getByLabel("Journal date")).toHaveValue("2026-10-01");
    const journal = page.locator(".handover-board");
    await expect(
      journal.getByRole("button", { name: /^Today safety/ }),
    ).toBeVisible();
    await expect(
      journal.getByRole("button", { name: /^Prior safety/ }),
    ).toHaveCount(0);
    await page.getByLabel("Journal date").fill("2026-09-30");
    await expect(
      journal.getByRole("button", { name: /^Prior safety/ }),
    ).toBeVisible();
    await expect(journal.getByRole("button", { name: /^Today/ })).toHaveCount(
      0,
    );
    const scope = page.locator(".iop-scope-toolbar");
    if (width > 620) {
      const department = await scope
        .locator(".iop-department-scope")
        .boundingBox();
      const date = await scope.locator(".iop-date-field").boundingBox();
      expect(Math.abs(department!.y - date!.y)).toBeLessThan(2);
      expect(department!.width).toBeLessThan(480);
      expect(date!.x - department!.x - department!.width).toBeLessThanOrEqual(
        12,
      );
      expect(date!.height).toBeCloseTo(department!.height, 0);
    }
    for (const field of await scope.locator(".iop-context-field").all()) {
      const label = await field.locator(":scope > span").boundingBox();
      const control = await field.locator("input, select").boundingBox();
      expect(control!.x).toBeGreaterThan(label!.x + label!.width);
      expect(
        Math.abs(
          label!.y + label!.height / 2 - control!.y - control!.height / 2,
        ),
      ).toBeLessThan(2);
    }
    await journal
      .getByLabel("Safety", { exact: true })
      .getByRole("button", { name: /^View entries/ })
      .click();
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb).toHaveText(/Shift Handover.*Journal.*Safety/);
    await page.getByRole("button", { name: /^Prior safety/ }).click();
    await expect(breadcrumb).toHaveText(
      /Shift Handover.*Journal.*Safety.*Details/,
    );
    await breadcrumb
      .getByRole("button", { name: "Safety", exact: true })
      .click();
    await expect(page.getByLabel("Journal date")).toHaveValue("2026-09-30");
    await expect(page.getByLabel("Selected department")).toHaveValue("hall-a");
    await page.screenshot({
      path: `/tmp/iop-191-compact-journal-category-${width}.png`,
      fullPage: true,
    });
    await breadcrumb
      .getByRole("button", { name: "Journal", exact: true })
      .click();
    await expect(
      journal.getByRole("button", { name: /^Prior safety/ }),
    ).toBeVisible();
    await expect(page.getByLabel("Journal date")).toHaveValue("2026-09-30");
    await expect(page.getByLabel("Selected department")).toHaveValue("hall-a");
    await journal
      .getByLabel("Information", { exact: true })
      .getByRole("button", { name: /^View entries/ })
      .click();
    await expect(page.getByText("No updates for this selection")).toBeVisible();
    await breadcrumb
      .getByRole("button", { name: "Journal", exact: true })
      .click();
    await expect(journal).toBeVisible();
    await page.screenshot({
      path: `/tmp/iop-191-compact-journal-${width}.png`,
      fullPage: true,
    });
    await tabs
      .getByRole("button", { name: "Meeting preparation", exact: true })
      .click();
    await expect(page.getByLabel("Meeting date")).toHaveValue("2026-09-30");
    await page.screenshot({
      path: `/tmp/iop-191-compact-daily-${width}.png`,
      fullPage: true,
    });
    await tabs
      .getByRole("button", { name: "Department matrix", exact: true })
      .click();
    const matrix = page.getByRole("table", {
      name: "Department handover matrix",
    });
    await expect(matrix.getByRole("button", { name: /^Filter / })).toHaveCount(
      5,
    );
    await expect(
      matrix
        .getByRole("columnheader", { name: "What?", exact: true })
        .getByRole("button"),
    ).toHaveCount(0);
    const filter = async (
      label: string,
      fill: (dialog: ReturnType<typeof page.getByRole>) => Promise<void>,
    ) => {
      await matrix
        .getByRole("button", { name: `Filter ${label}`, exact: true })
        .click();
      const dialog = page.getByRole("dialog", {
        name: `Filter ${label}`,
        exact: true,
      });
      await fill(dialog);
      await dialog
        .getByRole("button", { name: "Apply filter", exact: true })
        .click();
      await expect(dialog).toHaveCount(0);
    };
    await filter("Date", async (dialog) => {
      await dialog.getByLabel("From", { exact: true }).fill("2026-10-01");
      await dialog.getByLabel("Through", { exact: true }).fill("2026-10-01");
    });
    await filter("Due date", async (dialog) => {
      await dialog.getByLabel("From", { exact: true }).fill("2026-10-10");
      await dialog.getByLabel("Through", { exact: true }).fill("2026-10-20");
    });
    await filter("Responsible person", async (dialog) => {
      await dialog
        .getByRole("combobox", { name: "Responsible person", exact: true })
        .selectOption("tech");
    });
    await filter("Status", async (dialog) => {
      await dialog.getByLabel("Issue state").selectOption("pending");
      await dialog.getByLabel("Reported condition").selectOption("blocked");
    });
    await filter("Ultimo", async (dialog) => {
      await dialog.getByLabel("Ultimo", { exact: true }).fill("MISSING");
    });
    await expect(matrix.locator("tbody tr")).toHaveCount(0);
    expect(queries.at(-1)).toMatchObject({
      departmentMatrix: true,
      from: "2026-10-01",
      to: "2026-10-01",
      dueFrom: "2026-10-10",
      dueTo: "2026-10-20",
      responsibleId: "tech",
      state: "pending",
      condition: "blocked",
      externalReference: "MISSING",
      cursor: "",
    });
    await matrix
      .getByRole("button", { name: "Filter Ultimo", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Clear filter", exact: true })
      .click();
    await expect(matrix.locator("tbody tr")).toHaveCount(2);
    await expect(
      matrix.getByRole("button", { name: "Filter Date", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/iop-190-matrix-${width}.png`,
      fullPage: true,
    });
    const statusFilter = matrix.getByRole("button", {
      name: "Filter Status",
      exact: true,
    });
    await statusFilter.click();
    const filterDialog = page.getByRole("dialog", {
      name: "Filter Status",
      exact: true,
    });
    await filterDialog
      .getByRole("combobox", { name: "Issue state", exact: true })
      .selectOption("resolved");
    await page.screenshot({ path: `/tmp/iop-190-filter-${width}.png` });
    await page.keyboard.press("Escape");
    await expect(filterDialog).toHaveCount(0);
    await expect(statusFilter).toBeFocused();
    await expect(matrix.locator("tbody tr")).toHaveCount(2);
  });
}

import { expect, test } from "@playwright/test";
import { emptyWorkforce } from "./workforce-fixture";

for (const width of [1440, 1024, 375]) {
  test(`shared entry grids, account menu and notification navigation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.clock.install();
    let published = false;
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const entry = (id: number, author = "reader") => ({
      id: `entry-${id}`,
      authorId: author,
      authorName: author === "reader" ? "Alex Morgan" : "Sam Lee",
      createdAt: `2026-10-02T10:00:0${id}.000Z`,
      updatedAt: `2026-10-02T10:00:0${id}.000Z`,
      revision: 1,
      departmentLabel: "Halle A",
      areaLabel: "Conveyor 2",
      categoryLabel: "Safety",
      equipmentReferenceId: "equipment",
      responsibleId: "reader",
      responsibleName: "Alex Morgan",
      issueState: "open",
      highlighted: true,
      highlightedAt: "2026-10-02T10:00:00.000Z",
      content: {
        date: "2026-10-02",
        categoryId: "safety",
        summary: [
          "",
          "Protective guard ready for inspection",
          "Access route secured after maintenance",
          "Drive bearing check scheduled",
          "New report from Sam",
        ][id],
        details:
          "The team has recorded the condition and arranged the next inspection. Follow-up remains available in the full entry.",
        departmentId: "hall-a",
        areaId: "area",
        equipmentCode: "=P20+20.02.04-M1",
        equipmentNamespace: "site-equipment",
        condition: "inspection-needed",
        externalReference: "WO-0142",
        challenge: "",
        cause: "",
        measure: "",
        dueDate: "2026-10-03",
        feedbackDueDate: "2026-10-04",
        discuss: true,
      },
    });
    const queries: Record<string, unknown>[] = [];
    const entries = [entry(1), entry(2), entry(3)];
    const newEntry = entry(4, "colleague");
    await page.route("**/api/v1/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/maintenance/assignments")) return route.fulfill({ json: { records: [], events: [] } });
      if (path.endsWith("/session/context"))
        return route.fulfill({
          json: {
            enabled: true,
            authentication: "password",
            canImport: false,
            canAdminister: false,
            canReadAnalytics: false,
            user: { id: "reader", name: "Alex Morgan", profile: "team-leader" },
            users: [],
            scope: {
              organizationId: "org",
              siteId: "site",
              sourceId: "source",
              siteTimeZone: "UTC",
            },
          },
        });
      if (path.endsWith("/workforce/summary")) return route.fulfill({ json: {
        actorId: emptyWorkforce.actorId, today: "2026-10-06", currentFrom: "2026-10-01", previousFrom: "2026-09-01", previousTo: "2026-09-30",
        homeTargetId: "hall-a", homeTargetLabel: "Halle A", teamLabel: "", scheduledDays: 0, shifts: [], saturdays: 0, sundays: 0,
      } });
      if (path.endsWith("/workforce/board"))
        return route.fulfill({ json: emptyWorkforce });
      if (path.endsWith("/handover/context"))
        return route.fulfill({
          json: {
            actorId: "reader",
            canCoordinate: true,
            people: [{ id: "reader", name: "Alex Morgan" }],
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
      if (path.endsWith("/handover/query")) {
        const selection = route.request().postDataJSON();
        if (selection.notificationsAfter === undefined) queries.push(selection);
        const selected =
          selection.notificationsAfter !== undefined
            ? published && newEntry.createdAt > selection.notificationsAfter
              ? [newEntry]
              : []
            : entries;
        return route.fulfill({
          json: { entries: selected, total: selected.length, nextCursor: "" },
        });
      }
      if (path.endsWith("/handover/history"))
        return route.fulfill({
          json: { entry: newEntry, revisions: [], nextBefore: 0 },
        });
      throw new Error(`Unexpected operational shell request: ${path}`);
    });
    const screenshot = async (name: string) => {
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `/tmp/iop-193-${name}-${width}.png`,
        fullPage: true,
      });
    };
    const grid = async () => {
      const cards = page.locator(
        ".handover-expanded-cards .handover-summary-card",
      );
      await expect(cards).toHaveCount(3);
      const boxes = await cards.evaluateAll((nodes) =>
        nodes.map((node) => {
          const { x, y, width } = node.getBoundingClientRect();
          return { x, y, width };
        }),
      );
      const columns = width === 1440 ? 3 : width === 1024 ? 2 : 1;
      expect(
        boxes.filter((box) => Math.abs(box.y - boxes[0].y) < 2),
      ).toHaveLength(columns);
      expect(boxes[0].width).toBeGreaterThan(250);
    };
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Welcome, Alex Morgan" }),
    ).toBeVisible();
    await grid();
    for (const name of [/Open reports/, /^Shift Handover/, /Needs attention/]) {
      await page
        .getByRole("navigation", { name: "Operational updates" })
        .getByRole("button", { name })
        .click();
      await grid();
    }
    await screenshot("start");
    const account = page.getByRole("button", { name: "User menu" });
    await expect(account).toHaveText("AM");
    await account.focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("dialog", { name: "User menu" });
    await expect(
      menu.getByRole("button", { name: "My profile" }),
    ).toBeFocused();
    await expect(menu.getByText("Alex Morgan", { exact: true })).toBeVisible();
    await expect(menu.getByText("Team Leader", { exact: true })).toBeVisible();
    await expect(
      menu.getByLabel("Language", { exact: true }).locator("option"),
    ).toHaveText(["DE", "EN"]);
    await screenshot("account");
    await page.keyboard.press("Escape");
    await expect(account).toBeFocused();
    await expect(menu).toHaveCount(0);
    await account.click();
    await menu.getByRole("button", { name: "My profile" }).click();
    const profile = page.getByRole("dialog", { name: "Edit name" });
    await expect(profile.getByRole("textbox")).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(profile.getByRole("textbox")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(account).toBeFocused();
    await account.click();
    await menu.getByLabel("Language", { exact: true }).selectOption("de");
    await expect(
      page.getByRole("button", { name: "Benutzermenü" }),
    ).toBeVisible();
    await page.getByLabel("Sprache", { exact: true }).selectOption("en");
    await page.locator("#analysis-main").click({ position: { x: 2, y: 2 } });
    await expect(menu).toHaveCount(0);

    await page
      .getByRole("button", { name: "Notifications", exact: true })
      .click();
    let notices = page.getByRole("dialog", {
      name: "Notifications",
      exact: true,
    });
    await expect(notices.getByText("You're all caught up.")).toBeVisible();
    await page.keyboard.press("Escape");
    published = true;
    await page.clock.runFor(30_000);
    await expect(page.locator(".iop-notification-count")).toHaveText("1");
    await page
      .getByRole("button", { name: "Notifications", exact: true })
      .click();
    await expect(notices.getByText("New report from Sam")).toBeVisible();
    await expect(notices.locator("time")).toContainText("10:00");
    await screenshot("notifications");
    await notices.getByRole("button", { name: /New report from Sam/ }).click();
    await expect(
      page.getByRole("heading", { name: "New report from Sam" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Notifications", exact: true })
      .click();
    await notices.getByRole("button", { name: "Mark all as read" }).click();
    await expect(notices.getByText("You're all caught up.")).toBeVisible();
    await page.reload();
    await page
      .getByRole("button", { name: "Notifications", exact: true })
      .click();
    await expect(notices.getByText("You're all caught up.")).toBeVisible();
    await page.keyboard.press("Escape");

    await page
      .getByRole("button", { name: "Shift Handover", exact: true })
      .click();
    const add = page.getByRole("button", { name: "New entry", exact: true });
    await expect(add).toHaveText("");
    await expect(add.locator("svg")).toHaveCount(1);
    await screenshot("daily");
    await page.getByRole("button", { name: "My entries", exact: true }).click();
    await grid();
    await screenshot("mine");
    await page
      .getByRole("button", { name: "Department matrix", exact: true })
      .click();
    const table = page.getByRole("table", {
      name: "Department handover matrix",
    });
    await expect(table.locator("tbody tr")).toHaveCount(3);
    await expect.poll(() => queries.at(-1)?.departmentMatrix).toBe(true);
    expect(
      await table
        .getByRole("columnheader")
        .evaluateAll((headers) =>
          headers.every((h) => getComputedStyle(h).textAlign === "center"),
        ),
    ).toBe(true);
    expect(
      await table
        .locator("tbody tr")
        .first()
        .locator("td")
        .first()
        .evaluate((node) => getComputedStyle(node).textAlign),
    ).toBe("center");
    await screenshot("matrix");
    const search = page.getByRole("button", {
      name: "Search history",
      exact: true,
    });
    await expect(search).toHaveText("");
    await search.click();
    await expect(
      page.getByRole("dialog", { name: "Search handover history" }),
    ).toBeVisible();
    const history = page.getByRole("dialog", {
      name: "Search handover history",
    });
    await history
      .getByLabel("Category filter", { exact: true })
      .selectOption("safety");
    await history
      .getByRole("button", { name: "Search entries", exact: true })
      .click();
    await expect.poll(() => queries.at(-1)?.departmentMatrix).toBe(false);
    expect(queries.at(-1)?.categoryId).toBe("safety");
    await page
      .getByRole("button", { name: "Clear search", exact: true })
      .click();
    await expect.poll(() => queries.at(-1)?.departmentMatrix).toBe(true);
    expect(queries.at(-1)?.categoryId).toBe("");
    expect(errors).toEqual([]);
  });
}

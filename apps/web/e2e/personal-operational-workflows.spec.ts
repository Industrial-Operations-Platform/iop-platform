import { expect, test } from "@playwright/test";
import { emptyRecord } from "../src/features/maintenance/domain/models";

for (const width of [1440, 375]) {
  test(`personal Start, historical daily and focused maintenance at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.clock.setFixedTime(new Date("2026-10-06T08:00:00.000Z"));
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const locations = ["a", "b"].map((id) => ({
      id: `hall-${id}`,
      label: `Halle ${id.toUpperCase()}`,
      parentId: "",
      role: "department",
      sectorKey: "",
    }));
    const categories = [
      "Safety",
      "Information",
      "Successes",
      "People",
      "Performance",
      "Problems",
    ].map((label) => ({
      id: label.toLowerCase(),
      label,
      coordinatorOnly: label === "Information",
      carryForward: ["Problems", "Performance"].includes(label),
    }));
    const entry = (
      id: string,
      date: string,
      categoryId: string,
      departmentId = "hall-b",
      condition = "",
    ) => ({
      id,
      authorId: "tech",
      authorName: "Taylor Technician",
      responsibleId: "tech",
      responsibleName: "Taylor Technician",
      createdAt: `${date}T08:00:00.000Z`,
      updatedAt: `${date}T08:00:00.000Z`,
      revision: 1,
      departmentLabel: departmentId === "hall-a" ? "Halle A" : "Halle B",
      areaLabel: "",
      categoryLabel: categoryId,
      equipmentReferenceId: "",
      issueState: ["problems", "performance"].includes(categoryId)
        ? "open"
        : "none",
      highlighted: false,
      highlightedAt: "",
      content: {
        date,
        categoryId,
        summary: id,
        details: "Operational context",
        departmentId,
        areaId: "",
        equipmentCode: "",
        equipmentNamespace: "site-equipment",
        condition,
        externalReference: "",
        challenge: "",
        cause: "",
        measure: "",
        dueDate: "",
        feedbackDueDate: "",
        discuss: true,
      },
    });
    let reports = [
      entry(
        "Blocked conveyor B",
        "2026-10-06",
        "problems",
        "hall-b",
        "blocked",
      ),
      entry("Routine inspection B", "2026-10-06", "performance"),
      entry(
        "Blocked conveyor A",
        "2026-10-06",
        "problems",
        "hall-a",
        "blocked",
      ),
      entry("Historical briefing", "2026-09-28", "information"),
      entry("Today's briefing", "2026-10-06", "information"),
      entry("Historical people", "2026-09-28", "people"),
    ];
    let repair = {
      id: "repair",
      revision: 1,
      data: {
        ...emptyRecord("normal"),
        title: "Inspect guard",
        locationId: "hall-b",
        assigneeId: "leader",
      },
      authorId: "leader",
      authorName: "Morgan Leader",
      createdAt: "2026-10-05T08:00:00.000Z",
      updatedAt: "2026-10-05T08:00:00.000Z",
      locationLabel: "Halle B",
      assetName: "",
      priorityLabel: "Normal",
      assigneeName: "Morgan Leader",
      teamLabel: "Operations",
      canEdit: true,
      canReassign: true,
    };
    const writes: any[] = [];
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
            user: {
              id: "leader",
              name: "Morgan Leader",
              profile: "team-leader",
            },
            users: [],
            scope: {
              organizationId: "org",
              siteId: "site",
              sourceId: "source",
              siteTimeZone: "Europe/Zurich",
            },
          },
        });
      if (path.endsWith("/workforce/summary"))
        return route.fulfill({
          json: {
            actorId: "leader",
            today: "2026-10-06",
            currentFrom: "2026-10-01",
            previousFrom: "2026-09-01",
            previousTo: "2026-09-30",
            homeTargetId: "hall-a",
            homeTargetLabel: "Halle A",
            teamLabel: "Operations",
            scheduledDays: 20,
            shifts: [
              { id: "early", label: "Early", count: 12, percentage: 60 },
              { id: "late", label: "Late", count: 8, percentage: 40 },
            ],
            saturdays: 1,
            sundays: 1,
          },
        });
      if (path.endsWith("/workforce/board")) {
        const { from, to } = route.request().postDataJSON();
        const days: string[] = [];
        for (
          let d = Date.parse(`${from}T12:00:00Z`);
          d <= Date.parse(`${to}T12:00:00Z`);
          d += 86400000
        )
          days.push(new Date(d).toISOString().slice(0, 10));
        return route.fulfill({
          json: {
            actorId: "leader",
            timeZone: "Europe/Zurich",
            canPlan: true,
            canAdminister: false,
            people: [],
            settings: {
              shifts: [
                {
                  id: "early",
                  label: "Early",
                  start: "05:00",
                  end: "14:15",
                  days: [1, 2, 3, 4, 5, 6, 0],
                },
              ],
              targets: locations.map((l) => ({ ...l, phone: "" })),
              teams: [],
            },
            records: days.flatMap((date) => [
              {
                id: `${date}:schedule`,
                kind: "schedule",
                deleted: false,
                revision: 1,
                personName: "Morgan Leader",
                data: {
                  userId: "leader",
                  date,
                  status: "work",
                  start: "05:00",
                  end: "14:15",
                },
              },
              {
                id: `${date}:assignment`,
                kind: "assignment",
                deleted: false,
                revision: 1,
                personName: "Morgan Leader",
                data: {
                  userId: "leader",
                  date,
                  shiftId: "early",
                  targetId: date === "2026-10-06" ? "hall-b" : "hall-a",
                  duty: "zone",
                  phone: "",
                  start: "05:00",
                  end: "14:15",
                  startsAt: `${date}T03:00:00.000Z`,
                  endsAt: `${date}T12:15:00.000Z`,
                },
              },
            ]),
          },
        });
      }
      if (path.endsWith("/handover/default-location")) return route.fulfill({ json: { departmentId: "" } });
      if (path.endsWith("/handover/context"))
        return route.fulfill({
          json: {
            actorId: "leader",
            canCoordinate: true,
            canDelete: false,
            timeZone: "Europe/Zurich",
            locations,
            categories,
            people: [
              { id: "leader", name: "Morgan Leader" },
              { id: "tech", name: "Taylor Technician" },
            ],
            externalSystemLabel: "External work reference",
          },
        });
      if (path.endsWith("/handover/query")) {
        const s = route.request().postDataJSON();
        if (s.notificationsAfter)
          return route.fulfill({
            json: { entries: [], total: 0, nextCursor: "" },
          });
        if (s.resolvedForMe)
          return route.fulfill({
            json: { entries: [], total: 3, nextCursor: "" },
          });
        const entries = reports.filter(
          (e) =>
            (!s.departmentId || e.content.departmentId === s.departmentId) &&
            (!s.categoryId || e.content.categoryId === s.categoryId) &&
            (!s.from || e.content.date >= s.from) &&
            (!s.to || e.content.date <= s.to) &&
            (!s.state || e.issueState === "open") &&
            (!s.attention || e.content.condition === "blocked") &&
            (!s.excludeAttention || e.content.condition !== "blocked") &&
            (!s.highlights || e.highlighted),
        );
        return route.fulfill({
          json: { entries, total: entries.length, nextCursor: "" },
        });
      }
      if (path.endsWith("/handover/entries")) {
        const body = route.request().postDataJSON();
        writes.push(body);
        const saved = {
          ...entry(
            body.content.summary,
            body.content.date,
            body.content.categoryId,
          ),
          content: body.content,
          mentionedPeople: [{ id: "tech", name: "Taylor Technician" }],
        };
        reports = [...reports, saved];
        return route.fulfill({ json: saved });
      }
      if (path.endsWith("/handover/history"))
        return route.fulfill({
          json: {
            entry: reports.find(
              (e) => e.id === route.request().postDataJSON().id,
            ),
            revisions: [],
            nextBefore: 0,
          },
        });
      if (path.endsWith("/maintenance/assignments"))
        return route.fulfill({ json: { records: [repair], events: [] } });
      if (path.endsWith("/maintenance/catalog"))
        return route.fulfill({
          json: {
            actorId: "leader",
            canContribute: true,
            canCoordinate: true,
            canAdminister: false,
            people: [{ id: "leader", name: "Morgan Leader" }],
            teams: [],
            locations,
            assets: [],
            settings: {
              revision: 1,
              priorities: [{ id: "normal", label: "Normal", rank: 1 }],
            },
          },
        });
      if (path.endsWith("/maintenance/query"))
        return route.fulfill({
          json: {
            records: [repair],
            total: 1,
            nextCursor: "",
            statusCounts: { open: 1, "in-progress": 0, blocked: 0, done: 0 },
          },
        });
      if (path.endsWith("/maintenance/history"))
        return route.fulfill({
          json: { record: repair, revisions: [], nextBefore: 0 },
        });
      if (path.endsWith("/maintenance/related"))
        return route.fulfill({
          json: { entries: [], total: 0, nextCursor: "" },
        });
      if (path.endsWith("/maintenance/save")) {
        const body = route.request().postDataJSON();
        writes.push(body);
        repair = { ...repair, data: body.data, revision: repair.revision + 1 };
        return route.fulfill({ json: repair });
      }
      throw new Error(`Unexpected request ${path}`);
    });
    const screenshot = async (name: string) => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name).toBe(true);
      await page.screenshot({
        path: `/tmp/iop-196-${name}-${width}.png`,
        fullPage: true,
      });
    };
    await page.goto("/");
    const profile = page.getByRole("region", { name: "Profile", exact: true });
    await expect(profile.getByText("Assigned reports resolved")).toBeVisible();
    await expect(profile.getByText("60%", { exact: true })).toBeVisible();
    const updates = page.getByRole("region", {
      name: "Operational handover updates",
    });
    await expect(
      updates.getByRole("button", { name: /Blocked conveyor B/ }),
    ).toBeVisible();
    await expect(updates.getByText("Blocked conveyor A")).toHaveCount(0);
    await updates.getByRole("button", { name: /Open reports/ }).click();
    await expect(
      updates.getByRole("button", { name: /Routine inspection B/ }),
    ).toBeVisible();
    await expect(updates.getByText("Blocked conveyor B")).toHaveCount(0);
    await screenshot("start");
    await updates
      .getByText("Explore other departments", { exact: true })
      .click();
    await updates.getByLabel("Browse departments").selectOption("hall-a");
    await updates.getByRole("button", { name: /Needs attention/ }).click();
    await expect(
      updates.getByRole("button", { name: /Blocked conveyor A/ }),
    ).toBeVisible();
    await updates
      .getByText("Explore other departments", { exact: true })
      .click();
    await expect(
      updates.getByRole("button", { name: /Blocked conveyor B/ }),
    ).toBeVisible();
    const assignment = page.getByRole("region", {
      name: "Your assignment",
      exact: true,
    });
    await assignment.getByLabel("Assignment date").fill("2026-10-07");
    await expect(
      assignment.getByText("Halle A", { exact: true }),
    ).toBeVisible();
    await assignment.getByRole("button", { name: "Week", exact: true }).click();
    await expect(assignment.locator(".workforce-start-day")).toHaveCount(7);
    await screenshot("week");
    const navigation = page.getByRole("navigation", {
      name: "Main navigation",
    });
    await navigation
      .getByRole("button", { name: "Shift Handover", exact: true })
      .click();
    const daily = page.getByLabel("Daily category canvas");
    await expect(
      daily.getByText("Today's briefing", { exact: true }),
    ).toBeVisible();
    const safety = daily.getByRole("region", { name: "Safety section", exact: true });
    expect((await safety.boundingBox())!.height).toBeLessThan(160);
    expect(await safety.locator(".handover-meeting-title").evaluate((heading) => {
      const label = document.createRange();
      label.selectNodeContents(heading.firstChild!);
      const count = heading.querySelector(".iop-badge")!.getBoundingClientRect();
      return count.left - label.getBoundingClientRect().right;
    })).toBeLessThan(12);
    await page.getByLabel("Overview date").fill("2026-09-28");
    await expect(
      daily.getByText("Historical briefing", { exact: true }),
    ).toBeVisible();
    await expect(
      daily.getByText("Historical people", { exact: true }),
    ).toBeVisible();
    await expect(
      daily.getByText("Today's briefing", { exact: true }),
    ).toHaveCount(0);
    await page
      .locator("summary")
      .filter({ hasText: "Department status" })
      .click();
    const outstanding = page.getByLabel("Outstanding department topics");
    await expect(
      outstanding.getByRole("button", { name: /Blocked conveyor B/ }),
    ).toBeVisible();
    await screenshot("daily-history");
    await daily.getByRole("button", { name: "Add Information update" }).click();
    const dialog = page.getByRole("dialog", { name: "New handover entry" });
    await expect(dialog.getByLabel("Date", { exact: true })).toHaveValue(
      "2026-09-28",
    );
    await dialog
      .getByLabel("Summary", { exact: true })
      .fill("Meeting instruction");
    await dialog.getByLabel("Mention people").selectOption("tech");
    const dataUrl = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 160;
      const c = canvas.getContext("2d")!;
      c.fillStyle = "#172b43";
      c.fillRect(0, 0, 320, 160);
      return canvas.toDataURL("image/png");
    });
    await dialog
      .getByLabel("Attach images")
      .setInputFiles({
        name: "inspection.png",
        mimeType: "image/png",
        buffer: Buffer.from(dataUrl.split(",")[1], "base64"),
      });
    await expect(
      dialog.getByRole("img", { name: "inspection.png" }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Publish update" }).click();
    await expect(
      page.getByRole("heading", { name: "Meeting instruction", exact: true }),
    ).toBeVisible();
    expect(writes[0].content).toMatchObject({
      mentionIds: ["tech"],
      date: "2026-09-28",
      images: [
        {
          name: "inspection.png",
          dataUrl: expect.stringMatching(/^data:image\/jpeg;base64,/),
        },
      ],
    });
    await navigation
      .getByRole("button", { name: "Maintenance", exact: true })
      .click();
    await page
      .getByRole("button", { name: /Inspect guard/ })
      .first()
      .click();
    await page.getByRole("button", { name: "Move to In progress" }).click();
    await expect(
      page.getByRole("button", { name: "Move to Open" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Mark as done" }).click();
    const completion = page.getByRole("dialog", {
      name: "Complete maintenance",
    });
    await completion
      .getByLabel("Work outcome", { exact: true })
      .fill("Guard inspected and workplace checked.");
    await completion
      .getByLabel("All tasks in this maintenance are complete.")
      .check();
    await completion
      .getByLabel(
        "I confirm the workplace and equipment shown above are correct.",
      )
      .check();
    await expect(
      completion.getByRole("button", { name: "Mark as done" }),
    ).toBeEnabled();
    await screenshot("maintenance-completion");
    await completion.getByRole("button", { name: "Mark as done" }).click();
    await expect(completion).toHaveCount(0);
    await expect(page.getByText("Done", { exact: true }).first()).toBeVisible();
    expect(writes.at(-1).data.status).toBe("done");
    expect(errors).toEqual([]);
  });
}

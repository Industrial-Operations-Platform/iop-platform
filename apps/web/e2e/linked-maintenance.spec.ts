import { expect, test } from "@playwright/test";
import { installMaintenanceAssetsFixture } from "./maintenance-assets-fixture";

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`manual repair scope and contextual report return at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const { requests } = await installMaintenanceAssetsFixture(
      page,
      "team-leader",
    );
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: "Maintenance", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Bearing inspection", exact: false })
      .click();
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await expect(page.getByLabel("Maintenance category")).toHaveValue(
      "corrective",
    );
    await page
      .getByLabel("Repair target / manual zone")
      .fill("Cassette direction mechanism and motor roller");
    for (const code of ["DRIVE-01", "=11+11.11.02-B102.1"]) {
      await page.getByLabel("Exact equipment code", { exact: true }).fill(code);
      await page
        .getByRole("button", { name: "Add equipment code", exact: true })
        .click();
    }
    await expect(
      page.getByText("Showing 2 of 2 related reports."),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Vibration reported", exact: false })
      .click();
    await expect(
      page.getByRole("heading", { name: "Vibration reported", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Related operational reports", exact: true })
      .click();
    await expect(page.getByLabel("Repair target / manual zone")).toHaveValue(
      "Cassette direction mechanism and motor roller",
    );
    await expect(
      page.getByRole("button", {
        name: "Remove equipment code =11+11.11.02-B102.1",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("combobox", { name: "Status", exact: true })
      .selectOption("done");
    await page
      .getByLabel("Work outcome")
      .fill(
        "Direction cassette repaired; motor roller still needs a separate inspection.",
      );
    await page
      .getByLabel("Change reason")
      .fill("Review the actual repair scope before closure.");
    const save = page.getByRole("button", {
      name: "Save maintenance",
      exact: true,
    });
    await expect(save).toBeDisabled();
    await page
      .getByLabel("Scope for Vibration reported", { exact: true })
      .selectOption("include");
    await page
      .getByLabel("Scope for Cassette direction error", { exact: true })
      .selectOption("exclude");
    await expect(save).toBeDisabled();
    await page
      .getByLabel("Exclusion reason", { exact: true })
      .fill("The motor roller investigation was not part of this repair.");
    await expect(save).toBeEnabled();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `test-results/IOP-194-linked-repair-${viewport.width}.png`,
      fullPage: true,
    });
    await save.click();
    await expect(page.getByText("Maintenance saved.")).toBeVisible();
    const saved = requests
      .filter((request) => request.path.endsWith("/maintenance/save"))
      .at(-1)!.data.data;
    expect(saved.category).toBe("corrective");
    expect(
      saved.equipment.map((target: { code: string }) => target.code),
    ).toEqual(["DRIVE-01", "=11+11.11.02-B102.1"]);
    expect(
      saved.linkedEntries
        .map((entry: { disposition: string }) => entry.disposition)
        .sort(),
    ).toEqual(["exclude", "include"]);
    expect(
      saved.linkedEntries.find(
        (entry: { disposition: string }) => entry.disposition === "exclude",
      ).reason,
    ).toContain("not part");
    expect(errors).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("worker assignments appear on Start and in assignment activity", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-10-06T08:00:00Z"));
  await installMaintenanceAssetsFixture(page, "technician");
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Your maintenance assignments",
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Notifications/ }).click();
  await expect(
    page.getByRole("heading", { name: "Maintenance assignments", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Bearing inspection/ })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "Bearing inspection", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Responsible person", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("combobox", { name: "Team", exact: true }),
  ).toBeDisabled();
});

test("selected status fills a three-card desktop row and hides other statuses", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await installMaintenanceAssetsFixture(page, "team-leader");
  await page.route("**/api/v1/maintenance/query", async (route) =>
    route.fulfill({
      json: {
        records: Array.from({ length: 3 }, (_, index) => ({
          id: `open-work-${index}`,
          revision: 1,
          data: {
            title: `Zone repair ${index + 1}`,
            details: "Investigate the selected zone.",
            locationId: "assembly",
            assetId: "",
            priorityId: "normal",
            assigneeId: "admin",
            teamId: "",
            status: "open",
            dueDate: "",
            outcome: "",
            blockedReason: "",
            externalReference: "",
            category: "corrective",
            repairTarget: "Direction cassette",
            equipment: [],
            linkedEntries: [],
          },
          authorId: "admin",
          authorName: "Morgan",
          createdAt: "2026-10-05T08:00:00Z",
          updatedAt: "2026-10-05T08:00:00Z",
          locationLabel: "Assembly",
          assetName: "",
          priorityLabel: "Normal",
          assigneeName: "Morgan",
          teamLabel: "",
          canEdit: true,
          canReassign: true,
        })),
        total: 3,
        nextCursor: "",
        statusCounts: { open: 3, "in-progress": 0, blocked: 0, done: 0 },
      },
    }),
  );
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Maintenance", exact: true })
    .click();
  await page.getByText("Filter maintenance", { exact: true }).click();
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("open");
  const board = page.locator(".maintenance-board--focused");
  await expect(board.locator(".maintenance-column")).toHaveCount(1);
  await expect(board.getByRole("heading", { name: /Open/ })).toBeVisible();
  const cards = board.locator(".maintenance-card");
  await expect(cards).toHaveCount(3);
  const boxes = await cards.evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width };
    }),
  );
  expect(Math.abs(boxes[0].y - boxes[1].y)).toBeLessThan(1);
  expect(Math.abs(boxes[1].y - boxes[2].y)).toBeLessThan(1);
  for (const box of boxes) expect(box.width).toBeGreaterThan(300);
  expect(boxes[0].x).toBeLessThan(boxes[1].x);
  expect(boxes[1].x).toBeLessThan(boxes[2].x);
  await page.screenshot({
    path: "test-results/IOP-194-focused-maintenance-1440.png",
    fullPage: true,
  });
});

test("a Handover problem can seed a corrective maintenance proposal", async ({
  page,
}) => {
  await installMaintenanceAssetsFixture(page, "team-leader");
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Assets", exact: true })
    .click();
  await page.getByRole("button", { name: "DRIVE-01", exact: true }).click();
  await page
    .getByRole("button", { name: "Shift Handover 1", exact: true })
    .click();
  await expect(page.getByText("Showing 1 of 1 records.")).toBeVisible();
  await page
    .getByRole("button", { name: "Open source record", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Vibration reported", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Plan maintenance", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "New maintenance", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Maintenance category", exact: true }),
  ).toHaveValue("corrective");
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    "Vibration reported",
  );
  await expect(
    page.getByRole("button", {
      name: "Remove equipment code DRIVE-01",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Scope for Vibration reported", { exact: true }),
  ).toHaveValue("include");
});

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`code-based asset registration and source choices at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const { requests } = await installMaintenanceAssetsFixture(
      page,
      "administrator",
    );
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: "Assets", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Register asset", exact: true })
      .click();
    const chooser = page.getByRole("region", {
      name: "Choose reported equipment",
    });
    await expect(chooser).toBeVisible();
    const code = page.getByLabel(
      "Equipment identifier (Betriebsmittelkennzeichen)",
      { exact: true },
    );
    const positions = await Promise.all([
      chooser.boundingBox(),
      code.boundingBox(),
    ]);
    expect(positions[0]!.y).toBeLessThan(positions[1]!.y);
    await page
      .getByRole("combobox", { name: "Asset Halle", exact: true })
      .selectOption("assembly");
    await page
      .getByRole("combobox", { name: "Asset Bereich", exact: true })
      .selectOption("assembly-line1");
    const reported = page.getByRole("combobox", {
      name: "Reported equipment identifier",
      exact: true,
    });
    await expect(reported).toBeEnabled();
    const option = reported
      .locator("option")
      .filter({ hasText: "=11+11.11.02-B102.1" })
      .first();
    await reported.selectOption((await option.getAttribute("value"))!);
    await expect(code).toHaveValue("=11+11.11.02-B102.1");
    await expect(page.getByLabel("Asset name", { exact: true })).toHaveCount(0);
    await expect(
      page.getByRole("combobox", {
        name: "Asset identity status",
        exact: true,
      }),
    ).toHaveValue("unverified");
    await expect(
      page.getByRole("combobox", { name: "Source ID", exact: true }),
    ).toHaveValue("daily-alarms");
    await expect(
      page.getByRole("combobox", { name: "Source sector", exact: true }),
    ).toHaveValue("Assembly");
    await expect(
      page.getByRole("combobox", { name: "Source area", exact: true }),
    ).toHaveValue("Line 1");
    await expect(
      page.getByRole("combobox", {
        name: "Source equipment code",
        exact: true,
      }),
    ).toHaveValue("=11+11.11.02-B102.1");
    await page
      .getByRole("combobox", { name: "Component type", exact: true })
      .selectOption("Cassette");
    await page
      .getByLabel("Manual group / location within Bereich", { exact: true })
      .fill("Buffer 1");
    const chooserBounds = await chooser.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        right: rect.right,
        controls: [...element.querySelectorAll("input, select")].map(
          (control) => ({
            left: control.getBoundingClientRect().left,
            right: control.getBoundingClientRect().right,
          }),
        ),
      };
    });
    expect(chooserBounds.right).toBeLessThanOrEqual(viewport.width);
    for (const control of chooserBounds.controls)
      expect(control.right).toBeLessThanOrEqual(chooserBounds.right + 1);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `test-results/IOP-194-code-registration-${viewport.width}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Save asset", exact: true }).click();
    await expect(page.getByText("Asset saved.")).toBeVisible();
    const saved = requests
      .filter((request) => request.path.endsWith("/assets/save"))
      .at(-1)!.data.content;
    expect(saved.name).toBe(saved.code);
    expect(saved.code).toBe("=11+11.11.02-B102.1");
    expect(saved.type).toBe("Cassette");
    expect(saved.locationDetails).toBe("Buffer 1");
    expect(saved.status).toBe("unverified");
    expect(saved.locationId).toBe("assembly-line1");
    expect(saved.aliases).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          namespace: "analytics",
          sourceId: "daily-alarms",
          code: saved.code,
          sector: "Assembly",
          area: "Line 1",
        }),
        expect.objectContaining({
          namespace: "site-equipment",
          code: saved.code,
          departmentId: "assembly",
          areaId: "assembly-line1",
        }),
      ]),
    );
    expect(errors).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("completed repair distinguishes included members from excluded context", async ({
  page,
}) => {
  const { sourceReport, completedRecord } =
    await installMaintenanceAssetsFixture(page, "administrator");
  const resolved = {
    ...sourceReport,
    issueState: "resolved",
    revision: 2,
    latestUpdate: {
      note: "Maintenance completion outcome",
      actorId: "admin",
      actorName: "Morgan",
      at: "2026-10-05T10:00:00Z",
    },
    content: { ...sourceReport.content, condition: "blocked" },
  };
  const excluded = {
    ...sourceReport,
    id: "secondary-issue",
    content: {
      ...sourceReport.content,
      summary: "Separate motor inspection",
      condition: "blocked",
    },
  };
  const record = {
    ...completedRecord,
    data: {
      ...completedRecord.data,
      linkedEntries: [
        {
          id: resolved.id,
          expectedRevision: 1,
          disposition: "include",
          reason: "",
        },
        {
          id: excluded.id,
          expectedRevision: 1,
          disposition: "exclude",
          reason: "Motor inspection requires a separate intervention.",
        },
      ],
    },
  };
  await page.route("**/api/v1/maintenance/history", (route) =>
    route.fulfill({
      json: {
        record,
        revisions: [
          {
            record,
            actorId: "admin",
            actorName: "Morgan",
            action: "status-changed",
            reason: "Repair completed",
            at: record.updatedAt,
          },
        ],
        nextBefore: 0,
      },
    }),
  );
  await page.route("**/api/v1/maintenance/related", (route) =>
    route.fulfill({
      json: { entries: [resolved, excluded], total: 2, nextCursor: "" },
    }),
  );
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Maintenance", exact: true })
    .click();
  await page.getByRole("button", { name: "Load more", exact: true }).click();
  await page
    .getByRole("button", { name: "Grease guide rollers", exact: false })
    .click();
  await expect(
    page.getByText(
      "Completion closes included open reports only. Excluded reports and related context retain their own status.",
      { exact: true },
    ),
  ).toBeVisible();
  const includedGroup = page.getByRole("region", {
    name: "Included in this repair",
    exact: true,
  });
  const excludedGroup = page.getByRole("region", {
    name: "Excluded from this repair",
    exact: true,
  });
  await expect(
    includedGroup.getByText("Resolved", { exact: true }),
  ).toBeVisible();
  await expect(
    includedGroup.getByText("Reported blocked", { exact: true }),
  ).toHaveCount(0);
  await expect(
    includedGroup.getByText(sourceReport.content.details, { exact: true }),
  ).toBeVisible();
  await expect(
    includedGroup.getByText("Maintenance completion outcome", { exact: true }),
  ).toHaveCount(0);
  await expect(excludedGroup.getByText("Open", { exact: true })).toBeVisible();
  await expect(
    excludedGroup.getByText(
      "Motor inspection requires a separate intervention.",
      { exact: false },
    ),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/IOP-194-completed-membership-1440.png",
    fullPage: true,
  });
});

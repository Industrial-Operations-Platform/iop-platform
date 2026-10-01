import { emptyWorkforce } from "./workforce-fixture";
import { expect, test } from "@playwright/test";

function summaryStyle(element: Element) {
  const card = getComputedStyle(element);
  const title = getComputedStyle(element.querySelector("strong")!);
  const subtitle = getComputedStyle(element.querySelector("span")!);
  return {
    background: card.backgroundColor,
    border: card.borderTopColor,
    radius: card.borderRadius,
    padding: card.padding,
    font: title.font,
    ink: title.color,
    subtitleFont: subtitle.font,
    muted: subtitle.color,
  };
}

for (const width of [1440, 820, 375]) {
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
      latestUpdate: {
        note: "The symptom returned during the next shift. Reopened for inspection.",
        actorName: "Alex",
        at: "2026-09-29T08:00:00Z",
      },
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
          "Inspection found intermittent drive vibration. Check the bearing at the next planned stop before restarting.",
        departmentId: "hall-a",
        areaId: "area-a",
        equipmentCode: "=P20+20.02.04-M1",
        equipmentNamespace: "site-equipment",
        condition: "blocked",
        externalReference: "DEMO-ULTIMO-001",
        challenge: "Recurring vibration during operation",
        cause: "Bearing wear requires confirmation",
        measure: "Inspect the bearing and record the findings",
        dueDate: "2026-09-30",
        feedbackDueDate: "2026-10-01",
        discuss: true,
      },
    };
    const selections: Record<string, unknown>[] = [];
    await page.route("**/api/v1/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/workforce/board")) {
        await route.fulfill({ json: emptyWorkforce });
        return;
      }
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
        selections.push(selection);
        const entries =
          selection.categoryId && selection.categoryId !== "problems"
            ? []
            : [entry];
        const paginated =
          !selection.categoryId &&
          !selection.state &&
          !selection.attention &&
          !selection.highlights;
        return route.fulfill({
          json: {
            entries: selection.cursor
              ? [
                  {
                    ...entry,
                    id: "entry-b",
                    content: {
                      ...entry.content,
                      summary: "Second loaded report",
                    },
                  },
                ]
              : entries,
            total: paginated ? 2 : entries.length,
            nextCursor: paginated && !selection.cursor ? "page-2" : "",
          },
        });
      }
      if (path.endsWith("/handover/history")) {
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
    const operational = page.getByRole("region", {
      name: "Operational handover updates",
    });
    const startViews = operational.getByRole("navigation", {
      name: "Operational updates",
    });
    await expect(
      startViews.getByRole("button", { name: /Needs attention/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      operational.getByRole("region", { name: "Open reports", exact: true }),
    ).toHaveCount(0);
    await expect(operational.locator(".iop-metric-grid")).toHaveCount(0);
    await expect(startViews.getByRole("button")).toHaveCount(3);
    await expect(startViews).toHaveCSS("position", "static");
    const attentionTab = startViews.getByRole("button", {
      name: /Needs attention/,
    });
    await expect(startViews.locator(".iop-view-description")).toHaveCount(0);
    for (const card of await startViews.getByRole("button").all()) {
      await expect(card).toHaveCSS("background-color", "rgb(255, 255, 255)");
    }
    await expect(attentionTab).toHaveCSS("border-bottom-color", "rgb(8, 123, 213)");
    const attentionBounds = await attentionTab.boundingBox();
    const reportsBounds = await startViews
      .getByRole("button", { name: /Open reports/ })
      .boundingBox();
    expect(attentionBounds!.y).toBe(reportsBounds!.y);
    expect(attentionBounds!.width).toBeCloseTo(reportsBounds!.width, 0);
    expect(attentionBounds!.height).toBeLessThanOrEqual(width > 760 ? 52 : 90);
    const tabsBounds = await startViews.boundingBox();
    expect(attentionBounds!.width * 3).toBeCloseTo(tabsBounds!.width, 0);
    for (const tab of await startViews.getByRole("button").all()) {
      await expect(tab.locator(".iop-badge")).toHaveText("1");
      await expect(tab.locator(".iop-badge")).toHaveCSS("font-size", "12px");
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/iop183-start-${width}.png`,
      fullPage: true,
    });
    await startViews.getByRole("button", { name: /Open reports/ }).focus();
    await page.keyboard.press("Enter");
    await expect(
      startViews.getByRole("button", { name: /Open reports/ }),
    ).toHaveCSS("border-bottom-color", "rgb(8, 123, 213)");
    await expect(attentionTab).toHaveAttribute("aria-pressed", "false");
    await expect(attentionTab).toHaveCSS("border-bottom-color", "rgba(0, 0, 0, 0)");
    await expect(
      operational
        .getByRole("region", { name: "Open reports", exact: true })
        .getByRole("button", { name: entry.content.summary, exact: false }),
    ).toBeVisible();
    await startViews.getByRole("button", { name: /Shift Handover/ }).click();
    await expect(operational.getByText(/Site-wide highlights/)).toBeVisible();
    await operational.getByRole("button", { name: "Refresh updates" }).click();
    await expect(
      startViews.getByRole("button", { name: /Shift Handover/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await page
      .getByRole("combobox", { name: "Start department" })
      .selectOption("hall-a");
    await startViews.getByRole("button", { name: /Needs attention/ }).click();
    await operational
      .getByRole("button", { name: /View all attention items/ })
      .click();
    await expect(
      page.getByText("Filtered history", { exact: true }),
    ).toBeVisible();
    expect(selections.at(-1)).toMatchObject({
      departmentId: "hall-a",
      attention: true,
    });
    await home.click();
    const heading = page.getByRole("heading", {
      level: 1,
    });
    const headingStyle = await heading.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        color: style.color,
      };
    });
    await expect(
      page.getByRole("button", { name: "Refresh", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("combobox", { name: "Selected department" })
      .selectOption("hall-a");
    const path = page.getByRole("navigation", { name: "Breadcrumb" });
    const tabs = page.getByRole("navigation", { name: "Handover views" });
    await expect(path.locator('[aria-current="page"]')).toHaveText(
      "Meeting preparation",
    );
    await expect(tabs.getByRole("button")).toHaveText([
      "Meeting preparation",
      "Journal",
      "Department matrix",
      "My entries",
    ]);
    await tabs.getByRole("button", { name: "Journal", exact: true }).click();
    await expect(path.locator('[aria-current="page"]')).toHaveText("Journal");
    const journalCard = page
      .getByRole("region", { name: "Problems", exact: true })
      .getByRole("button", { name: entry.content.summary, exact: false });
    await expect(journalCard).toBeVisible();
    const journalStyle = await journalCard.evaluate(summaryStyle);
    await page.screenshot({
      path: `/tmp/iop182-journal-${width}.png`,
      fullPage: true,
    });
    await journalCard.click();
    await path.getByRole("button", { name: "Journal", exact: true }).click();
    await expect(journalCard).toBeVisible();
    await tabs
      .getByRole("button", { name: "Meeting preparation", exact: true })
      .click();
    await expect(path.locator('[aria-current="page"]')).toHaveText(
      "Meeting preparation",
    );
    await page.getByLabel("Meeting date", { exact: true }).fill("2026-09-28");
    const meeting = page.getByRole("region", { name: "Problems section" });
    await expect(
      meeting.getByRole("button", {
        name: entry.content.summary,
        exact: false,
      }),
    ).toBeVisible();
    expect(
      await meeting
        .getByRole("button", { name: entry.content.summary, exact: false })
        .evaluate(summaryStyle),
    ).toEqual(journalStyle);
    const sectionStyle = await meeting
      .getByRole("heading", { name: "Problems", exact: true })
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          color: style.color,
        };
      });
    const panelStyle = await meeting.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        background: style.backgroundColor,
        border: style.borderTopColor,
        radius: style.borderRadius,
      };
    });
    await page.screenshot({
      path: `/tmp/iop182-meeting-${width}.png`,
      fullPage: true,
    });
    await meeting
      .getByRole("button", { name: entry.content.summary, exact: false })
      .click();
    const detail = page.getByRole("region", {
      name: "Handover entry",
      exact: true,
    });
    await expect(
      detail.getByRole("heading", { name: entry.content.summary }),
    ).toBeVisible();
    const reportHeading = detail.getByRole("heading", {
      name: entry.content.summary,
    });
    expect(
      await reportHeading.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          color: style.color,
        };
      }),
    ).toEqual(sectionStyle);
    expect(
      await reportHeading.locator("..").evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          background: style.backgroundColor,
          border: style.borderTopColor,
          radius: style.borderRadius,
        };
      }),
    ).toEqual(panelStyle);
    const content = detail.locator(".handover-detail-panel");
    await expect(content.getByText("In progress", { exact: true })).toBeVisible();
    await expect(
      content.getByText("Unverified reference", { exact: true }),
    ).toBeVisible();
    for (const value of [
      entry.content.details,
      entry.content.challenge,
      entry.content.cause,
      entry.content.measure,
      entry.content.externalReference,
      entry.content.dueDate,
      entry.content.feedbackDueDate,
    ]) {
      await expect(content.getByText(value, { exact: true })).toBeVisible();
    }
    const descriptionBounds = await content
      .locator(".handover-detail-description")
      .boundingBox();
    const factsBounds = await content
      .locator(".handover-detail-facts")
      .boundingBox();
    if (width > 1000) expect(factsBounds!.x).toBeGreaterThan(descriptionBounds!.x);
    else
      expect(factsBounds!.y).toBeGreaterThanOrEqual(
        descriptionBounds!.y + descriptionBounds!.height,
      );
    const latestUpdate = await detail
      .getByRole("heading", { name: "Latest update" })
      .locator("..")
      .boundingBox();
    const followUp = await detail
      .getByRole("button", { name: "Add follow-up" })
      .boundingBox();
    expect(
      followUp!.y - (latestUpdate!.y + latestUpdate!.height),
    ).toBeGreaterThanOrEqual(16);
    const breadcrumb = detail.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("heading", { level: 1 })).toHaveText(
      /^Shift Handover\s*\/Meeting preparation\/Details$/,
    );
    await expect(
      breadcrumb.getByText("Operations", { exact: true }),
    ).toHaveCount(0);
    await expect(
      breadcrumb.getByText(
        "What happened. What needs attention. What comes next.",
      ),
    ).toBeVisible();
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
      "Details",
    );
    const moduleLink = breadcrumb.getByRole("button", {
      name: "Shift Handover",
      exact: true,
    });
    const detailStyle = await moduleLink.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        color: style.color,
      };
    });
    expect(detailStyle).toEqual(headingStyle);
    await expect(
      detail.getByRole("button", { name: "Reload entry" }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/iop182-detail-${width}.png`,
      fullPage: true,
    });
    const revision = detail.locator("details").first();
    await revision.locator("summary").click();
    await expect(
      revision.getByText(entry.content.measure, { exact: true }),
    ).toBeVisible();
    await expect(
      revision.getByText(entry.content.feedbackDueDate, { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await revision.locator("summary").click();
    const returnToMeeting = breadcrumb.getByRole("button", {
      name: "Meeting preparation",
      exact: true,
    });
    await returnToMeeting.focus();
    await page.keyboard.press("Enter");
    await expect(
      tabs.getByRole("button", { name: "Meeting preparation", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByLabel("Meeting date", { exact: true })).toHaveValue(
      "2026-09-28",
    );
    await expect(
      page.getByRole("combobox", { name: "Selected department" }),
    ).toHaveValue("hall-a");
    await meeting
      .getByRole("button", { name: entry.content.summary, exact: false })
      .click();
    // Regression: selecting the already-active sidebar destination must leave detail.
    await home.click();
    await expect(
      page
        .getByRole("navigation", { name: "Breadcrumb" })
        .locator('[aria-current="page"]'),
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
    if (width === 1440) {
      const prose = matrix.getByText(entry.content.details, { exact: true });
      await expect(prose).toHaveCSS("text-align", "justify");
      await page.setViewportSize({ width: 3600, height: 1000 });
      await expect(prose).toHaveCSS("text-align", "center");
      await page.setViewportSize({ width, height: 1000 });
      await expect(prose).toHaveCSS("text-align", "justify");
    }
    await page.screenshot({
      path: `/tmp/iop182-matrix-${width}.png`,
      fullPage: true,
    });
    await matrix
      .getByRole("cell", { name: "In progress Reported blocked", exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `/tmp/iop182-matrix-status-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "More entries", exact: true })
      .click();
    await expect(
      matrix.getByRole("button", { name: "Second loaded report", exact: true }),
    ).toBeVisible();
    await matrix.getByRole("button", { name: entry.content.summary }).click();
    await expect(breadcrumb.getByRole("heading", { level: 1 })).toHaveText(
      /^Shift Handover\s*\/Department matrix\/Details$/,
    );
    await breadcrumb
      .getByRole("button", { name: "Department matrix", exact: true })
      .click();
    await expect(
      tabs.getByRole("button", { name: "Department matrix", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      matrix.getByRole("button", { name: "Second loaded report", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Search history", exact: true })
      .click();
    const search = page.getByRole("dialog", {
      name: "Search handover history",
    });
    await search
      .getByRole("searchbox", { name: "Search", exact: true })
      .fill("bearing");
    await search
      .getByRole("button", { name: "Search entries", exact: true })
      .click();
    await matrix.getByRole("button", { name: entry.content.summary }).click();
    await breadcrumb
      .getByRole("button", { name: "Department matrix", exact: true })
      .click();
    await expect(
      page.getByText("Filtered history", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Search history", exact: true })
      .click();
    await expect(
      search.getByRole("searchbox", { name: "Search", exact: true }),
    ).toHaveValue("bearing");
    await search
      .getByRole("button", { name: "Close Search handover history" })
      .click();
    await tabs.getByRole("button", { name: "My entries", exact: true }).click();
    await expect(path.locator('[aria-current="page"]')).toHaveText(
      "My entries",
    );
    await page.screenshot({
      path: `/tmp/iop182-mine-${width}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: entry.content.summary, exact: false })
      .click();
    await breadcrumb
      .getByRole("button", { name: "My entries", exact: true })
      .click();
    await expect(
      tabs.getByRole("button", { name: "My entries", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page
      .getByRole("button", { name: entry.content.summary, exact: false })
      .click();
    const moduleHome = detail.getByRole("button", {
      name: "Shift Handover",
      exact: true,
    });
    await moduleHome.focus();
    await page.keyboard.press("Enter");
    await expect(
      page
        .getByRole("navigation", { name: "Breadcrumb" })
        .locator('[aria-current="page"]'),
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
      path: `/tmp/iop182-form-${width}.png`,
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

import { expect, test } from "@playwright/test";
import type {
  Board,
  RecordEntry,
} from "../src/features/workforce/domain/models";
import { weekDates } from "../src/features/workforce/domain/models";

const shifts = [
  {
    id: "early",
    label: "Early shift",
    start: "05:00",
    end: "14:15",
    days: [1, 2, 3, 4, 5],
  },
  {
    id: "middle",
    label: "Middle shift",
    start: "08:45",
    end: "18:00",
    days: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: "late",
    label: "Late shift",
    start: "13:45",
    end: "23:00",
    days: [1, 2, 3, 4, 5],
  },
];
function workforce(from: string): Board {
  const dates = weekDates(from);
  return {
    actorId: "admin",
    timeZone: "UTC",
    canPlan: true,
    canAdminister: true,
    people: [
      { id: "tech", name: "Morgan Technician", profile: "technician" },
      ...shifts.map((shift, index) => ({
        id: shift.id,
        name: `Shift Leader ${index + 1}`,
        profile: "team-leader",
      })),
    ],
    settings: {
      shifts,
      targets: [{ id: "zone", label: "Assembly", phone: "123" }],
      teams: [{ id: "team", label: "Operations", leaderId: "early" }],
    },
    records: dates.flatMap((date) => [
      ...shifts.map(
        (shift, index): RecordEntry<"assignment"> => ({
          id: `${date}-${shift.id}`,
          kind: "assignment",
          revision: 1,
          deleted: false,
          personName: `Shift Leader ${index + 1}`,
          data: {
            userId: shift.id,
            date,
            shiftId: shift.id,
            shiftLabel: shift.label,
            targetId: "",
            duty: "leader",
            phone: "",
            start: shift.start,
            end: shift.end,
            startsAt: `${date}T${shift.start}:00Z`,
            endsAt: `${date}T${shift.end}:00Z`,
          },
        }),
      ),
      {
        id: `tech_${date}`,
        kind: "schedule",
        revision: 1,
        deleted: false,
        personName: "Morgan Technician",
        data: {
          userId: "tech",
          date,
          status: "work",
          start: "05:00",
          end: "14:15",
          startsAt: `${date}T05:00:00Z`,
          endsAt: `${date}T14:15:00Z`,
          source: "manual",
        },
      } as RecordEntry<"schedule">,
    ]),
  };
}
for (const width of [1440, 375]) {
  test(`account and workforce refinements at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    const writes: { path: string; data: unknown }[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let users = [
      {
        id: "admin",
        name: "Administrator",
        username: "admin",
        profile: "administrator",
        active: true,
      },
      {
        id: "tech",
        name: "Morgan Technician",
        username: "morgan",
        profile: "technician",
        active: true,
      },
    ];
    await page.route("**/api/v1/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/session/context"))
        return route.fulfill({
          json: {
            enabled: true,
            authentication: "password",
            canImport: true,
            canAdminister: true,
            canReadAnalytics: true,
            user: users[0],
            users: [],
            scope: null,
          },
        });
      if (path.endsWith("/users")) return route.fulfill({ json: users });
      if (path.endsWith("/users/activity"))
        return route.fulfill({
          json: [
            {
              id: "a",
              subjectName: "Morgan Technician",
              actorName: "Administrator",
              action: "user.name_changed",
              recordedAt: "2026-09-30T09:00:00Z",
            },
          ],
        });
      if (path.endsWith("/imports"))
        return route.fulfill({
          json: [
            {
              importId: "file",
              originalFilename: "Daily-report-20260930.csv",
              reportingDate: "2026-09-30",
              receivedAt: "2026-09-30T10:30:00Z",
              submittedBy: "Administrator",
              outcome: "succeeded",
              admittedRecordCount: 1250,
              byteLength: 1000,
              reasonCode: null,
            },
          ],
        });
      if (path.endsWith("/users/details")) {
        const data = route.request().postDataJSON();
        writes.push({ path, data });
        users = users.map((user) =>
          user.id === data.id ? { ...user, ...data } : user,
        );
        return route.fulfill({ json: { ok: true } });
      }
      if (path.endsWith("/workforce/board"))
        return route.fulfill({
          json: workforce(route.request().postDataJSON().from),
        });
      throw new Error(`Unexpected request: ${path}`);
    });
    const screenshot = async (name: string) => {
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `/tmp/iop-185-${name}-${width}.png`,
        fullPage: true,
      });
    };
    await page.goto("/");
    await expect(page.getByText("Daily-report-20260930.csv")).toBeVisible();
    await expect(page.locator("header > :last-child")).toHaveAccessibleName(
      "Sign out",
    );
    await screenshot("overview");
    await page
      .getByRole("button", { name: "Users & profiles", exact: true })
      .click();
    const table = page.getByRole("table", { name: "Accounts for this site" });
    await expect(
      table.getByRole("button", { name: "User details for morgan" }),
    ).toBeVisible();
    await expect(table.getByRole("combobox")).toHaveCount(0);
    await expect(
      table.getByRole("button", { name: "Delete profile for morgan" }),
    ).toHaveAttribute("title", "Delete profile for morgan");
    await screenshot("users");
    await table
      .getByRole("button", { name: "User details for morgan" })
      .click();
    const dialog = page.getByRole("dialog", { name: "User details" });
    await expect(dialog.getByText("morgan", { exact: true })).toBeVisible();
    await dialog.getByLabel("Name", { exact: true }).fill("Morgan Updated");
    await dialog
      .getByRole("combobox", { name: "Profile", exact: true })
      .selectOption("team-leader");
    await screenshot("user-details");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(
      table.getByRole("button", { name: "User details for morgan" }),
    ).toHaveText("Morgan Updated");
    expect(writes).toEqual([
      {
        path: "/api/v1/users/details",
        data: {
          id: "tech",
          name: "Morgan Updated",
          profile: "team-leader",
          active: true,
        },
      },
    ]);
    await page
      .getByRole("button", { name: "Workforce & shifts", exact: true })
      .click();
    const matrix = page.getByRole("table", { name: "Weekly plan" });
    await expect(matrix).toBeVisible();
    await expect(matrix.locator('th[scope="colgroup"]')).toHaveCount(7);
    expect(
      await matrix
        .locator('th[scope="colgroup"]')
        .evaluateAll((cells) =>
          cells.every((cell) => cell.getAttribute("colspan") === "3"),
        ),
    ).toBe(true);
    await expect(
      matrix.locator("tbody").getByText("Early shift", { exact: true }),
    ).toHaveCount(0);
    await screenshot("matrix");
    await page.getByRole("button", { name: "My day", exact: true }).click();
    await expect(
      page
        .getByRole("region", { name: "Early shift" })
        .getByRole("button", { name: /Shift Leader 1/ }),
    ).toBeVisible();
    await screenshot("day");
    await page
      .getByRole("button", { name: "Weekly schedules", exact: true })
      .click();
    await page.getByLabel("Person", { exact: true }).selectOption("tech");
    await page.getByLabel("Apply shift or status").selectOption("shift:late");
    await page.getByRole("button", { name: "Apply to selected days" }).click();
    await screenshot("weekly");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(matrix).toBeVisible();
    await page
      .getByRole("table")
      .filter({
        has: page.getByRole("columnheader", { name: "Source", exact: true }),
      })
      .getByRole("button", { name: "Morgan Technician" })
      .click();
    await page.getByRole("button", { name: "Edit week", exact: true }).click();
    await expect(page.getByLabel("Person", { exact: true })).toHaveValue(
      "tech",
    );
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(matrix).toBeVisible();
    await page
      .getByRole("button", { name: "Configuration", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Add shift", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Teams", exact: true }),
    ).toBeVisible();
    await screenshot("configuration");
    await page.getByLabel("Language", { exact: true }).selectOption("de");
    await expect(
      page.getByRole("button", {
        name: "Konfiguration speichern",
        exact: true,
      }),
    ).toBeVisible();
    await screenshot("configuration-de");
    expect(writes).toHaveLength(1);
    expect(errors).toEqual([]);
  });
}

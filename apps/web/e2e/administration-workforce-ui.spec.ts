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
      { id: "late-tech", name: "Taylor Technician", profile: "technician" },
      { id: "support", name: "Jordan Support", profile: "technician" },
      ...shifts.map((shift, index) => ({
        id: shift.id,
        name: `Shift Leader ${index + 1}`,
        profile: "team-leader",
      })),
    ],
    settings: {
      shifts,
      targets: [
        { id: "zone", label: "Assembly", phone: "123" },
        { id: "empty-zone", label: "Packing", phone: "456" },
      ],
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
      ...[shifts[0], shifts[2]].map(
        (shift, index): RecordEntry<"assignment"> => ({
          id: `zone-${date}-${shift.id}`,
          kind: "assignment",
          revision: 1,
          deleted: false,
          personName: index === 0 ? "Morgan Technician" : "Taylor Technician",
          data: {
            userId: index === 0 ? "tech" : "late-tech",
            date,
            shiftId: shift.id,
            shiftLabel: shift.label,
            targetId: "zone",
            targetLabel: "Assembly",
            duty: "zone",
            phone: index === 0 ? "zone" : "",
            phoneLabel: index === 0 ? "123" : "",
            start: shift.start,
            end: shift.end,
            startsAt: `${date}T${shift.start}:00Z`,
            endsAt: `${date}T${shift.end}:00Z`,
          },
        }),
      ),
      {
        id: `support-${date}`,
        kind: "assignment",
        revision: 1,
        deleted: false,
        personName: "Jordan Support",
        data: {
          userId: "support",
          date,
          shiftId: "early",
          shiftLabel: "Early shift",
          targetId: "",
          duty: "floating",
          phone: "",
          start: "05:00",
          end: "14:15",
          startsAt: `${date}T05:00:00Z`,
          endsAt: `${date}T14:15:00Z`,
        },
      } as RecordEntry<"assignment">,
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
      if (path.endsWith("/workforce/board")) {
        const board = workforce(route.request().postDataJSON().from);
        const names = new Map(users.map((user) => [user.id, user.name]));
        return route.fulfill({
          json: {
            ...board,
            people: board.people.map((person) => ({
              ...person,
              name: names.get(person.id) ?? person.name,
            })),
            records: board.records.map((record) => ({
              ...record,
              personName:
                "userId" in record.data
                  ? (names.get(record.data.userId) ?? record.personName)
                  : record.personName,
            })),
          },
        });
      }
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
        path: `/tmp/iop-188-${name}-${width}.png`,
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
      table.getByRole("button", { name: "Edit user morgan" }),
    ).toBeVisible();
    await expect(table.getByRole("combobox")).toHaveCount(0);
    await expect(
      table.getByRole("button", { name: "Delete profile for morgan" }),
    ).toHaveAttribute("title", "Delete profile for morgan");
    const search = page.getByRole("searchbox", { name: "Search users" });
    await expect(search).toHaveCount(0);
    const searchToggle = page.getByRole("button", {
      name: "Search users",
      exact: true,
    });
    await expect(searchToggle).toHaveAttribute("aria-expanded", "false");
    await screenshot("users-search-collapsed");
    await searchToggle.click();
    await expect(search).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Close search", exact: true }),
    ).toHaveAttribute("aria-expanded", "true");
    await search.fill("MORGAN");
    await expect(table.getByRole("rowheader")).toHaveCount(1);
    await screenshot("users-search-expanded");
    await search.press("Escape");
    await expect(search).toHaveCount(0);
    await expect(searchToggle).toBeFocused();
    await expect(table.getByRole("rowheader")).toHaveCount(2);
    await searchToggle.click();
    await expect(search).toHaveValue("");
    await search.fill("missing");
    await expect(page.getByText("No users match your search.")).toBeVisible();
    await page
      .getByRole("button", { name: "Close search", exact: true })
      .click();
    await expect(search).toHaveCount(0);
    await expect(table.getByRole("rowheader")).toHaveCount(2);
    for (const label of ["User", "Profile", "Status"]) {
      const header = table.getByRole("columnheader", {
        name: label,
        exact: true,
      });
      for (const direction of ["ascending", "descending", "none"]) {
        await header.getByRole("button").click();
        await expect(header).toHaveAttribute("aria-sort", direction);
      }
    }
    await table.getByText("Morgan Technician", { exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await screenshot("users");
    await table.getByRole("button", { name: "Edit user morgan" }).click();
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
      table.getByRole("rowheader").filter({ hasText: "Morgan Updated" }),
    ).toHaveText("Morgan Updatedmorgan");
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
    const weeklyPerson = matrix
      .getByRole("button", { name: "Morgan Updated Phone" })
      .first();
    await expect(matrix.locator("tbody")).not.toContainText("05:00");
    await expect(matrix.locator("tbody")).not.toContainText("123");
    await expect(
      weeklyPerson.getByRole("img", { name: "Phone" }),
    ).toBeVisible();
    await expect(
      matrix
        .getByRole("button", { name: "Taylor Technician", exact: true })
        .first()
        .getByRole("img"),
    ).toHaveCount(0);
    await screenshot("matrix");
    await weeklyPerson.click();
    await expect(
      page.getByRole("heading", { name: "Morgan Updated" }),
    ).toBeVisible();
    await expect(
      page.locator("dd").filter({ hasText: /^05:00–14:15$/ }),
    ).toBeVisible();
    await expect(page.locator("dd").filter({ hasText: /^123$/ })).toBeVisible();
    await page
      .getByRole("button", { name: "Weekly plan", exact: true })
      .click();
    await expect(matrix).toBeVisible();
    await page.getByRole("button", { name: "My day", exact: true }).click();
    await expect(
      page
        .getByRole("region", { name: "Early shift" })
        .getByRole("button", { name: /Shift Leader 1/ }),
    ).toBeVisible();
    const zones = page.getByRole("table", { name: "Other zones" });
    await expect(zones.getByRole("columnheader")).toHaveText([
      "Zone",
      "Early shift",
      "Middle shift",
      "Late shift",
    ]);
    const assembly = zones.getByRole("row").filter({
      has: page.getByRole("rowheader", { name: "Assembly", exact: true }),
    });
    await expect(
      assembly
        .getByRole("cell")
        .nth(0)
        .getByRole("button", { name: "Morgan Updated Phone" }),
    ).toBeVisible();
    await expect(assembly.getByRole("cell").nth(1)).toHaveText("—");
    await expect(
      assembly
        .getByRole("cell")
        .nth(2)
        .getByRole("button", { name: "Taylor Technician", exact: true }),
    ).toBeVisible();
    await expect(
      zones
        .getByRole("row")
        .filter({
          has: page.getByRole("rowheader", { name: "Packing", exact: true }),
        })
        .getByRole("cell"),
    ).toHaveText(["—", "—", "—"]);
    await screenshot("day");
    await assembly
      .getByRole("button", {
        name: "Taylor Technician",
        exact: true,
      })
      .focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("heading", { name: "Taylor Technician" }),
    ).toBeVisible();
    await expect(
      page.locator("dd").filter({ hasText: /^13:45–23:00$/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: "My day", exact: true }).click();
    await expect(zones).toBeVisible();
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
      .getByRole("button", { name: "Morgan Updated" })
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

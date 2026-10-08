import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MaintenanceNotifications } from "../src/features/maintenance/application/notifications";
import { assignmentsForPeriod, MaintenanceApplication } from "../src/features/maintenance/application/maintenance";
import { BrowserAssignmentCheckpoint } from "../src/features/maintenance/adapters/browser/assignment-checkpoint";
import { ActivityNotifications } from "../src/host/ActivityNotifications";
import { MaintenanceAssignments } from "../src/features/maintenance/adapters/react/MaintenanceAssignments";
import {
  emptyRecord,
  type AssignmentEvent,
  type MaintenanceRecord,
} from "../src/features/maintenance/domain/models";

const event: AssignmentEvent = {
  id: "assignment:1",
  recordId: "repair",
  title: "Replace cassette drive",
  at: "2026-10-05T08:00:00Z",
  revision: 2,
};
test("assignment read state uses stable scoped IDs and retains equal-time reassignment events", async () => {
  const checkpoint = { load: jest.fn(() => []), save: jest.fn() };
  const assignments = jest.fn(async () => ({ records: [], events: [event] }));
  const notifications = new MaintenanceNotifications(
    { assignments },
    checkpoint,
  );
  expect(await notifications.refresh()).toEqual([event]);
  notifications.markAllRead();
  assignments.mockResolvedValueOnce({
    records: [],
    events: [event, { ...event, id: "assignment:2", revision: 3 }],
  });
  expect(await notifications.refresh()).toEqual([
    { ...event, id: "assignment:2", revision: 3 },
  ]);
  expect(checkpoint.save).toHaveBeenCalledWith(["assignment:1"]);
});
test("browser assignment checkpoints are isolated by user and site", () => {
  localStorage.clear();
  const first = new BrowserAssignmentCheckpoint(
    "organization",
    "site",
    "person",
  );
  first.save(["assignment:1"]);
  expect(
    new BrowserAssignmentCheckpoint("organization", "site", "person").load(),
  ).toEqual(["assignment:1"]);
  expect(
    new BrowserAssignmentCheckpoint("organization", "other", "person").load(),
  ).toEqual([]);
  expect(
    new BrowserAssignmentCheckpoint("organization", "site", "other").load(),
  ).toEqual([]);
});
test("the existing bell opens assigned maintenance and marks its events read", async () => {
  const notifications = new MaintenanceNotifications(
    { assignments: async () => ({ records: [], events: [event] }) },
    { load: () => [], save: jest.fn() },
  );
  const open = jest.fn();
  render(
    <ActivityNotifications
      maintenance={notifications}
      openMaintenance={open}
      openEntry={jest.fn()}
      timeZone="UTC"
    />,
  );
  await screen.findByText("1 unread notifications");
  fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
  fireEvent.click(
    await screen.findByRole("button", { name: /Replace cassette drive/ }),
  );
  expect(open).toHaveBeenCalledWith("repair");
  fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
  fireEvent.click(screen.getByRole("button", { name: "Mark all as read" }));
  expect(await screen.findByText("You're all caught up.")).toBeVisible();
});
test("Start prioritizes unfinished assigned work with relevant repair information", async () => {
  const record: MaintenanceRecord = {
    id: "repair",
    revision: 2,
    data: {
      ...emptyRecord("high"),
      title: event.title,
      repairTarget: "Cassette 2",
      status: "in-progress",
      dueDate: "2026-10-06",
      assigneeId: "worker",
    },
    authorId: "leader",
    authorName: "Team Leader",
    createdAt: event.at,
    updatedAt: event.at,
    locationLabel: "Assembly",
    assetName: "",
    priorityLabel: "High",
    assigneeName: "Worker",
    teamLabel: "Task Force",
    canEdit: true,
    canReassign: false,
  };
  const application = new MaintenanceApplication(
    { assignments: async () => ({ records: [record], events: [] }) } as never,
    () => "id",
  );
  const open = jest.fn();
  render(<MaintenanceAssignments application={application} open={open} />);
  fireEvent.click(
    await screen.findByRole("button", { name: /Replace cassette drive/ }),
  );
  expect(open).toHaveBeenCalledWith("repair");
  expect(screen.getByText("Assembly · Cassette 2")).toBeVisible();
  expect(screen.getByText("In progress")).toBeVisible();
});

test("personal maintenance periods include due work, overdue work and undated work without pulling future periods in", () => {
  const records = ["2026-10-02", "2026-10-06", "2026-10-09", "2026-10-13", ""].map((dueDate) => ({
    id: dueDate || "undated", data: { ...emptyRecord(), dueDate },
  } as MaintenanceRecord));
  expect(assignmentsForPeriod(records, { from: "2026-10-06", to: "2026-10-06", today: "2026-10-06" }).map((r) => r.id))
    .toEqual(["2026-10-02", "2026-10-06", "undated"]);
  expect(assignmentsForPeriod(records, { from: "2026-10-05", to: "2026-10-11", today: "2026-10-06" }).map((r) => r.id))
    .toEqual(["2026-10-02", "2026-10-06", "2026-10-09", "undated"]);
  expect(assignmentsForPeriod(records, { from: "2026-10-12", to: "2026-10-18", today: "2026-10-06" }).map((r) => r.id))
    .toEqual(["2026-10-02", "2026-10-13", "undated"]);
});

test("successful details clear only the assignment revisions seen, including feed/detail races", async () => {
  const checkpoint = { load: () => [], save: jest.fn() };
  const other = { ...event, id: "other", recordId: "other-work" };
  const assignments = jest.fn(async () => ({ records: [], events: [event, other] }));
  const notifications = new MaintenanceNotifications({ assignments }, checkpoint);
  notifications.markRead("repair", 2);
  expect(await notifications.refresh()).toEqual([other]);
  assignments.mockResolvedValueOnce({ records: [], events: [{ ...event, id: "later", revision: 3 }, other] });
  expect((await notifications.refresh()).map((notice) => notice.id)).toEqual(["later", "other"]);
});

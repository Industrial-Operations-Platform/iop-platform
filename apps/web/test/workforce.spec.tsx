/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { WorkforceWorkspace } from "../src/features/workforce/adapters/react/WorkforceWorkspace";
import {
  WorkforceApplication,
  type Gateway,
} from "../src/features/workforce/application/workforce";
import type { Board } from "../src/features/workforce/domain/models";
const board: Board = {
  actorId: "tech",
  timeZone: "UTC",
  canPlan: false,
  canAdminister: false,
  people: [{ id: "tech", name: "Test Person", profile: "technician" }],
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
    targets: [{ id: "zone", label: "Test zone", phone: "phone" }],
    teams: [],
  },
  records: [],
};
function application(data: Board) {
  const gateway: Gateway = {
    board: jest.fn(async () => data),
    save: jest.fn(),
    saveWeek: jest.fn(),
    preview: jest.fn(),
    commit: jest.fn(),
    history: jest.fn(),
  };
  return { app: new WorkforceApplication(gateway, () => "id"), gateway };
}
test("technician opens personal day and colleagues without import or planning actions", async () => {
  const { app } = application(board);
  render(
    <WorkforceWorkspace
      application={app}
      profile="technician"
      timeZone="UTC"
    />,
  );
  expect(
    await screen.findByRole("heading", { name: "Your assignment" }),
  ).toBeVisible();
  expect(screen.getByRole("heading", { name: "Other zones" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Assign" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Weekly schedules" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Schedule import" })).toBeNull();
});
test("leader opens weekly plan, can assign, and cannot import", async () => {
  const { app } = application({ ...board, canPlan: true });
  render(
    <WorkforceWorkspace
      application={app}
      profile="team-leader"
      timeZone="UTC"
    />,
  );
  expect(
    await screen.findByRole("table", { name: "Weekly plan" }),
  ).toBeVisible();
  expect(screen.queryByRole("button", { name: "Schedule import" })).toBeNull();
  expect(
    screen.getByRole("button", { name: "Weekly schedules" }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Assign" }));
  expect(
    screen.getByRole("heading", { name: "Assignment details" }),
  ).toBeVisible();
});
test("administrator import edits invalidate an old preview", async () => {
  const { app, gateway } = application({
    ...board,
    canPlan: true,
    canAdminister: true,
  });
  jest.mocked(gateway.preview).mockResolvedValue([
    {
      id: "tech_2026-09-30",
      expectedRevision: 0,
      outcome: "create",
      data: {
        userId: "tech",
        date: "2026-09-30",
        status: "work",
        start: "05:00",
        end: "14:15",
        startsAt: "",
        endsAt: "",
        source: "csv",
      },
    },
  ]);
  render(
    <WorkforceWorkspace
      application={app}
      profile="administrator"
      timeZone="UTC"
    />,
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Schedule import" }),
  );
  fireEvent.change(screen.getByLabelText("Paste CSV or email content"), {
    target: {
      value: "userId,date,status,start,end\ntech,2026-09-30,work,05:00,14:15",
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview import" }));
  expect(
    await screen.findByRole("button", { name: "Import plan (1)" }),
  ).toBeVisible();
  fireEvent.change(screen.getByLabelText("Paste CSV or email content"), {
    target: { value: "changed" },
  });
  expect(screen.queryByRole("button", { name: /Import plan/ })).toBeNull();
  expect(gateway.commit).not.toHaveBeenCalled();
});

test("detail returns through its section, subsection and a repeated sidebar visit", async () => {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const { app } = application({
    ...board,
    records: [
      {
        id: "assignment",
        kind: "assignment",
        revision: 1,
        deleted: false,
        personName: "Test Person",
        data: {
          userId: "tech",
          date,
          shiftId: "early",
          shiftLabel: "Early",
          targetId: "zone",
          targetLabel: "Test zone",
          duty: "zone",
          phone: "",
          start: "05:00",
          end: "14:15",
          startsAt: date + "T05:00:00Z",
          endsAt: date + "T14:15:00Z",
        },
      },
    ],
  });
  const { rerender } = render(
    <WorkforceWorkspace
      application={app}
      profile="technician"
      timeZone="UTC"
    />,
  );
  await screen.findByRole("heading", { name: "Your assignment" });
  const open = () =>
    fireEvent.click(screen.getAllByRole("button", { name: /Test Person/ })[0]);
  open();
  expect(
    screen.getByRole("heading", {
      name: "Workforce & shifts My day Details",
    }),
  ).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Close" }),
  ).toBeNull();
  expect(screen.getByText("05:00–14:15")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "My day" }));
  expect(
    screen.getByRole("heading", { name: "Your assignment" }),
  ).toBeVisible();
  open();
  fireEvent.click(
    screen.getByRole("button", { name: "Workforce & shifts" }),
  );
  expect(
    screen.getByRole("heading", { name: "Your assignment" }),
  ).toBeVisible();
  open();
  rerender(
    <WorkforceWorkspace
      application={app}
      profile="technician"
      timeZone="UTC"
      homeVisit={1}
    />,
  );
  expect(
    screen.getByRole("heading", { name: "Your assignment" }),
  ).toBeVisible();
});

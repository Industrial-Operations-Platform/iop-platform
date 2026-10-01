import { DailyPlan } from "../src/features/workforce/adapters/react/PlanBoard";
/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
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
  expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  expect(screen.getByText("05:00–14:15")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "My day" }));
  expect(
    screen.getByRole("heading", { name: "Your assignment" }),
  ).toBeVisible();
  open();
  fireEvent.click(screen.getByRole("button", { name: "Workforce & shifts" }));
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

test("weekly entry cancellation and module heading return to the planning home without saving", async () => {
  const { app, gateway } = application({ ...board, canPlan: true });
  render(
    <WorkforceWorkspace
      application={app}
      profile="team-leader"
      timeZone="UTC"
    />,
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Weekly schedules" }),
  );
  fireEvent.change(screen.getByLabelText("Person"), {
    target: { value: "tech" },
  });
  fireEvent.change(screen.getByLabelText("Apply shift or status"), {
    target: { value: "shift:early" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Apply to selected days" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByRole("table", { name: "Weekly plan" })).toBeVisible();
  expect(gateway.saveWeek).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Weekly schedules" }));
  expect(screen.getByLabelText("Person")).toHaveValue("");
  fireEvent.click(screen.getByRole("button", { name: "Workforce & shifts" }));
  expect(screen.getByRole("table", { name: "Weekly plan" })).toBeVisible();
});

test("personal assignments show shift and hours once while keeping different availability explicit", () => {
  const assignment: import("../src/features/workforce/domain/models").RecordEntry<"assignment"> =
    {
      id: "assigned",
      kind: "assignment",
      revision: 1,
      deleted: false,
      personName: "Test Leader",
      data: {
        userId: "tech",
        date: "2026-10-02",
        shiftId: "early",
        targetId: "",
        duty: "leader",
        phone: "",
        start: "05:00",
        end: "14:15",
        startsAt: "2026-10-02T05:00:00Z",
        endsAt: "2026-10-02T14:15:00Z",
      },
    };
  const schedule: import("../src/features/workforce/domain/models").RecordEntry<"schedule"> =
    {
      id: "schedule",
      kind: "schedule",
      revision: 1,
      deleted: false,
      personName: "Test Leader",
      data: {
        userId: "tech",
        date: "2026-10-02",
        status: "work",
        start: "05:00",
        end: "14:15",
        startsAt: "2026-10-02T05:00:00Z",
        endsAt: "2026-10-02T14:15:00Z",
        source: "manual",
      },
    };
  const select = jest.fn();
  const data = { ...board, records: [assignment, schedule] };
  const { rerender } = render(
    <DailyPlan board={data} date="2026-10-02" select={select} />,
  );
  const personal = within(screen.getByLabelText("Your assignment"));
  expect(personal.getAllByText("05:00–14:15")).toHaveLength(1);
  expect(personal.getByRole("heading", { name: "Early" })).toBeVisible();
  expect(personal.getByText("Work")).toBeVisible();
  expect(personal.queryByText(/Scheduled availability/)).toBeNull();
  fireEvent.click(
    personal.getByRole("button", { name: "View assignment for Test Leader" }),
  );
  expect(select).toHaveBeenCalledWith(assignment);
  rerender(
    <DailyPlan
      board={{
        ...data,
        records: [
          assignment,
          { ...schedule, data: { ...schedule.data, end: "16:00" } },
        ],
      }}
      date="2026-10-02"
      select={select}
    />,
  );
  expect(
    personal.getByText("Scheduled availability: 05:00–16:00"),
  ).toBeVisible();
  rerender(
    <DailyPlan
      board={{ ...data, records: [schedule] }}
      date="2026-10-02"
      select={select}
    />,
  );
  expect(personal.getByText("No assignment yet")).toBeVisible();
  expect(
    personal.getByText("Scheduled availability: 05:00–14:15"),
  ).toBeVisible();
});

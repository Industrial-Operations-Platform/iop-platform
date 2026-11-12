/** @jest-environment jsdom */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { WeeklySchedule } from "../src/features/workforce/adapters/react/WeeklySchedule";
import {
  WorkforceApplication,
  type Gateway,
} from "../src/features/workforce/application/workforce";
import type { Board } from "../src/features/workforce/domain/models";

const board: Board = {
  actorId: "lead",
  timeZone: "UTC",
  canPlan: true,
  canAdminister: false,
  people: [{ id: "tech", name: "Test Technician", profile: "technician" }, { id: "other", name: "Other Technician", profile: "technician" }],
  settings: {
    shifts: [
      {
        id: "early",
        label: "Early",
        start: "05:00",
        end: "14:15",
        days: [1, 2, 3, 4, 5],
      },
      {
        id: "late",
        label: "Late",
        start: "13:45",
        end: "23:00",
        days: [1, 2, 3, 4, 5],
      },
    ],
    targets: [],
    teams: [],
  },
  records: [
    {
      kind: "schedule",
      id: "tech_2026-09-29",
      deleted: false,
      revision: 3,
      personName: "Test Technician",
      data: {
        userId: "tech",
        date: "2026-09-29",
        status: "vacation",
        start: "",
        end: "",
        startsAt: "",
        endsAt: "",
        source: "email",
      },
    },
  ],
};
function renderEditor() {
  const load = { days: 0, minutes: 0, saturdays: 0, sundays: 0, unknownDays: 7, shifts: [{ id: "early", label: "Early", count: 0 }, { id: "late", label: "Late", count: 0 }, { id: "", label: "Other scheduled hours", count: 0 }] };
  const gateway: Gateway = {
    board: jest.fn(),
    saveWeek: jest.fn(async () => ({ changed: 5, unchanged: 0 })),
    previewProposal: jest.fn(async (input) => ({ from: input.from, to: input.to, people: board.people.map((person) => ({ userId: person.id, name: person.name, before: load, after: { ...load, days: 5, minutes: 2775 } })) })),
    saveProposal: jest.fn(async () => ({ changed: 5, unchanged: 0 })),
    save: jest.fn(),
    preview: jest.fn(),
    commit: jest.fn(),
    history: jest.fn(),
  };
  const refresh = jest.fn();
  const application = new WorkforceApplication(gateway, () => "id");
  const editor = (selectedBoard: Board) => (
    <WeeklySchedule
      board={selectedBoard}
      weekStart="2026-09-28"
      application={application}
      loading={false}
      refresh={refresh}
      cancel={jest.fn()}
    />
  );
  const view = render(editor(board));
  fireEvent.change(screen.getByLabelText("Person"), {
    target: { value: "tech" },
  });
  return { gateway, refresh, rerenderBoard: (next: Board) => view.rerender(editor(next)) };
}
test("weekly entry loads existing absence, applies weekdays, adjusts one day and saves only changed dates with revisions", async () => {
  const { gateway, refresh } = renderEditor();
  const tuesday = within(screen.getByRole("region", { name: /Tuesday/ }));
  expect(tuesday.getByLabelText("Shift or status")).toHaveValue(
    "status:vacation",
  );
  expect(screen.queryByRole("button", { name: /Save proposal/ })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Apply shift or status"), {
    target: { value: "shift:early" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Apply to selected days" }),
  );
  const friday = within(screen.getByRole("region", { name: /Friday/ }));
  fireEvent.change(friday.getByLabelText("Shift or status"), {
    target: { value: "shift:late" },
  });
  expect(friday.getByLabelText("Start time")).toHaveValue("13:45");
  expect(
    within(screen.getByRole("region", { name: /Sunday/ })).getByLabelText(
      "Shift or status",
    ),
  ).toHaveValue("");
  fireEvent.click(screen.getByRole("button", { name: "Preview proposal (5)" }));
  expect(await screen.findByText("Preview only. Nothing has been saved.")).toBeVisible();
  expect(gateway.saveProposal).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Save proposal (5)" }));
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  const input = jest.mocked(gateway.saveProposal!).mock.calls[0][0].weeks[0];
  expect(input).toMatchObject({ userId: "tech", weekStart: "2026-09-28" });
  expect(input.days).toHaveLength(5);
  expect(input.days[1]).toMatchObject({
    date: "2026-09-29",
    status: "work",
    expectedRevision: 3,
  });
  expect(input.days[4]).toMatchObject({
    date: "2026-10-02",
    start: "13:45",
    end: "23:00",
    expectedRevision: 0,
  });
  expect(gateway.save).not.toHaveBeenCalled();
});
test("invalid weekdays are skipped by presets and a failed save keeps edits available for correction", async () => {
  const { gateway } = renderEditor();
  jest
    .mocked(gateway.saveProposal!)
    .mockRejectedValue(
      new Error(
        "The plan changed or has dependent assignments. Reload before saving.",
      ),
    );
  fireEvent.click(screen.getByRole("button", { name: "Select all days" }));
  fireEvent.change(screen.getByLabelText("Apply shift or status"), {
    target: { value: "shift:early" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Apply to selected days" }),
  );
  expect(
    within(screen.getByRole("region", { name: /Saturday/ })).getByLabelText(
      "Shift or status",
    ),
  ).toHaveValue("");
  fireEvent.click(screen.getByRole("button", { name: "Preview proposal (5)" }));
  fireEvent.click(await screen.findByRole("button", { name: "Save proposal (5)" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "dependent assignments",
  );
  expect(
    within(screen.getByRole("region", { name: /Monday/ })).getByLabelText(
      "Start time",
    ),
  ).toHaveValue("05:00");
  fireEvent.click(screen.getByRole("button", { name: "Discard proposal" }));
  expect(
    within(screen.getByRole("region", { name: /Tuesday/ })).getByLabelText(
      "Shift or status",
    ),
  ).toHaveValue("status:vacation");
  expect(screen.queryByRole("button", { name: /Save proposal/ })).not.toBeInTheDocument();
});

test("people retain separate drafts, preview the whole proposal and invalidate it after edits or period changes", async () => {
  const { gateway, rerenderBoard } = renderEditor();
  fireEvent.change(screen.getByLabelText("Apply shift or status"), { target: { value: "shift:early" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply to selected days" }));
  fireEvent.change(screen.getByLabelText("Person"), { target: { value: "other" } });
  fireEvent.change(screen.getByLabelText("Apply shift or status"), { target: { value: "shift:late" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply to selected days" }));
  fireEvent.change(screen.getByLabelText("Person"), { target: { value: "tech" } });
  rerenderBoard({ ...board, records: board.records.map((record) => ({ ...record, revision: 9 })) });
  expect(within(screen.getByRole("region", { name: /Monday/ })).getByLabelText("Start time")).toHaveValue("05:00");
  fireEvent.click(screen.getByRole("button", { name: "Preview proposal (10)" }));
  await screen.findByRole("button", { name: "Save proposal (10)" });
  expect(gateway.previewProposal).toHaveBeenCalledWith(expect.objectContaining({
    from: "2026-09-01", to: "2026-10-04", weeks: [expect.objectContaining({ userId: "tech" }), expect.objectContaining({ userId: "other" })],
  }));
  expect(jest.mocked(gateway.previewProposal!).mock.calls[0][0].weeks[0].days[1].expectedRevision).toBe(3);
  const matrix = screen.getByLabelText("Proposed weekly schedules");
  expect(within(matrix).getAllByRole("row")).toHaveLength(3);
  expect(within(matrix).getByText("Test Technician")).toBeVisible();
  expect(within(matrix).getByText("Other Technician")).toBeVisible();
  const comparison = within(screen.getByLabelText("Workload comparison"));
  expect(comparison.getAllByText("0 → 46.25 (+46.25)")).toHaveLength(2);
  fireEvent.change(screen.getByLabelText("Analysis from"), { target: { value: "2026-09-14" } });
  expect(screen.queryByRole("button", { name: /Save proposal/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Preview proposal (10)" }));
  await screen.findByRole("button", { name: "Save proposal (10)" });
  fireEvent.change(within(screen.getByRole("region", { name: /Monday/ })).getByLabelText("Shift or status"), { target: { value: "status:off" } });
  expect(screen.queryByRole("button", { name: /Save proposal/ })).not.toBeInTheDocument();
  expect(gateway.saveProposal).not.toHaveBeenCalled();
  expect(gateway.saveWeek).not.toHaveBeenCalled();
});

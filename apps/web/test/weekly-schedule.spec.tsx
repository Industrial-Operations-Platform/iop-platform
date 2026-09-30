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
  people: [{ id: "tech", name: "Test Technician", profile: "technician" }],
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
  const gateway: Gateway = {
    board: jest.fn(),
    saveWeek: jest.fn(async () => ({ changed: 5, unchanged: 0 })),
    save: jest.fn(),
    preview: jest.fn(),
    commit: jest.fn(),
    history: jest.fn(),
  };
  const refresh = jest.fn();
  render(
    <WeeklySchedule
      board={board}
      weekStart="2026-09-28"
      application={new WorkforceApplication(gateway, () => "id")}
      loading={false}
      refresh={refresh}
    />,
  );
  fireEvent.change(screen.getByLabelText("Person"), {
    target: { value: "tech" },
  });
  return { gateway, refresh };
}
test("weekly entry loads existing absence, applies weekdays, adjusts one day and saves only changed dates with revisions", async () => {
  const { gateway, refresh } = renderEditor();
  const tuesday = within(screen.getByRole("region", { name: /Tuesday/ }));
  expect(tuesday.getByLabelText("Shift or status")).toHaveValue(
    "status:vacation",
  );
  expect(screen.getByRole("button", { name: "Save week (0)" })).toBeDisabled();
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
  fireEvent.click(screen.getByRole("button", { name: "Save week (5)" }));
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  const input = jest.mocked(gateway.saveWeek).mock.calls[0][0];
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
    .mocked(gateway.saveWeek)
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
  fireEvent.click(screen.getByRole("button", { name: "Save week (5)" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "dependent assignments",
  );
  expect(
    within(screen.getByRole("region", { name: /Monday/ })).getByLabelText(
      "Start time",
    ),
  ).toHaveValue("05:00");
  fireEvent.click(screen.getByRole("button", { name: "Discard edits" }));
  expect(
    within(screen.getByRole("region", { name: /Tuesday/ })).getByLabelText(
      "Shift or status",
    ),
  ).toHaveValue("status:vacation");
  expect(screen.getByRole("button", { name: "Save week (0)" })).toBeDisabled();
});

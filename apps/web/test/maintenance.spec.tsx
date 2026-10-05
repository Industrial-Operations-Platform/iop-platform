import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MaintenanceWorkspace } from "../src/features/maintenance/adapters/react/MaintenanceWorkspace";
import {
  MaintenanceApplication,
  type Gateway,
} from "../src/features/maintenance/application/maintenance";
import {
  emptyRecord,
  type Catalog,
  type MaintenanceRecord,
  type Page,
} from "../src/features/maintenance/domain/models";

const catalog: Catalog = {
  actorId: "tech",
  canContribute: true,
  canCoordinate: false,
  canAdminister: false,
  settings: {
    revision: 1,
    priorities: [{ id: "normal", label: "Normal", rank: 1 }],
  },
  people: [{ id: "tech", name: "Morgan Technician" }],
  teams: [],
  locations: [{ id: "hall", label: "Assembly", parentId: "" }],
  assets: [],
};
const record: MaintenanceRecord = {
  id: "record",
  revision: 1,
  data: {
    ...emptyRecord("normal"),
    title: "Inspect conveyor",
    locationId: "hall",
    assigneeId: "tech",
  },
  authorId: "tech",
  authorName: "Morgan Technician",
  createdAt: "2026-10-01T08:00:00Z",
  updatedAt: "2026-10-01T08:00:00Z",
  locationLabel: "Assembly",
  assetName: "",
  priorityLabel: "Normal",
  assigneeName: "Morgan Technician",
  teamLabel: "",
  canEdit: true,
  canReassign: false,
};
const page: Page = {
  records: [record],
  total: 4,
  nextCursor: "next",
  statusCounts: { open: 4, "in-progress": 0, blocked: 0, done: 0 },
};
function fixture(overrides: Partial<Gateway> = {}, context = catalog) {
  const gateway: Gateway = {
    catalog: jest.fn(async () => context),
    query: jest.fn(async () => page),
    history: jest.fn(async () => ({ record, revisions: [], nextBefore: 0 })),
    save: jest.fn(async (input) => ({
      ...record,
      id: input.id,
      data: input.data,
      revision: 2,
    })),
    settings: jest.fn(),
    ...overrides,
  };
  return {
    gateway,
    application: new MaintenanceApplication(gateway, () => "stable-id"),
  };
}
test("server totals remain explicit and My work requests the current actor", async () => {
  const { gateway, application } = fixture();
  render(
    <MaintenanceWorkspace
      application={application}
      profile="technician"
      timeZone="UTC"
    />,
  );
  expect(await screen.findByText("Showing 1 of 4 records.")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Configuration" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "My work" }));
  await waitFor(() =>
    expect(gateway.query).toHaveBeenLastCalledWith(
      expect.objectContaining({ assigneeId: "tech", cursor: "", limit: 20 }),
    ),
  );
  expect(screen.getByText("Showing work assigned to you.")).toBeVisible();
});
test("new maintenance keeps its ID and form values after an uncertain save failure", async () => {
  const save = jest
    .fn()
    .mockRejectedValueOnce(
      new Error("This maintenance record changed. Reload before saving."),
    )
    .mockResolvedValue({
      ...record,
      id: "stable-id",
      data: { ...record.data, title: "Check belt" },
    });
  const { application } = fixture({ save });
  render(
    <MaintenanceWorkspace
      application={application}
      profile="technician"
      timeZone="UTC"
    />,
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "New maintenance" }),
  );
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Check belt" },
  });
  fireEvent.change(screen.getByLabelText("Location"), {
    target: { value: "hall" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save maintenance" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Reload before saving",
  );
  expect(screen.getByLabelText("Title")).toHaveValue("Check belt");
  expect(screen.getByLabelText("Status")).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Save maintenance" }));
  await screen.findByText("Maintenance saved.");
  expect(save.mock.calls.map(([input]) => input.id)).toEqual([
    "stable-id",
    "stable-id",
  ]);
});
test("workflow form requires a block reason or completed outcome and preserves detail navigation", async () => {
  const { application } = fixture();
  render(
    <MaintenanceWorkspace
      application={application}
      profile="technician"
      timeZone="UTC"
      initialRecordId="record"
    />,
  );
  fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
  fireEvent.change(screen.getByLabelText("Status"), {
    target: { value: "blocked" },
  });
  expect(screen.getByLabelText("Blocked reason")).toBeRequired();
  fireEvent.change(screen.getByLabelText("Status"), {
    target: { value: "done" },
  });
  expect(screen.getByLabelText("Work outcome")).toBeRequired();
  expect(screen.getByLabelText("Change reason")).toBeRequired();
  expect(screen.getByLabelText("Responsible person")).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  fireEvent.click(screen.getByRole("button", { name: "Board" }));
  expect(
    await screen.findByRole("button", { name: "New maintenance" }),
  ).toBeVisible();
});
test("failed catalog ends loading and can be retried", async () => {
  const load = jest
    .fn()
    .mockRejectedValueOnce(new Error("Maintenance is unavailable."))
    .mockResolvedValue(catalog);
  const { application } = fixture({ catalog: load });
  render(<MaintenanceWorkspace application={application} timeZone="UTC" />);
  expect(await screen.findByText("Reload to try again.")).toBeVisible();
  expect(screen.queryByText("Loading…")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
  expect(
    await screen.findByRole("button", { name: "New maintenance" }),
  ).toBeVisible();
});
test("late pagination cannot overwrite a changed location selection", async () => {
  let resolveNext: (value: Page) => void = () => undefined;
  const query = jest.fn(async (selection) =>
    selection.locationId
      ? { ...page, records: [], total: 0, nextCursor: "" }
      : page,
  );
  query
    .mockImplementationOnce(async () => page)
    .mockImplementationOnce(
      () =>
        new Promise<Page>((resolve) => {
          resolveNext = resolve;
        }),
    );
  const { application } = fixture({ query });
  render(<MaintenanceWorkspace application={application} timeZone="UTC" />);
  fireEvent.click(await screen.findByRole("button", { name: "Load more" }));
  fireEvent.change(screen.getByLabelText("Selected location"), {
    target: { value: "hall" },
  });
  expect(await screen.findByText("Showing 0 of 0 records.")).toBeVisible();
  await act(async () =>
    resolveNext({
      ...page,
      records: [
        {
          ...record,
          id: "late",
          data: { ...record.data, title: "Late old record" },
        },
      ],
    }),
  );
  expect(screen.queryByText("Late old record")).toBeNull();
});

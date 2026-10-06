import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MaintenanceWorkspace } from "../src/features/maintenance/adapters/react/MaintenanceWorkspace";
import { EntrySummaryCards } from "../src/features/shift-handover/adapters/react/EntrySummaryCards";
import {
  MaintenanceApplication,
  maintenanceDraftFromReport,
  type Gateway,
} from "../src/features/maintenance/application/maintenance";
import {
  emptyRecord,
  type Catalog,
  type MaintenanceRecord,
  type Page,
  type RelatedEntry,
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
    related: jest.fn(async () => ({ entries: [], total: 0, nextCursor: "" })),
    assignments: jest.fn(async () => ({ records: [], events: [] })),
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
  expect(screen.getByLabelText("Location")).toBeDisabled();
  expect(screen.getByLabelText("Asset")).toBeDisabled();
  expect(screen.getByLabelText("Exact equipment code")).toBeDisabled();
  expect(screen.getByLabelText("Repair target / manual zone")).toBeEnabled();
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

const report: RelatedEntry = {
  id: "report",
  revision: 2,
  content: {
    categoryId: "problems",
    summary: "Cassette direction error",
    details: "Sensor reports an error while the cassette needs repair.",
    date: "2026-10-05",
    equipmentCode: "=11+11.11.02-B102.1",
    condition: "blocked",
    dueDate: "",
    feedbackDueDate: "",
  },
  departmentLabel: "Assembly",
  areaLabel: "",
  categoryLabel: "Problems",
  responsibleName: "Morgan Technician",
  issueState: "open",
};
test("report-started drafts preserve exact scoped identifiers without automatic assignment or source conversion", () => {
  const source = {
    id: "report",
    revision: 2,
    issueState: "open",
    content: {
      summary: "Cassette failure",
      details: "Inspect motor roller",
      departmentId: "hall",
      areaId: "line",
      equipmentCode: "=11+11.11.02-B102.1",
      equipmentNamespace: "site-equipment",
    },
  };
  expect(maintenanceDraftFromReport(source)).toEqual(
    expect.objectContaining({
      details: "",
      category: "corrective",
      locationId: "line",
      assigneeId: "",
      equipment: [
        {
          namespace: "site-equipment",
          code: source.content.equipmentCode,
          departmentId: "hall",
          areaId: "line",
        },
      ],
      linkedEntries: [
        {
          id: "report",
          expectedRevision: 2,
          disposition: "include",
          reason: "",
        },
      ],
    }),
  );
  expect(
    maintenanceDraftFromReport({
      ...source,
      issueState: "resolved",
      content: { ...source.content, equipmentNamespace: "other-source" },
    }),
  ).toEqual(expect.objectContaining({ equipment: [], linkedEntries: [] }));
});
test("corrective work accepts multiple exact manual identifiers and an independent repair target", async () => {
  const { application, gateway } = fixture();
  render(<MaintenanceWorkspace application={application} timeZone="UTC" />);
  fireEvent.click(
    await screen.findByRole("button", { name: "New maintenance" }),
  );
  expect(screen.getByLabelText("Maintenance category")).toHaveValue(
    "corrective",
  );
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Replace cassette drive" },
  });
  fireEvent.change(screen.getByLabelText("Location"), {
    target: { value: "hall" },
  });
  fireEvent.change(screen.getByLabelText("Repair target / manual zone"), {
    target: { value: "Cassette 2, motor roller" },
  });
  for (const code of ["=11+11.11.02-B102.1", "=11+11.11.02-B102.2"]) {
    fireEvent.change(screen.getByLabelText("Exact equipment code"), {
      target: { value: code },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add equipment code" }));
  }
  fireEvent.click(screen.getByRole("button", { name: "Save maintenance" }));
  await screen.findByText("Maintenance saved.");
  expect(gateway.save).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        category: "corrective",
        repairTarget: "Cassette 2, motor roller",
        equipment: [
          {
            namespace: "site-equipment",
            code: "=11+11.11.02-B102.1",
            departmentId: "hall",
            areaId: "",
          },
          {
            namespace: "site-equipment",
            code: "=11+11.11.02-B102.2",
            departmentId: "hall",
            areaId: "",
          },
        ],
      }),
    }),
  );
});
test("a report-started repair consumes its initial draft without losing the source linkage or assigning a worker", async () => {
  const { application, gateway } = fixture({
    related: jest.fn(async () => ({
      entries: [report],
      total: 1,
      nextCursor: "",
    })),
  });
  function DraftHost() {
    const [draft, setDraft] = React.useState<
      Partial<MaintenanceRecord["data"]> | undefined
    >({
      title: report.content.summary,
      details: report.content.details,
      locationId: "hall",
      repairTarget: "Cassette 2",
      equipment: [
        {
          namespace: "site-equipment",
          code: report.content.equipmentCode,
          departmentId: "hall",
          areaId: "",
        },
      ],
      linkedEntries: [
        {
          id: report.id,
          expectedRevision: report.revision,
          disposition: "include",
          reason: "",
        },
      ],
    });
    return (
      <MaintenanceWorkspace
        application={application}
        timeZone="UTC"
        initialDraft={draft}
        onDraftConsumed={() => setDraft(undefined)}
      />
    );
  }
  render(<DraftHost />);
  expect(await screen.findByLabelText("Title")).toHaveValue(
    "Cassette direction error",
  );
  expect(
    await screen.findByLabelText("Scope for Cassette direction error"),
  ).toHaveValue("include");
  expect(screen.getByLabelText("Responsible person")).toBeDisabled();
  expect(screen.getByLabelText("Maintenance category")).toHaveValue(
    "corrective",
  );
  fireEvent.click(screen.getByRole("button", { name: "Save maintenance" }));
  await screen.findByText("Maintenance saved.");
  expect(gateway.save).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        title: "Cassette direction error",
        priorityId: "normal",
        assigneeId: "",
        linkedEntries: [
          {
            id: "report",
            expectedRevision: 2,
            disposition: "include",
            reason: "",
          },
        ],
      }),
    }),
  );
});
test("equipment lookup retains the actual department and independently chosen areas under a site root", async () => {
  const context: Catalog = {
    ...catalog,
    locations: [
      { id: "site-root", parentId: "", label: "Site", role: "location" },
      {
        id: "hall",
        parentId: "site-root",
        label: "Assembly",
        role: "department",
      },
      { id: "line-a", parentId: "hall", label: "Line A", role: "area" },
      { id: "line-b", parentId: "hall", label: "Line B", role: "area" },
    ],
  };
  const lookup = jest.fn(async () => ({
    codes: ["=11+11.11.02-B102.1"],
    nextCursor: "",
  }));
  const { application, gateway } = fixture({}, context);
  render(
    <MaintenanceWorkspace
      application={application}
      timeZone="UTC"
      lookupEquipment={lookup}
    />,
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "New maintenance" }),
  );
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Zone repair" },
  });
  fireEvent.change(screen.getByLabelText("Location"), {
    target: { value: "hall" },
  });
  expect(lookup).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Equipment area"), {
    target: { value: "line-a" },
  });
  await waitFor(() =>
    expect(lookup).toHaveBeenLastCalledWith({
      departmentId: "hall",
      areaId: "line-a",
      search: "",
      after: "",
    }),
  );
  fireEvent.change(screen.getByLabelText("Reported equipment codes"), {
    target: { value: "=11+11.11.02-B102.1" },
  });
  fireEvent.change(screen.getByLabelText("Equipment area"), {
    target: { value: "line-b" },
  });
  await waitFor(() =>
    expect(lookup).toHaveBeenLastCalledWith({
      departmentId: "hall",
      areaId: "line-b",
      search: "",
      after: "",
    }),
  );
  fireEvent.change(screen.getByLabelText("Reported equipment codes"), {
    target: { value: "=11+11.11.02-B102.1" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save maintenance" }));
  await screen.findByText("Maintenance saved.");
  expect(gateway.save).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        equipment: [
          {
            namespace: "site-equipment",
            code: "=11+11.11.02-B102.1",
            departmentId: "hall",
            areaId: "line-a",
          },
          {
            namespace: "site-equipment",
            code: "=11+11.11.02-B102.1",
            departmentId: "hall",
            areaId: "line-b",
          },
        ],
      }),
    }),
  );
});
test("completion requires explicit report review and an exclusion reason", async () => {
  const related = jest.fn(async () => ({
    entries: [report],
    total: 1,
    nextCursor: "",
  }));
  const { application, gateway } = fixture({ related });
  render(
    <MaintenanceWorkspace
      application={application}
      timeZone="UTC"
      initialRecordId="record"
    />,
  );
  fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
  await screen.findByLabelText("Scope for Cassette direction error");
  fireEvent.change(screen.getByLabelText("Status"), {
    target: { value: "done" },
  });
  const save = screen.getByRole("button", { name: "Save maintenance" });
  expect(save).toBeDisabled();
  fireEvent.change(
    screen.getByLabelText("Scope for Cassette direction error"),
    { target: { value: "exclude" } },
  );
  expect(save).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Exclusion reason"), {
    target: { value: "Independent electrical failure remains open." },
  });
  await waitFor(() => expect(save).toBeEnabled());
  fireEvent.change(screen.getByLabelText("Work outcome"), {
    target: { value: "Motor roller replaced." },
  });
  fireEvent.change(screen.getByLabelText("Change reason"), {
    target: { value: "Repair completed after scope review." },
  });
  fireEvent.click(save);
  await screen.findByText("Maintenance saved.");
  expect(gateway.save).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        linkedEntries: [
          {
            id: "report",
            expectedRevision: 2,
            disposition: "exclude",
            reason: "Independent electrical failure remains open.",
          },
        ],
      }),
    }),
  );
});
test("pending reports on later pages must be reviewed before completion", async () => {
  const related = jest.fn(async (input) =>
    input.cursor
      ? {
          entries: [
            {
              ...report,
              id: "other",
              content: { ...report.content, summary: "Another failure" },
            },
          ],
          total: 2,
          nextCursor: "",
        }
      : { entries: [report], total: 2, nextCursor: "next" },
  );
  const { application } = fixture({ related });
  render(
    <MaintenanceWorkspace
      application={application}
      timeZone="UTC"
      initialRecordId="record"
    />,
  );
  fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
  fireEvent.change(screen.getByLabelText("Status"), {
    target: { value: "done" },
  });
  fireEvent.change(
    await screen.findByLabelText("Scope for Cassette direction error"),
    { target: { value: "include" } },
  );
  const save = screen.getByRole("button", { name: "Save maintenance" });
  expect(save).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Load more reports" }));
  fireEvent.change(await screen.findByLabelText("Scope for Another failure"), {
    target: { value: "include" },
  });
  await waitFor(() => expect(save).toBeEnabled());
});
test("returning to a repair refreshes every previously displayed report page", async () => {
  const second = {
    ...report,
    id: "other",
    content: { ...report.content, summary: "Another failure" },
  };
  const related = jest.fn(async (input) =>
    input.cursor
      ? { entries: [second], total: 2, nextCursor: "" }
      : { entries: [report], total: 2, nextCursor: "next" },
  );
  const { application } = fixture({ related });
  expect(
    await application.related({ locationId: "hall", equipment: [] }, 2),
  ).toEqual({ entries: [report, second], total: 2, nextCursor: "" });
  expect(related).toHaveBeenNthCalledWith(2, {
    locationId: "hall",
    equipment: [],
    cursor: "next",
  });
});
test("related report navigation preserves unsaved repair details and scope decisions", async () => {
  jest.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  const { application } = fixture({
    related: jest.fn(async () => ({
      entries: [report],
      total: 1,
      nextCursor: "",
    })),
  });
  render(
    <MaintenanceWorkspace
      application={application}
      timeZone="UTC"
      initialRecordId="record"
      renderReport={(id, back) => (
        <section>
          <p>Full history for {id}</p>
          <button onClick={back}>Return to repair</button>
        </section>
      )}
    />,
  );
  fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
  fireEvent.change(screen.getByLabelText("Work details"), {
    target: { value: "Unsaved motor roller instructions" },
  });
  fireEvent.change(
    await screen.findByLabelText("Scope for Cassette direction error"),
    { target: { value: "include" } },
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Cassette direction error" }),
  );
  expect(screen.getByText("Full history for report")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Save maintenance" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Return to repair" }));
  expect(screen.getByLabelText("Work details")).toHaveValue(
    "Unsaved motor roller instructions",
  );
  expect(
    await screen.findByLabelText("Scope for Cassette direction error"),
  ).toHaveValue("include");
});
test("status search hides other board columns and historical search is explicit", async () => {
  const { application, gateway } = fixture();
  render(<MaintenanceWorkspace application={application} timeZone="UTC" />);
  await screen.findByText("Showing 1 of 4 records.");
  fireEvent.change(screen.getByLabelText("Status"), {
    target: { value: "open" },
  });
  const board = await screen.findByLabelText("Maintenance board");
  expect(board).toHaveClass("maintenance-board--focused");
  expect(within(board).queryByRole("heading", { name: /^Done/ })).toBeNull();
  expect(within(board).queryByRole("heading", { name: /^Blocked/ })).toBeNull();
  fireEvent.change(screen.getByLabelText("Completed work period"), {
    target: { value: "history" },
  });
  await waitFor(() =>
    expect(gateway.query).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "open", history: true }),
    ),
  );
});
test("completed details separate included, excluded and related context before each source card", async () => {
  const included = {
    ...report,
    issueState: "resolved" as const,
    latestUpdate: {
      note: "Maintenance order: cassette repair outcome",
      actorName: "Worker",
      at: "2026-10-06T09:00:00Z",
    },
  };
  const excluded = {
    ...report,
    id: "excluded",
    content: { ...report.content, summary: "Excluded electrical failure" },
  };
  const context = {
    ...report,
    id: "context",
    content: { ...report.content, summary: "Separate drive observation" },
  };
  const completedRecord = {
    ...record,
    data: {
      ...record.data,
      status: "done" as const,
      outcome: "Cassette repaired",
      linkedEntries: [
        {
          id: "report",
          expectedRevision: 2,
          disposition: "include" as const,
          reason: "",
        },
        {
          id: "excluded",
          expectedRevision: 2,
          disposition: "exclude" as const,
          reason: "Electrical work belongs to a separate order.",
        },
      ],
    },
  };
  const { application } = fixture({
    history: jest.fn(async () => ({
      record: completedRecord,
      revisions: [],
      nextBefore: 0,
    })),
    related: jest.fn(async () => ({
      entries: [included, excluded, context],
      total: 3,
      nextCursor: "",
    })),
  });
  render(
    <MaintenanceWorkspace
      application={application}
      timeZone="UTC"
      initialRecordId="record"
      renderReportCards={(entries, open) => (
        <EntrySummaryCards
          entries={entries}
          expanded
          preview="original"
          open={open}
        />
      )}
    />,
  );
  const excludedGroup = await screen.findByRole("region", {
    name: "Excluded from this repair",
  });
  expect(
    within(excludedGroup).getByText(
      "Electrical work belongs to a separate order.",
    ),
  ).toBeVisible();
  expect(
    within(excludedGroup).getByRole("button", {
      name: /Excluded electrical failure/,
    }),
  ).toBeVisible();
  const includedGroup = screen.getByRole("region", {
    name: "Included in this repair",
  });
  expect(
    within(includedGroup).getByRole("button", {
      name: /Cassette direction error/,
    }),
  ).toBeVisible();
  expect(within(includedGroup).queryByText("Reported blocked")).toBeNull();
  expect(within(includedGroup).getByText(report.content.details)).toBeVisible();
  expect(
    within(includedGroup).queryByText(
      "Maintenance order: cassette repair outcome",
    ),
  ).toBeNull();
  expect(
    within(includedGroup).queryByText("Excluded electrical failure"),
  ).toBeNull();
  expect(
    within(screen.getByRole("region", { name: "Related context" })).getByText(
      "Separate drive observation",
    ),
  ).toBeVisible();
  expect(
    screen.getByText(
      "Completion closes included open reports only. Excluded reports and related context retain their own status.",
    ),
  ).toBeVisible();
});
test("source report previews show original observations only when requested", () => {
  const entry = {
    ...report,
    issueState: "resolved" as const,
    latestUpdate: {
      note: "Intervention feedback remains in source history",
      actorName: "Worker",
      at: "2026-10-06T09:00:00Z",
    },
  };
  const { rerender } = render(
    <EntrySummaryCards entries={[entry]} expanded open={jest.fn()} />,
  );
  expect(screen.getByText(entry.latestUpdate.note)).toBeVisible();
  expect(screen.queryByText(report.content.details)).toBeNull();
  rerender(
    <EntrySummaryCards
      entries={[entry]}
      expanded
      preview="original"
      open={jest.fn()}
    />,
  );
  expect(screen.getByText(report.content.details)).toBeVisible();
  expect(screen.queryByText(entry.latestUpdate.note)).toBeNull();
  expect(screen.queryByText("Reported blocked")).toBeNull();
});

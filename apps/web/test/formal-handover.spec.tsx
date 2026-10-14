import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { FormalHandoverApplication, type FormalGateway } from "../src/features/shift-handover/application/formal-records";
import { FormalHandoverWorkspace } from "../src/features/shift-handover/adapters/react/FormalHandoverWorkspace";
import type { FormalContext, FormalRecord, EntryEvidence, ShiftReference } from "../src/features/shift-handover/domain/formal-models";
const shift: ShiftReference = { id: "planned-shift", date: "2026-10-14", shiftTypeId: "early", label: "Early", targetId: "department", targetLabel: "Department",
  startsAt: "2026-10-14T05:00:00.000Z", endsAt: "2026-10-14T14:15:00.000Z", assignments: [{ id: "assigned", revision: 1 }] };
const entry: EntryEvidence = { id: "report", revision: 1, authorId: "tech", authorName: "Technician", createdAt: "2026-10-14T08:00:00.000Z",
  content: { date: "2026-10-14", categoryId: "problems", summary: "Inspect the guard", details: "Inspection remains pending", departmentId: "department", areaId: "",
    equipmentCode: "0001", equipmentNamespace: "site-equipment", condition: "inspection-needed", externalReference: "", challenge: "", cause: "", measure: "", dueDate: "", feedbackDueDate: "", discuss: true },
  departmentLabel: "Department", areaLabel: "", categoryLabel: "Problems", responsibleId: "tech", responsibleName: "Technician", issueState: "open" };
function fixture() {
  let actor = "leader", record: FormalRecord | null = null;
  const context: FormalContext = { actorId: actor, canManageRecords: true, locations: [{ id: "department", label: "Department", parentId: "", role: "department", sectorKey: "" }], timeZone: "UTC" };
  const gateway: FormalGateway = {
    context: jest.fn(async () => ({ ...context, actorId: actor })), shifts: jest.fn(async () => ({ shifts: [shift], coverage: "planned-assignments" as const })),
    query: jest.fn(async () => ({ records: record ? [record] : [], total: record ? 1 : 0, nextCursor: "" })),
    candidates: jest.fn(async () => ({ entries: [entry], total: 1 })),
    save: jest.fn(async (input) => { record = { id: "record", revision: record ? record.revision + 1 : 1, state: record?.state ?? "draft", authorId: actor, authorName: "Leader",
      createdAt: "2026-10-14T09:00:00.000Z", updatedAt: "2026-10-14T09:00:00.000Z", shift, departmentLabel: "Department", areaLabel: "", content: input.content,
      closedBy: "", closedByName: "", closedAt: "", outcome: "", entries: input.content.entryIds.includes(entry.id) ? [entry] : [], pending: [], acknowledgements: [] }; return record; }),
    transition: jest.fn(async (input) => { record = { ...record!, revision: record!.revision + 1,
      ...(input.action === "publish" ? { state: "open" as const } : input.action === "close" ? { state: "closed" as const, closedBy: actor, closedByName: "Leader", closedAt: "2026-10-14T14:15:00.000Z", outcome: input.note, pending: [entry] } :
        { acknowledgements: [{ actorId: actor, actorName: "Task Force", at: "2026-10-14T14:16:00.000Z", note: input.note }] }) }; return record; }),
    history: jest.fn(async () => ({ record: record!, revisions: [], nextBefore: 0 })),
    previous: jest.fn(async () => ({ shift: null, record: null, overlaps: false, pending: [entry], pendingTotal: 1 })),
  };
  const application = new FormalHandoverApplication(gateway, () => "stable-create-key");
  return { application, gateway, actor: (id: string) => { actor = id; }, record: () => record };
}
test("manager creates, reviews, publishes and closes a transfer without resolving the carried report; incoming Task Force acknowledges", async () => {
  const f = fixture(), view = render(<FormalHandoverWorkspace application={f.application} departmentId="department" />);
  const add = await screen.findByRole("button", { name: "New shift record" }); await waitFor(() => expect(add).toBeEnabled());
  fireEvent.click(add);
  const form = screen.getByRole("form", { name: "New shift record" });
  fireEvent.change(within(form).getByLabelText("Title"), { target: { value: "Early transfer" } });
  fireEvent.change(within(form).getByLabelText("Transfer summary"), { target: { value: "Carry the guard inspection forward" } });
  fireEvent.click(await within(form).findByRole("checkbox"));
  fireEvent.click(within(form).getByRole("button", { name: "Save draft" }));
  await screen.findByRole("button", { name: "Publish record" });
  expect(f.gateway.save).toHaveBeenCalledWith(expect.objectContaining({ key: "stable-create-key", content: expect.objectContaining({ shiftDate: shift.date, entryIds: ["report"] }) }));
  fireEvent.change(screen.getByLabelText("Publication note"), { target: { value: "Reviewed with the team" } });
  fireEvent.click(screen.getByRole("button", { name: "Publish record" }));
  await screen.findByRole("button", { name: "Close record" });
  fireEvent.change(screen.getByLabelText("Closing outcome"), { target: { value: "Inspection continues next shift" } });
  fireEvent.click(screen.getByRole("button", { name: "Close record" }));
  await screen.findByText("Closed transfer");
  expect(screen.getByText("Pending at closure (1)")).toBeInTheDocument(); expect(f.record()!.pending[0].issueState).toBe("open");
  expect(screen.queryByRole("button", { name: "Acknowledge receipt" })).not.toBeInTheDocument();
  view.unmount(); f.actor("task-force");
  render(<FormalHandoverWorkspace application={f.application} departmentId="department" />);
  fireEvent.click(await screen.findByRole("button", { name: /Early transfer/ }));
  await screen.findByRole("button", { name: "Acknowledge receipt" });
  fireEvent.change(screen.getByLabelText("Receiving acknowledgement"), { target: { value: "Incoming team reviewed the report" } });
  fireEvent.click(screen.getByRole("button", { name: "Acknowledge receipt" }));
  await screen.findByText(/Task Force · .*Incoming team reviewed the report/);
  expect(f.record()!.entries[0].revision).toBe(1);
});
test("missing Workforce planning shows the actual prerequisite and permission denial exposes no records", async () => {
  const f = fixture(); f.gateway.shifts = jest.fn(async () => ({ shifts: [], coverage: "planned-assignments" as const }));
  const view = render(<FormalHandoverWorkspace application={f.application} departmentId="department" />);
  await screen.findByText(/No planned Workforce shift exists/); expect(screen.getByRole("button", { name: "New shift record" })).toBeDisabled();
  view.unmount(); f.gateway.context = jest.fn(async () => { throw new Error("Formal shift records require manager access."); });
  render(<FormalHandoverWorkspace application={f.application} departmentId="department" />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Formal shift records require manager access.");
  expect(screen.queryByRole("button", { name: "New shift record" })).not.toBeInTheDocument();
});
test("uncertain draft responses reuse the same actor request key", async () => {
  const save = jest.fn().mockRejectedValueOnce(new Error("Disconnected")).mockResolvedValue({ id: "saved" });
  const app = new FormalHandoverApplication({ save } as unknown as FormalGateway, () => "stable-key");
  const input = { id: "", expectedRevision: 0, content: { shiftId: shift.id, shiftDate: shift.date, departmentId: "department", areaId: "", title: "Transfer", summary: "", entryIds: [] }, note: "" };
  await expect(app.save(input)).rejects.toThrow("Disconnected"); await expect(app.save(input)).resolves.toEqual({ id: "saved" });
  expect(save.mock.calls[0][0].key).toBe(save.mock.calls[1][0].key);
});

test("German formal controls/statuses use localized resources and preserve retained customer titles", async () => {
  const { setLanguage } = await import("../src/localization/i18n");
  setLanguage("de");
  try {
    const f = fixture();
    await f.application.save({ id: "", expectedRevision: 0, note: "", content: { shiftId: shift.id, shiftDate: shift.date,
      departmentId: "department", areaId: "", title: "Owner supplied conveyor title", summary: "", entryIds: [] } });
    render(<FormalHandoverWorkspace application={f.application} departmentId="department" />);
    await screen.findByRole("button", { name: /Owner supplied conveyor title/ });
    expect(screen.getByText("Entwurf")).toBeInTheDocument();
    expect(screen.getByLabelText("Von")).toBeInTheDocument();
    expect(screen.getByLabelText("Bis")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Owner supplied conveyor title/ }));
    await screen.findByRole("button", { name: "Protokoll veröffentlichen" });
    expect(screen.getByLabelText("Veröffentlichungshinweis")).toBeInTheDocument();
  } finally { setLanguage("en"); }
});

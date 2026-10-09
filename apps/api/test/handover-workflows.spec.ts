import { Handover, type Transaction } from "../src/modules/shift-handover/application/handover";
import { handoverCatalog } from "../src/host/adapters/handover-catalog";
import { validContent, validSelection, emptySelection, type Content, type Entry, type Revision } from "../src/modules/shift-handover/domain/handover";
import { assignedTarget } from "../src/modules/workforce/domain/assignment-default";
import type { Assignment } from "../src/modules/workforce/domain/workforce";

const catalog = handoverCatalog({ organizationId: "org", siteId: "site", externalSystemLabel: "Work reference",
  categories: ["Safety", "Information", "Successes", "People", "Problems", "Performance"].map((label) => ({ id: label.toLowerCase(), label })),
  locations: [{ id: "hall", label: "Halle", parentId: "", role: "department", sectorKey: "" },
    { id: "area", label: "Area", parentId: "hall", role: "area", sectorKey: "" }],
}, { organizationId: "org", siteId: "site" }, "UTC");
const content = (categoryId = "problems"): Content => ({ date: "2026-10-07", categoryId, summary: "Motor problem", details: "",
  departmentId: "hall", areaId: "area", equipmentCode: "", equipmentNamespace: "site-equipment", condition: "",
  externalReference: "", challenge: "", cause: "", measure: "", dueDate: "", feedbackDueDate: "", discuss: false });
function fixture() {
  let entries = new Map<string, Entry>();
  let revisions: Revision[] = [];
  let counter = 0;
  const tx: Transaction = { publisherProfile: "team-leader", coordinator: false, people: async () => [{ id: "author", name: "Author" }, { id: "other", name: "Other" }],
    names: async () => new Map(), latestUpdateActors: async () => new Map(), equipment: async () => ({ codes: [], nextCursor: "" }),
    get: async (id) => structuredClone(entries.get(id) ?? null), prior: async () => null, reference: async () => "",
    save: async (entry, revision) => { entries.set(entry.id, structuredClone(entry)); revisions.push(structuredClone(revision)); },
    list: async () => ({ entries: [...entries.values()], total: entries.size, nextCursor: "" }),
    history: async (entry) => ({ entry, revisions, nextBefore: 0 }), assignmentTarget: async () => "area",
  };
  const app = new Handover({ run: async (_actor, _permission, work) => {
    const backup = structuredClone(entries), history = structuredClone(revisions);
    try { return await work(tx); } catch (error) { entries = backup; revisions = history; throw error; }
  } }, catalog, () => `entry-${++counter}`, () => "2026-10-07T10:00:00.000Z");
  const create = (categoryId = "problems", actor = "author", extra: Partial<Content> = {}) => app.create(actor,
    { key: `key-${counter}`, content: { ...content(categoryId), ...extra }, issue: false, responsibleId: "" });
  return { app, tx, create, entries: () => entries, revisions: () => revisions };
}
test("Safety rejects equipment and its condition while retaining one optional area", () => {
  expect(validContent(content("safety"), catalog)).toMatchObject({ areaId: "area", equipmentCode: "" });
  expect(() => validContent({ ...content("safety"), equipmentCode: "motor" }, catalog)).toThrow("invalid_handover");
  expect(() => validContent({ ...content("safety"), condition: "blocked" }, catalog)).toThrow("invalid_handover");
});
test("technical classification derives from blocked operation and always tracks the report", async () => {
  const f = fixture();
  expect(await f.create("problems", "author", { condition: "blocked" })).toMatchObject({ issueState: "open", content: { categoryId: "performance" } });
  expect(await f.create("performance", "author", { condition: "inspection-needed" })).toMatchObject({ issueState: "open", content: { categoryId: "problems" } });
});
test("Workforce defaults use actual day assignments, never a home department or an unzoned leader", async () => {
  const assignment = (duty: Assignment["duty"], targetId = "hall", userId = "author", date = "2026-10-07") => ({ duty, targetId, userId, date }) as Assignment;
  expect(assignedTarget("author", "2026-10-07", [])).toBe("");
  expect(assignedTarget("author", "2026-10-07", [assignment("floating")])).toBe("");
  expect(assignedTarget("author", "2026-10-07", [assignment("leader", "")])).toBe("");
  expect(assignedTarget("author", "2026-10-07", [assignment("zone"), assignment("leader", "")])).toBe("hall");
  expect(assignedTarget("author", "2026-10-07", [assignment("zone", "hall", "other"), assignment("zone", "hall", "author", "2026-10-08")])).toBe("");
  expect(assignedTarget("author", "2026-10-07", [assignment("zone"), assignment("zone", "other-hall")])).toBe("");
  const f = fixture();
  expect(await f.app.defaultDepartment("author", "2026-10-07")).toEqual({ departmentId: "hall" });
  f.tx.assignmentTarget = async () => "";
  expect(await f.app.defaultDepartment("author", "2026-10-07")).toEqual({ departmentId: "" });
});
test("Success closes only selected authorized current technical reports and retains outcome evidence", async () => {
  const f = fixture(), selected = await f.create(), unrelated = await f.create();
  const success = await f.create("successes", "author", { summary: "Motor restored", details: "Replaced the drive.",
    resolutions: [{ source: "handover", id: selected.id, expectedRevision: selected.revision }] });
  expect(f.entries().get(selected.id)).toMatchObject({ issueState: "resolved", revision: 2, latestUpdate: { note: "Replaced the drive." } });
  expect(f.entries().get(unrelated.id)?.issueState).toBe("open");
  await expect(f.app.change("author", { id: success.id, expectedRevision: 1, action: "state", state: "open", note: "Try tracking an outcome" })).rejects.toThrow("invalid_handover");
  expect(success.completedReferences).toEqual([{ source: "handover", id: selected.id, title: "Motor problem", location: "Halle · Area" }]);
  await expect(f.app.change("author", { id: success.id, expectedRevision: 1, action: "correct", note: "Change reference",
    content: { ...success.content, resolutions: [{ source: "handover", id: unrelated.id, expectedRevision: 1 }] } })).rejects.toThrow("handover_conflict");
});
test("stale, foreign or nontechnical references roll back the publication and every selected resolution", async () => {
  for (const failure of ["stale", "foreign", "safety"] as const) {
    const f = fixture(), first = await f.create(), last = await f.create(failure === "safety" ? "safety" : "problems", failure === "foreign" ? "other" : "author");
    await expect(f.create("successes", "author", { resolutions: [
      { source: "handover", id: first.id, expectedRevision: first.revision },
      { source: "handover", id: last.id, expectedRevision: failure === "stale" ? 99 : last.revision },
    ] })).rejects.toThrow(failure === "foreign" ? "handover_denied" : "handover_conflict");
    expect(f.entries().size).toBe(2); expect(f.entries().get(first.id)?.issueState).toBe("open"); expect(f.revisions()).toHaveLength(2);
  }
  expect(() => validContent(content("successes"), catalog)).toThrow("invalid_handover");
});
test("Information uses a bounded inclusive display date and coordinator publication", async () => {
  const f = fixture();
  await expect(f.create("information", "author", { displayUntil: "2026-10-12" })).rejects.toThrow("handover_denied");
  f.tx.coordinator = true;
  f.tx.publisherProfile = "administrator";
  expect((await f.app.context("author")).categories.find((category) => category.id === "information")?.canPublish).toBe(false);
  await expect(f.create("information", "author", { displayUntil: "2026-10-12" })).rejects.toThrow("handover_denied");
  f.tx.publisherProfile = "team-leader";
  expect(await f.create("information", "author", { displayUntil: "2026-10-12" })).toMatchObject({ content: { displayUntil: "2026-10-12" } });
  expect(() => validContent({ ...content("information"), displayUntil: "2026-10-06" }, catalog)).toThrow("invalid_handover");
  expect(() => validSelection({ ...emptySelection, notificationReads: [{ id: "entry", at: "invalid" }] })).toThrow("invalid_handover");
});

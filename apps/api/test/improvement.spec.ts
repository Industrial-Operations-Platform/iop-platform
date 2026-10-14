import { fixture, input, selection, measurement } from "./improvement-fixture";
import { assess, comparisonSelection, validateData } from "../src/modules/improvement-tracking/domain/improvement";
describe("Improvement actions and evidence", () => {
  test.each(["admin", "leader", "taskforce"])("%s creates, owns, links and evaluates an attributed action", async actor => {
    const f = fixture();
    let action = await f.app.save(actor, input);
    expect(action).toMatchObject({
      revision: 1,
      authorId: actor,
      ownerName: "Team Leader",
      assetName: "Drive",
      issueTitle: "Drive alarm",
      canEdit: true
    });
    const replay = await f.app.save(actor, input);
    expect(replay.revision).toBe(1);
    for (const status of ["in-progress", "implemented", "evaluated"] as const) action = await f.app.save(actor, {
      ...input,
      expectedRevision: action.revision,
      reason: "Workflow reviewed.",
      data: {
        ...action.data,
        status,
        implementedDate: status === "in-progress" ? "" : "2026-10-14",
        result: status === "evaluated" ? "Observed reporting frequency decreased." : ""
      }
    });
    expect(action.data.status).toBe("evaluated");
    expect(f.revisions).toHaveLength(4);
    expect(f.revisions[0].action.data.status).toBe("planned");
  });
  test("rejects forged fields, invalid dates, missing outcomes and skipped lifecycle", async () => {
    const f = fixture();
    expect(() => validateData({
      ...input.data,
      dueDate: "2026-02-30"
    })).toThrow("invalid_improvement");
    expect(() => validateData({
      ...input.data,
      target: {
        ...input.data.target,
        reductionPercent: 101
      }
    })).toThrow();
    expect(() => f.app.save("admin", {
      ...input,
      authorId: "forged"
    } as never)).toThrow();
    await f.app.save("admin", input);
    await expect(f.app.save("admin", {
      ...input,
      expectedRevision: 1,
      reason: "Skip lifecycle",
      data: {
        ...input.data,
        status: "implemented",
        implementedDate: "2026-10-14"
      }
    })).rejects.toThrow("invalid_improvement");
    await expect(f.app.save("admin", {
      ...input,
      expectedRevision: 9,
      reason: "Stale"
    })).rejects.toThrow("improvement_conflict");
    await expect(f.app.save("admin", {
      ...input,
      id: "another",
      data: {
        ...input.data,
        assetId: "foreign"
      }
    })).rejects.toThrow();
  });
  test("denies ineligible current users and non-coordinator reassignment", async () => {
    const f = fixture();
    await expect(f.app.catalog("technician")).rejects.toThrow("improvement_denied");
    await expect(f.app.save("contributor", input)).rejects.toThrow("improvement_denied");
    await f.app.save("admin", input);
    f.setDenied(true);
    await expect(f.app.history("admin", input.id)).rejects.toThrow("improvement_denied");
  });
  test("notes and corrections append original evidence and action revision atomically", async () => {
    const f = fixture();
    await f.app.save("admin", input);
    const note = {
      id: "note-1",
      actionId: input.id,
      expectedRevision: 1,
      kind: "note" as const,
      note: "Guide adjusted.",
      externalReference: "Work order 123",
      supersedesId: ""
    };
    const saved = await f.app.addEvidence("taskforce", note);
    expect(saved.action.revision).toBe(2);
    expect(saved.evidence.actorName).toBe("Task Force");
    await f.app.addEvidence("taskforce", note);
    expect(f.evidence.size).toBe(1);
    await f.app.addEvidence("leader", {
      ...note,
      id: "note-2",
      expectedRevision: 2,
      note: "Guide checked; adjustment still pending.",
      supersedesId: note.id
    });
    expect(f.evidence.get(note.id)?.note).toBe("Guide adjusted.");
    expect(f.actions.get(input.id)?.evidenceCount).toBe(2);
    await expect(f.app.addEvidence("admin", {
      ...note,
      id: "note-3",
      expectedRevision: 3,
      supersedesId: note.id
    })).rejects.toThrow("improvement_conflict");
    f.setFailure(true);
    await expect(f.app.addEvidence("admin", {
      ...note,
      id: "note-4",
      expectedRevision: 3
    })).rejects.toThrow("Synthetic");
    expect(f.evidence.has("note-4")).toBe(false);
    expect(f.actions.get(input.id)?.revision).toBe(3);
  });
  test("comparison is recomputed by the server and saved immutably with target/source provenance", async () => {
    const f = fixture();
    await f.app.save("admin", input);
    const preview = await f.app.compare("taskforce", {
      actionId: input.id,
      expectedRevision: 1,
      selection
    });
    expect(preview.frequencyPerObservedDate.reductionPercent).toBe(40);
    expect(preview.observedTarget).toBe("met");
    expect(preview.attribution).toMatch(/does not establish causality/);
    const saved = await f.app.saveComparison("leader", {
      id: "compare-1",
      actionId: input.id,
      expectedRevision: 1,
      selection,
      note: "Observed change after guide work."
    });
    expect(saved.action.revision).toBe(2);
    expect(saved.saved.comparison.publicationRevision).toBe("revision");
    f.setMeasurement({
      ...measurement(),
      profileVersion: "changed",
      before: {
        ...measurement().before,
        frequency: 200
      }
    });
    expect((await f.app.comparisons("admin", input.id)).comparisons[0].comparison.before.frequency).toBe(10);
    expect(() => f.app.saveComparison("admin", {
      id: "forged",
      actionId: input.id,
      expectedRevision: 2,
      selection,
      note: "",
      comparison: {
        before: 0
      }
    } as never)).toThrow("invalid_improvement");
  });
});
describe("Fair source comparison", () => {
  test("missing dates are explicit, non-assessable and absent periods have null averages", () => {
    const m = measurement();
    m.after.admittedDates = [];
    m.after.missingDates = [...m.after.eligibleDates];
    m.after.frequency = 0;
    m.after.records = 0;
    const result = assess(m, input.data.target);
    expect(result.frequencyPerObservedDate.after).toBeNull();
    expect(result.observedTarget).toBe("not-assessable");
    expect(result.warnings.join(" ")).toMatch(/missing imports are not zero/i);
  });
  test("zero baseline does not produce a reduction percentage or causal claim", () => {
    const m = measurement();
    m.before.frequency = 0;
    const result = assess(m, input.data.target);
    expect(result.frequencyPerObservedDate.reductionPercent).toBeNull();
    expect(result.observedTarget).toBe("not-assessable");
    expect(result.warnings.join(" ")).toMatch(/zero baseline/);
  });
  test("unequal eligible periods, admitted coverage, weekday mixes and unmapped aliases are surfaced", () => {
    const m = measurement();
    m.mapped = false;
    m.after.eligibleDates.push("2026-10-10");
    m.after.admittedDates.push("2026-10-10");
    const result = assess(m, input.data.target);
    expect(result.warnings.join(" ")).toMatch(/different numbers of eligible/);
    expect(result.warnings.join(" ")).toMatch(/different weekday/);
    expect(result.observedTarget).toBe("not-assessable");
    expect(result.frequencyPerObservedDate.before).toBeNull();
  });
  test("overlapping dates, empty explicit scope and mixing asset aliases with filters are rejected", () => {
    expect(() => comparisonSelection({
      ...selection,
      after: selection.before
    })).toThrow();
    expect(() => comparisonSelection({
      ...selection,
      scope: "selection"
    })).toThrow();
    expect(() => comparisonSelection({
      ...selection,
      filters: {
        ...selection.filters,
        equipment: "S-001"
      }
    })).toThrow();
  });
});

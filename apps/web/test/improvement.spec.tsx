import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ImprovementApplication, type Gateway } from "../src/features/improvement-tracking/application/improvement";
import { ImprovementWorkspace } from "../src/features/improvement-tracking/adapters/react/ImprovementWorkspace";
import { ImprovementForm } from "../src/features/improvement-tracking/adapters/react/ImprovementForm";
import { emptyAction, statuses, type ActionView, type Catalog, type Comparison, type Evidence, type SavedComparison } from "../src/features/improvement-tracking/domain/models";
const catalog: Catalog = {
  actorId: "leader",
  canContribute: true,
  canCoordinate: true,
  people: [{
    id: "leader",
    name: "Jordan Team Leader"
  }],
  locations: [{
    id: "area",
    parentId: "",
    label: "Assembly"
  }],
  assets: [{
    id: "asset",
    name: "Drive",
    code: "S-001",
    status: "validated"
  }]
};
const initial: ActionView = {
  id: "action",
  revision: 1,
  data: {
    ...emptyAction("area"),
    title: "Reduce repeated alarms",
    assetId: "asset",
    ownerId: "leader",
    target: {
      objective: "Reduce reported frequency by 20%",
      metric: "frequency",
      reductionPercent: 20
    }
  },
  authorId: "leader",
  authorName: "Jordan Team Leader",
  ownerName: "Jordan Team Leader",
  assetName: "Drive",
  issueTitle: "",
  locationLabel: "Assembly",
  createdAt: "2026-10-14T12:00:00.000Z",
  updatedAt: "2026-10-14T12:00:00.000Z",
  evidenceCount: 0,
  comparisonCount: 0,
  canEdit: true,
  canCoordinate: true
};
function comparison(): Comparison {
  return {
    sourceId: "source",
    siteTimeZone: "UTC",
    publicationRevision: "retained-publication-revision",
    profileVersion: "profile",
    selection: {
      before: {
        from: "2026-10-01",
        toExclusive: "2026-10-02"
      },
      after: {
        from: "2026-10-08",
        toExclusive: "2026-10-09"
      },
      scope: "asset",
      filters: {
        sector: "",
        area: "",
        equipment: "",
        message: ""
      }
    },
    aliases: [{
      code: "S-001",
      sector: "Warehouse",
      area: "Assembly"
    }],
    before: {
      from: "2026-10-01",
      toExclusive: "2026-10-02",
      eligibleDates: ["2026-10-01"],
      admittedDates: ["2026-10-01"],
      missingDates: [],
      excludedDates: [],
      frequency: 10,
      alarmSeconds: 600,
      records: 1
    },
    after: {
      from: "2026-10-08",
      toExclusive: "2026-10-09",
      eligibleDates: ["2026-10-08"],
      admittedDates: ["2026-10-08"],
      missingDates: [],
      excludedDates: [],
      frequency: 6,
      alarmSeconds: 360,
      records: 1
    },
    mapped: true,
    warnings: [],
    frequencyPerObservedDate: {
      before: 10,
      after: 6,
      change: -4,
      reductionPercent: 40
    },
    alarmSecondsPerObservedDate: {
      before: 600,
      after: 360,
      change: -240,
      reductionPercent: 40
    },
    target: initial.data.target,
    observedTarget: "met",
    attribution: "Observed change does not establish causality. Accumulated alarm seconds are not plant downtime."
  };
}
function setup(overrides: Partial<Gateway> = {}) {
  let action = JSON.parse(JSON.stringify(initial)) as ActionView;
  const evidence: Evidence[] = [],
    saved: SavedComparison[] = [];
  let serial = 0;
  const gateway: Gateway = {
    catalog: jest.fn(async () => catalog),
    query: jest.fn(async () => ({
      actions: [action],
      total: 1,
      nextCursor: "",
      statusCounts: Object.fromEntries(statuses.map(s => [s, s === action.data.status ? 1 : 0])) as Record<typeof statuses[number], number>
    })),
    issues: jest.fn(async () => ({
      issues: [],
      nextCursor: ""
    })),
    history: jest.fn(async () => ({
      action,
      revisions: [],
      nextBefore: 0
    })),
    evidence: jest.fn(async () => ({
      evidence: [...evidence],
      nextCursor: ""
    })),
    comparisons: jest.fn(async () => ({
      comparisons: [...saved],
      nextCursor: ""
    })),
    save: jest.fn(async input => {
      action = {
        ...action,
        id: input.id,
        data: input.data,
        revision: input.expectedRevision + 1
      };
      return action;
    }),
    addEvidence: jest.fn(async input => {
      action = {
        ...action,
        revision: action.revision + 1,
        evidenceCount: action.evidenceCount + 1
      };
      const note: Evidence = {
        ...input,
        actionRevision: action.revision,
        actorId: "leader",
        actorName: "Jordan Team Leader",
        at: "2026-10-14T12:01:00.000Z"
      };
      evidence.push(note);
      return {
        action,
        evidence: note
      };
    }),
    compare: jest.fn(async () => comparison()),
    saveComparison: jest.fn(async input => {
      action = {
        ...action,
        revision: action.revision + 1,
        comparisonCount: action.comparisonCount + 1
      };
      const snapshot: SavedComparison = {
        id: input.id,
        actionId: action.id,
        actionRevision: action.revision,
        actorId: "leader",
        actorName: "Jordan Team Leader",
        at: "2026-10-14T12:02:00.000Z",
        note: input.note,
        comparison: comparison()
      };
      saved.push(snapshot);
      return {
        action,
        saved: snapshot
      };
    }),
    ...overrides
  };
  return {
    gateway,
    application: new ImprovementApplication(gateway, () => "generated-" + ++serial)
  };
}
test("creates linked owner/target actions and retains form identity after an uncertain save", async () => {
  const save = jest.fn().mockRejectedValueOnce(new Error("Save unavailable; retry.")).mockResolvedValue(initial);
  const {
    application,
    gateway
  } = setup({
    save
  });
  render(<ImprovementWorkspace application={application} timeZone="UTC" />);
  fireEvent.click(await screen.findByRole("button", {
    name: "New action"
  }));
  fireEvent.change(screen.getByLabelText("Action title"), {
    target: {
      value: "Adjust guide"
    }
  });
  fireEvent.change(screen.getByLabelText("Improvement objective"), {
    target: {
      value: "Reduce observed alarms"
    }
  });
  await screen.findByRole("option", { name: "S-001 · Drive" });
  fireEvent.change(screen.getByLabelText("Linked asset"), {
    target: {
      value: "asset"
    }
  });
  fireEvent.change(screen.getByLabelText("Owner"), {
    target: {
      value: "leader"
    }
  });
  fireEvent.click(screen.getByRole("button", {
    name: "Save action"
  }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Save unavailable");
  expect(screen.getByLabelText("Action title")).toHaveValue("Adjust guide");
  fireEvent.click(screen.getByRole("button", {
    name: "Save action"
  }));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
  expect(save.mock.calls[0][0].id).toBe(save.mock.calls[1][0].id);
  expect(gateway.save).toHaveBeenLastCalledWith(expect.objectContaining({
    data: expect.objectContaining({
      assetId: "asset",
      ownerId: "leader",
      target: expect.objectContaining({
        objective: "Reduce observed alarms"
      })
    })
  }));
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
function actionPage(actions: ActionView[], nextCursor = "") {
  return { actions, nextCursor, total: 3, statusCounts: Object.fromEntries(statuses.map(status => [status, status === "planned" ? actions.length : 0])) as Record<typeof statuses[number], number> };
}
function anotherAction(id: string, title = id): ActionView {
  return { ...initial, id, data: { ...initial.data, title } };
}

test("action paging retains applied filters, blocks unsubmitted search and discards late pages", async () => {
  const late = deferred<ReturnType<typeof actionPage>>();
  const filtered = anotherAction("filtered", "Filtered action");
  const query = jest.fn(async (selection: Parameters<Gateway["query"]>[0]) => {
    if (selection.cursor) return late.promise;
    return selection.status ? actionPage([filtered]) : actionPage([initial], "next-actions");
  });
  const { application } = setup({ query });
  render(<ImprovementWorkspace application={application} timeZone="UTC" />);
  const more = await screen.findByRole("button", { name: "Load more actions" });
  fireEvent.click(screen.getByRole("button", { name: "Search improvements" }));
  const search = screen.getByRole("searchbox", { name: "Search improvements" });
  fireEvent.change(search, { target: { value: "draft" } });
  expect(more).toBeDisabled();
  expect(query).toHaveBeenCalledTimes(1);
  fireEvent.change(search, { target: { value: "" } });
  fireEvent.click(more);
  fireEvent.click(more);
  expect(query).toHaveBeenCalledTimes(2);
  expect(query).toHaveBeenLastCalledWith({ cursor: "next-actions" });
  fireEvent.change(screen.getByLabelText("Status"), { target: { value: "blocked" } });
  await screen.findByRole("button", { name: "Filtered action" });
  await act(async () => late.resolve(actionPage([anotherAction("late", "Late unfiltered action")])));
  expect(screen.queryByRole("button", { name: "Late unfiltered action" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  await screen.findByRole("button", { name: "Reduce repeated alarms" });
  expect(search).toHaveValue("");
  expect(screen.getByLabelText("Status")).toHaveValue("");
});

test("applied search is reused by action paging and failures can be retried", async () => {
  const query = jest.fn<ReturnType<Gateway["query"]>, Parameters<Gateway["query"]>>()
    .mockRejectedValueOnce(new Error("Query unavailable"))
    .mockResolvedValue(actionPage([initial], "next-actions"));
  const { application } = setup({ query });
  render(<ImprovementWorkspace application={application} timeZone="UTC" />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Query unavailable");
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByRole("button", { name: "Reduce repeated alarms" });
  fireEvent.click(screen.getByRole("button", { name: "Search improvements" }));
  fireEvent.change(screen.getByRole("searchbox", { name: "Search improvements" }), { target: { value: "alarms" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  fireEvent.click(await screen.findByRole("button", { name: "Load more actions" }));
  await waitFor(() => expect(query).toHaveBeenLastCalledWith({ search: "alarms", cursor: "next-actions" }));
  expect(within(screen.getByRole("table", { name: "Improvement actions" })).getAllByRole("rowheader")).toHaveLength(1);
});

test.each(["evidence", "comparisons", "revisions"] as const)("late %s pages cannot contaminate another action and duplicate requests are blocked", async kind => {
  const second = anotherAction("second", "Second action");
  const lateEvidence = deferred<Awaited<ReturnType<Gateway["evidence"]>>>();
  const lateComparisons = deferred<Awaited<ReturnType<Gateway["comparisons"]>>>();
  const lateHistory = deferred<Awaited<ReturnType<Gateway["history"]>>>();
  const evidence = jest.fn(async (id: string, cursor?: string) => cursor ? lateEvidence.promise : { evidence: [], nextCursor: id === initial.id ? "next-evidence" : "" });
  const comparisons = jest.fn(async (id: string, cursor?: string) => cursor ? lateComparisons.promise : { comparisons: [], nextCursor: id === initial.id ? "next-comparisons" : "" });
  const history = jest.fn(async (id: string, before?: number) => before ? lateHistory.promise : { action: id === initial.id ? initial : second, revisions: [], nextBefore: id === initial.id ? 1 : 0 });
  const { application } = setup({ query: async () => actionPage([initial, second]), evidence, comparisons, history });
  render(<ImprovementWorkspace application={application} timeZone="UTC" />);
  fireEvent.click(await screen.findByRole("button", { name: "Reduce repeated alarms" }));
  await screen.findByText("Reduce reported frequency by 20%");
  if (kind === "comparisons") fireEvent.click(screen.getByText("Saved comparison evidence (0)"));
  if (kind === "revisions") fireEvent.click(screen.getByText("Action revision history"));
  const button = screen.getByRole("button", { name: kind === "evidence" ? "Load more evidence" : kind === "comparisons" ? "Load more comparisons" : "Load older revisions" });
  fireEvent.click(button);
  fireEvent.click(button);
  const gateway = kind === "evidence" ? evidence : kind === "comparisons" ? comparisons : history;
  expect(gateway).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("button", { name: "Improvement Tracking" }));
  fireEvent.click(await screen.findByRole("button", { name: "Second action" }));
  await screen.findByText("Reduce reported frequency by 20%");
  await act(async () => {
    if (kind === "evidence") lateEvidence.resolve({ evidence: [{ id: "late", actionId: initial.id, actionRevision: 1, kind: "note", note: "Late evidence from first action", externalReference: "", supersedesId: "", actorId: "leader", actorName: "Jordan", at: initial.createdAt }], nextCursor: "" });
    if (kind === "comparisons") lateComparisons.resolve({ comparisons: [{ id: "late", actionId: initial.id, actionRevision: 1, actorId: "leader", actorName: "Late comparison author", at: initial.createdAt, note: "Late comparison from first action", comparison: comparison() }], nextCursor: "" });
    if (kind === "revisions") lateHistory.resolve({ action: initial, revisions: [{ action: initial, actorId: "leader", actorName: "Jordan", at: initial.createdAt, change: "updated", reason: "Late revision from first action", referenceId: "" }], nextBefore: 0 });
  });
  expect(screen.queryByText(/Late .* from first action/)).not.toBeInTheDocument();
  expect(screen.getByText("Second action", { exact: true })).toBeVisible();
});

test("evidence editors and comparison requests are scoped to action identity at equal revisions", async () => {
  const second = anotherAction("second", "Second action");
  const late = deferred<Awaited<ReturnType<Gateway["saveComparison"]>>>();
  const compare = jest.fn(async () => comparison());
  const saveComparison = jest.fn(() => late.promise);
  const { application } = setup({ query: async () => actionPage([initial, second]), history: async id => ({ action: id === initial.id ? initial : second, revisions: [], nextBefore: 0 }), compare, saveComparison });
  render(<ImprovementWorkspace application={application} timeZone="UTC" />);
  fireEvent.click(await screen.findByRole("button", { name: "Reduce repeated alarms" }));
  fireEvent.click(await screen.findByText("Add note or observed result"));
  fireEvent.change(screen.getByLabelText("Evidence note"), { target: { value: "Draft for first action" } });
  fireEvent.click(screen.getByText("Before and after comparison"));
  for (const [label, value] of [["Before from", "2026-10-01"], ["Before end (exclusive)", "2026-10-02"], ["After from", "2026-10-08"], ["After end (exclusive)", "2026-10-09"]]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Calculate observed comparison" }));
  expect(compare).toHaveBeenCalledTimes(1);
  fireEvent.click(await screen.findByRole("button", { name: "Save comparison evidence" }));
  expect(saveComparison).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Improvement Tracking" }));
  fireEvent.click(await screen.findByRole("button", { name: "Second action" }));
  fireEvent.click(await screen.findByText("Add note or observed result"));
  expect(screen.getByLabelText("Evidence note")).toHaveValue("");
  await act(async () => late.resolve({ action: initial, saved: { id: "old-save", actionId: initial.id, actionRevision: 1, actorId: "leader", actorName: "Jordan", at: initial.createdAt, note: "", comparison: comparison() } }));
  expect(screen.queryByRole("region", { name: "Observed before and after result" })).not.toBeInTheDocument();
  expect(screen.getByText("Second action", { exact: true })).toBeVisible();
});

test("late issue choice pages are discarded after a search change and selection is retained", async () => {
  const late = deferred<{ issues: import("../src/features/improvement-tracking/domain/models").IssueReference[]; nextCursor: string }>();
  const issue = { id: "first-issue", title: "First issue", state: "open", revision: 1, equipmentCode: "S-001", area: "Assembly" };
  const issues = jest.fn(async (search: string, cursor?: string) => cursor ? late.promise : { issues: [{ ...issue, id: search || issue.id, title: search || issue.title }], nextCursor: search ? "" : "next-issues" });
  const { application } = setup({ issues });
  render(<ImprovementForm application={application} catalog={catalog} pending={false} onSave={jest.fn()} onCancel={jest.fn()} />);
  await screen.findByRole("option", { name: "First issue · S-001" });
  fireEvent.change(screen.getByLabelText("Linked issue"), { target: { value: "first-issue" } });
  const more = screen.getByRole("button", { name: "Load more issues" });
  fireEvent.click(more); fireEvent.click(more);
  expect(issues).toHaveBeenCalledTimes(2);
  fireEvent.change(screen.getByLabelText("Find reported issue"), { target: { value: "New match" } });
  await screen.findByRole("option", { name: "New match · S-001" });
  await act(async () => late.resolve({ issues: [{ ...issue, id: "late", title: "Late issue" }], nextCursor: "" }));
  expect(screen.queryByRole("option", { name: "Late issue · S-001" })).not.toBeInTheDocument();
  expect(screen.getByLabelText("Linked issue")).toHaveValue("first-issue");
});
test("records attributed evidence and shows a server-computed comparison with retained provenance", async () => {
  const {
    application,
    gateway
  } = setup();
  render(<ImprovementWorkspace application={application} timeZone="UTC" />);
  fireEvent.click(await screen.findByRole("button", {
    name: "Reduce repeated alarms"
  }));
  await screen.findByText("Reduce reported frequency by 20%");
  fireEvent.click(screen.getByText("Add note or observed result"));
  fireEvent.change(screen.getByLabelText("Evidence note"), {
    target: {
      value: "Guide inspected; no adjustment made yet."
    }
  });
  fireEvent.click(screen.getByRole("button", {
    name: "Add evidence"
  }));
  await waitFor(() => expect(screen.getByText("Guide inspected; no adjustment made yet.")).toBeVisible());
  expect(gateway.addEvidence).toHaveBeenCalledWith(expect.objectContaining({
    actionId: "action",
    expectedRevision: 1,
    supersedesId: ""
  }));
  fireEvent.click(screen.getByText("Before and after comparison"));
  for (const [label, value] of [["Before from", "2026-10-01"], ["Before end (exclusive)", "2026-10-02"], ["After from", "2026-10-08"], ["After end (exclusive)", "2026-10-09"]]) fireEvent.change(screen.getByLabelText(label), {
    target: {
      value
    }
  });
  fireEvent.click(screen.getByRole("button", {
    name: "Calculate observed comparison"
  }));
  expect(await screen.findByText("40% observed reduction")).toBeVisible();
  expect(screen.getByText(/does not establish causality/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", {
    name: "Save comparison evidence"
  }));
  await waitFor(() => expect(gateway.saveComparison).toHaveBeenCalledWith(expect.objectContaining({
    expectedRevision: 2,
    selection: expect.objectContaining({
      scope: "asset"
    })
  })));
  await screen.findByText("Saved comparison evidence (1)");
  fireEvent.click(screen.getByText("Saved comparison evidence (1)"));
  expect(screen.getByText("Publication revision").nextElementSibling).toHaveTextContent("retained-publication-revision");
});
test("access denial remains visible without presenting mutation controls", async () => {
  const {
    application
  } = setup({
    catalog: async () => {
      throw new Error("Improvement Tracking requires current Administrator, Team Leader or Task Force access.");
    }
  });
  render(<ImprovementWorkspace application={application} timeZone="UTC" />);
  expect(await screen.findByRole("alert")).toHaveTextContent("requires current");
  expect(screen.queryByRole("button", {
    name: "New action"
  })).not.toBeInTheDocument();
});
test("navigation to linked assets/issues is caller-owned", async () => {
  const linked = {
    ...initial,
    data: {
      ...initial.data,
      issueId: "issue"
    },
    issueTitle: "Drive issue"
  };
  const {
    application
  } = setup({
    history: async () => ({
      action: linked,
      revisions: [],
      nextBefore: 0
    })
  });
  const asset = jest.fn(),
    issue = jest.fn();
  render(<ImprovementWorkspace application={application} timeZone="UTC" onOpenAsset={asset} onOpenIssue={issue} />);
  fireEvent.click(await screen.findByRole("button", {
    name: "Reduce repeated alarms"
  }));
  fireEvent.click(await screen.findByRole("button", {
    name: "Open linked asset: Drive"
  }));
  fireEvent.click(screen.getByRole("button", {
    name: "Open linked issue: Drive issue"
  }));
  expect(asset).toHaveBeenCalledWith("asset");
  expect(issue).toHaveBeenCalledWith("issue");
});

test("refines and pages a large registry while retaining the selected asset", async () => {
  const {gateway}=setup();
  const lookup=jest.fn(async(search:string,cursor:string)=>({
    assets: search ? [{id:"distant",code:"REG-5655",name:"Distant scanner",status:"validated" as const}]
      : cursor ? [{id:"next",code:"REG-0101",name:"Next drive",status:"validated" as const}] : catalog.assets,
    total:search?1:5655,nextCursor:search||cursor?"":"next-page"
  }));
  render(<ImprovementWorkspace application={new ImprovementApplication(gateway,()=>"new",lookup)} timeZone="UTC"/>);
  fireEvent.click(await screen.findByRole("button",{name:"New action"}));
  expect(await screen.findByText(/5655 registered assets/)).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:"Load more assets"}));
  expect(await screen.findByRole("option",{name:"REG-0101 · Next drive"})).toBeVisible();
  fireEvent.change(screen.getByLabelText("Find registered asset"),{target:{value:"5655"}});
  expect(await screen.findByRole("option",{name:"REG-5655 · Distant scanner"})).toBeVisible();
  fireEvent.change(screen.getByLabelText("Linked asset"),{target:{value:"distant"}});
  fireEvent.change(screen.getByLabelText("Find registered asset"),{target:{value:""}});
  await waitFor(()=>expect(screen.getByLabelText("Linked asset")).toHaveValue("distant"));
  expect(lookup).toHaveBeenCalledWith("","next-page");
});

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ImprovementApplication, type Gateway } from "../src/features/improvement-tracking/application/improvement";
import { ImprovementWorkspace } from "../src/features/improvement-tracking/adapters/react/ImprovementWorkspace";
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
  expect(screen.getByText("Publication revision: retained-publication-revision")).toBeInTheDocument();
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
